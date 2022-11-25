const express = require('express');
const { Op, where } = require("sequelize");
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const multerS3 = require('multer-s3');
const AWS = require('aws-sdk');
const { Comment, Post, SubCategory, User, PostReport, PostView, Category, PostLike, ReComment  } = require('../models');
const { isLoggedIn } = require('./middlewares');
const router = express.Router();

try {
    fs.accessSync('uploads');
} catch (error) {
    console.log('uploads 폴더가 존재하지 않아 생성합니다');
    fs.mkdirSync('uploads');
};
AWS.config.update({
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    region: 'ap-northeast-2',
});
const upload = multer({
    storage:
    process.env.NODE_ENV === 'production'
        ? multerS3({
        s3: new AWS.S3(),
        bucket: 'doodling-images',
        key(req, file, cb) {
            cb(null, `original/${Date.now()}_${
                Buffer.from(path.basename(file.originalname), 'latin1').toString('utf8').replace(/[`\s~!@#$%^&*()_|+\-=?;:'",<>\{\}\[\]\\\/]/g, '')
            }`)
        },
        contentType(req, file, cb) {
            const extension = path.extname(file.originalname).replace('.','');
            cb(null, `image/${extension === '.heic' ? '.jpeg' : extension}`);
        },
    }) : multer.diskStorage({
        destination(req, file, done) {
            done(null, 'uploads');
        },
        filename(req, file, done) {
            const ext = path.extname(file.originalname);
            const basename = Buffer.from(path.basename(file.originalname, ext === '.heic' ? '.jpeg' : ext), 'latin1').toString('utf8').replace(/[`\s~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/g, '');
            done(null, basename + '_' + new Date().getTime() + ext);
        },
    }),
    limits: { fileSize: 20 * 1024 * 1024 },
});

// ADD IMAGES
router.post(`/images`, isLoggedIn, upload.array('image'), async (req, res, next) => { // POST /post/images
    try {
        res.status(200).json(req.files.map((v) => process.env.NODE_ENV === 'production' ? `https://images.doodling.kr/${v.key}`.replace(/\/original\//, '/resized/') : `${process.env.DEV_BACKURL}/${v.filename}`));
    } catch (error) {
        console.error(error);
        next(error);
    }
});

// UPLOAD POST // POST /post
/**
 * @openapi
 * /post:
 *  post:
 *      tags:
 *          - post
 *      description: Upload a Post
 *      summary: Upload a Post
 *      requestBody:
 *          description: Upload a Post
 *          required: true
 *          content:
 *            application/json:
 *                schema:
 *                   $ref: '#/components/schemas/uploadform'
 *            application/x-www-form-urlencoded:
 *                schema:
 *                   $ref: '#/components/schemas/uploadform'
 *      responses:
 *          200:
 *              description: "POST UPLOAD SUCCESS"
 *              content:
 *                application/json:
 *                  schema:
 *                    type: 'object'
 *                    properties:
 *                      {
 *                          title: {
 *                                      type: 'string',
 *                                      example: 'Sample Title'
 *                                  },
 *                          text: {
 *                                      type: 'string',
 *                                      example: '<p>Sample contents</p>'
 *                                  },
 *                          subCategory: {
 *                                      type: 'integer',
 *                                      example: 3
 *                                  },
 *                          userId: {
 *                                      type: 'integer',
 *                                      example: 1
 *                                  },
 *                          category: {
 *                                      type: 'integer',
 *                                      example: 2
 *                                  },
 *                      }
 */
router.post('/', isLoggedIn, async (req, res, next) => {
    try {
        const post = await Post.create({
            UserId: parseInt(req.user.id, 10),
            title: req.body.title,
            text: req.body.text,
            CategoryId: req.body.categoryId,
            SubCategoryId: parseInt(req.body.subCategoryId, 10),
            enabled: true,
            views: 0,
            likes: 0,
            comments: 0,
        });
        const user = await User.findOne({
            where: { id: parseInt(req.user.id, 10) },
        });
        await user.increment({ posts: 1 });
        const fullPost = await Post.findOne({
            where: { id: post.id },
            attributes: ['id'],
            include: [{
                model: SubCategory,
                attributes: ['domain'],
                include: [{
                    model: Category,
                    attributes: ['domain']
                }]
            }]
        });
        res.status(201).json(fullPost);
    } catch (error) {
        console.error(error);
        next(error);
    };
});

// LOAD A POST // POST /post/:postId
/**
 * @openapi
 * /:postId:
 *   get:
 *     tags:
 *       - post
 *     description: Get a Post
 *     summary: Get a Post
 *     responses:
 *       200:
 *              description: "GET A POST"
 *              content:
 *                application/json:
 *                  schema:
 *                    type: 'object'
 *                    properties:
 *                      categories:
 *                          type: array
 *                          example: ['MBTI', 'TOP100']
 */
router.get('/:postId', async (req, res, next) => {
    try {
        const post = await Post.findOne({
            where: { id: parseInt(req.params.postId, 10), enabled: true }
        });
        if(!post) {
            return res.status(403).send('해당 게시글이 존재하지 않습니다ㅠㅠ');
        };
        const fullPost = await Post.findOne({
            where: { id: parseInt(req.params.postId, 10)},
            include: [{
                model: SubCategory,
                attributes: ['id', 'label'],
                include:[{
                    model: Category,
                    attributes: ['id', 'label']
                }]
            }, {
                model: User,
                attributes: ['id', 'nickname', 'mbti']
            }, {
                model: Comment,
                include: [{
                    model: User,
                    attributes: ['id', 'nickname', 'mbti'],
                }, {
                    model: ReComment,
                    include: [{
                        model: User,
                        attributes: ['id', 'nickname', 'mbti']
                    },],
                    order: [
                        ['createdAt', 'DESC']
                    ],
                } ,{
                    model: User,
                    as: 'CommentLikers',
                    attributes: ['id']
                }],
                order: [
                    ['createdAt', 'DESC']
                ],
                separate: true,
                limit: 10,
            },],
        });
        const postLikers = await fullPost.getPostLikers({ attributes: ['id'] });
        const postComments = await fullPost.getComments({ attributes: ['id'] });
        let rawFullPost = fullPost.get({ plain: true });
        rawFullPost.PostLikers = postLikers.length;
        rawFullPost.PostComments = postComments.length;
        res.status(200).json(rawFullPost);
    } catch (error) {
        console.error(error);
        next(error);
    };
});

// ADD COMMENT // POST /post/1/comment
/**
 * @openapi
 * /:postId/post:
 *  post:
 *      tags:
 *          - post
 *      description: Upload a Comment
 *      summary: Upload a Comment
 *      requestBody:
 *          description: Upload a Comment
 *          required: true
 *          content:
 *            application/json:
 *                schema:
 *                   $ref: '#/components/schemas/uploadform'
 *            application/x-www-form-urlencoded:
 *                schema:
 *                   $ref: '#/components/schemas/uploadform'
 *      responses:
 *          200:
 *              description: "POST UPLOAD SUCCESS"
 *              content:
 *                application/json:
 *                  schema:
 *                    type: 'object'
 *                    properties:
 *                      {
 *                          title: {
 *                                      type: 'string',
 *                                      example: 'Sample Title'
 *                                  },
 *                          text: {
 *                                      type: 'string',
 *                                      example: '<p>Sample contents</p>'
 *                                  },
 *                          subCategory: {
 *                                      type: 'integer',
 *                                      example: 3
 *                                  },
 *                          userId: {
 *                                      type: 'integer',
 *                                      example: 1
 *                                  },
 *                          category: {
 *                                      type: 'integer',
 *                                      example: 2
 *                                  },
 *                      }
 */
router.post('/:postId/comment', isLoggedIn, async (req, res, next) => {
    try {
        const post = await Post.findOne({
            where: { id: parseInt(req.params.postId, 10), enabled: true }
        });
        if(!post) {
            return res.status(403).send('존재하지 않는 게시글입니다 ㅠㅠ');
        };
        const comment = await Comment.create({
            text: req.body.text,
            UserId: req.user.id,
            PostId: parseInt(req.params.postId, 10),
        });
        const fullComment = await Comment.findOne({
            where: { id: comment.id },
            include: [{
                model: User,
                attributes: ['id', 'nickname', 'mbti']
            }, {
                model: User,
                as: 'CommentLikers',
                attributes: ['id']
            }]
        });
        await post.increment({ comments: 1 });
        const user = await User.findOne({
            where: { id: parseInt(req.user.id, 10) },
        });
        const exComment = await Comment.findOne({
            where: { PostId: parseInt(req.params.postId, 10), UserId: parseInt(req.user.id, 10) }
        });
        if(!exComment) { // if user not commented before,
            await user.increment({ comments: 1 });
        };
        res.status(201).json(fullComment);
    } catch (error) {
        console.error(error);
        next(error);
    };
});

// UPDATE A POST CONTENTS // PATCH /post/1
router.patch('/:postId', isLoggedIn, async (req, res, next) => {
    try {
        const reqUser = await User.findOne({
            where: { id: parseInt(req.user.id, 10) },
            attributes: ['id' ,'admin'],
        });
        const reqPost = await Post.findOne({
            where: { id: req.params.postId, enabled: true },
            attributes: ['id', 'title', 'UserId'],
        });
        if(!reqPost) {
            return res.status(403).send('해당 포스트가 존재하지 않습니다.');
        };
        if(reqUser.id !== reqPost.UserId || reqUser.admin) {
            return res.status(401).send('글쓴이 또는 어드민만 수정할 수 있습니다.');
        };
        const fullPost = await Post.update({
            title: req.body.title,
            text: req.body.text,
            CategoryId: req.body.categoryId,
            SubCategoryId: parseInt(req.body.subCategoryId, 10),
        }, {
            where: { id: reqPost.id },
            attributes: ['id'],
            include: [{
                model: SubCategory,
                attributes: ['domain'],
                include: [{
                    model: Category,
                    attributes: ['domain']
                }]
            }]
        });
        res.status(201).json(fullPost);
    } catch (error) {
        console.error(error);
        next(error);
    };
});

// SET A POST ENABLE // PATCH /post/1/enable
router.patch('/:postId/enable', isLoggedIn, async (req, res, next) => {
    try {
        const reqUser = await User.findOne({
            where: { id: parseInt(req.user.id, 10) },
            attributes: ['id' ,'admin'],
        });
        const reqPost = await Post.findOne({
            where: { id: req.params.postId },
            attributes: ['id', 'title', 'UserId'],
        });
        if(!reqPost) {
            return res.status(403).send('해당 포스트가 존재하지 않습니다.');
        };
        if(reqUser.id !== reqPost.UserId || reqUser.admin) {
            return res.status(401).send('글쓴이 또는 어드민만 수정할 수 있습니다.');
        };
        await Post.update({
            enabled: req.body.checked,
        }, {
            where: { id: reqPost.id },
        });
        const fullPost = await Post.findOne({
            where: { id: parseInt(req.params.postId, 10)},
            include: [{
                model: SubCategory,
                attributes: ['id', 'label'],
                include:[{
                    model: Category,
                    attributes: ['id', 'label']
                }]
            }, {
                model: User,
                attributes: ['id', 'nickname', 'mbti']
            }, {
                model: Comment,
                include: [{
                    model: Comment,
                    as: 'ReComment'
                }]
            }],
        });
        const postLikers = await fullPost.getPostLikers();
        let rawFullPost = fullPost.get({ plain: true });
        rawFullPost.PostLikers = postLikers.length;
        res.status(200).json(rawFullPost);
    } catch (error) {
        console.error(error);
        next(error);
    };
});

// LIKE A POST // PATCH /post/1/like
router.patch('/:postId/like', isLoggedIn, async (req, res, next) => {
    try {
        const likePost = await Post.findOne({ where: { id: req.params.postId, enabled: true } });
        if(!likePost) {
            return res.status(403).send('해당 포스트가 존재하지 않습니다.');
        }
        await likePost.addPostLikers(parseInt(req.user.id, 10));
        await likePost.increment({ likes: 1 });
        const user = await User.findOne({
            where: { id: parseInt(req.user.id, 10) },
        });
        await user.increment({ postLikes: 1 });
        res.status(200).json({ id: likePost.id, UserId: parseInt(req.user.id, 10) });
    } catch (error) {
        console.error(error);
        next(error);
    };
});

// [each post & admin page] REMOVE A POST // DELETE /post/1/remove
router.delete('/:postId/remove', async (req, res, next) => {
    try {
        const post = await Post.findOne({
            where: { id: parseInt(req.params.postId, 10) }
        });
        if(!post) {
            return res.status(403).send('해당 포스트는 존재하지 않습니다.');
        };
        await post.update({ enabled: false });
        res.status(200).json(post);
    } catch (error) {
        console.error(error);
        next(error);
    };
});

// [each post & admin page] REVIVE A POST // PATCH /post/1/revive
router.patch('/:postId/revive', async (req, res, next) => {
    try {
        const post = await Post.findOne({
            where: { id: parseInt(req.params.postId, 10) }
        });
        if(!post) {
            return res.status(403).send('해당 포스트는 존재하지 않습니다.');
        };
        await post.update({ enabled: true });
        res.status(200).json(post);
    } catch (error) {
        console.error(error);
        next(error);
    };
});

// REMOVE LIKE A POST // DELETE /post/1/like
router.delete('/:postId/like', isLoggedIn, async (req, res, next) => {
    try {
        const likePost = await Post.findOne({ where: { id: req.params.postId }, enabled: true });
        if(!likePost) {
            return res.status(403).send('해당 포스트가 존재하지 않습니다.');
        };
        await likePost.removePostLikers(parseInt(req.user.id, 10));
        await likePost.increment({ likes: -1 });
        const user = await User.findOne({
            where: { id: parseInt(req.user.id, 10) },
        });
        await user.increment({ postLikes: -1 });
        res.status(200).json({ id: likePost.id, UserId: parseInt(req.user.id, 10) });
    } catch (error) {
        console.error(error);
        next(error);
    };
});

// REPORT A POST // PATCH /post/1/report
router.patch('/:postId/report', async (req, res, next) => {
    try {
        const reportedPost = await Post.findOne({ where: { id: req.params.postId }, enabled: true });
        if(!reportedPost) {
            return res.status(403).send('해당 포스트가 존재하지 않습니다.');
        };
        await PostReport.create({
            PostId: req.params.postId,
            UserId: parseInt(req.body.id, 10),
            label: req.body.reportLabel,
        });
        res.status(200).json({ PostId: reportedPost.id, UserId: parseInt(req.body.id, 10) });
    } catch (error) {
        console.error(error);
        next(error);
    };
});

// VIEW A POST // PATCH /post/1/view
router.patch('/:postId/view', async (req, res, next) => {
    try {
        const viewedPost = await Post.findOne({ where: { id: req.params.postId }, enabled: true });
        if(!viewedPost) {
            return res.status(403).send('해당 포스트가 존재하지 않습니다.');
        };
        const viewedSubCategory = await viewedPost.getSubCategory();
        const viewedCategory = await viewedSubCategory.getCategory();
        await PostView.create({
            PostId: req.params.postId,
            UserId: req?.user?.id ||  null,
            SubCategoryId: parseInt(viewedSubCategory.dataValues.id, 10),
            CategoryId: parseInt(viewedCategory.dataValues.id, 10),
        });
        await viewedPost.increment({ views: 1 });
        res.sendStatus(200);
    } catch (error) {
        console.error(error);
        next(error);
    };
});

// CHECK IS MY POST // POST /post/1/checkMine
router.post(`/:postId/checkMine`, isLoggedIn, async (req, res, next) => {
    try {
        const post = await Post.findOne({
            where: { id: parseInt(req.params.postId, 10) },
            attributes: ['id', 'UserId', 'enabled'],
        });
        if(!post) {
            return res.status(403).send('해당 게시글은 존재하지 않습니다.');
        };
        if(post.enabled == false) {
            return res.status(403).send('해당 게시글은 삭제된 상태입니다.');
        };
        if(post.UserId !== parseInt(req.user.id, 10)) {
            return res.status(201).json({ isMine: false, postId: post.id });
        };
        res.status(201).json({ isMine: true, postId: post.id });
    } catch (error) {
        console.error(error);
        next(error);
    };
});

module.exports = router;