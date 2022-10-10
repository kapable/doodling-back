const express = require('express');
const { Op } = require("sequelize");
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const multerS3 = require('multer-s3');
const AWS = require('aws-sdk');
const { Comment, Post, SubCategory, User, PostReport, PostView, Category, PostLike  } = require('../models');
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
            cb(null, `image/${extension}`);
        },
    }) : multer.diskStorage({
        destination(req, file, done) {
            done(null, 'uploads');
        },
        filename(req, file, done) {
            const ext = path.extname(file.originalname);
            const basename = Buffer.from(path.basename(file.originalname, ext), 'latin1').toString('utf8').replace(/[`\s~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/g, '');
            done(null, basename + '_' + new Date().getTime() + ext);
        },
    }),
    limits: { fileSize: 20 * 1024 * 1024 },
});

// ADD IMAGES
router.post(`/images`, upload.array('image'), async (req, res, next) => { // POST /post/images
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
router.post('/', async (req, res, next) => {
    try {
        const post = await Post.create({
            UserId: parseInt(req.body.userId, 10),
            title: req.body.title,
            text: req.body.text,
            SubCategoryId: parseInt(req.body.subCategoryId, 10),
            enabled: true,
            views: 0,
        });
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
            where: { id: parseInt(req.params.postId, 10) }
        });
        if(!post) {
            return res.status(403).send('해당 게시글이 존재하지 않습니다ㅠㅠ');
        };
        const fullPost = await Post.findOne({
            where: { id: parseInt(req.params.postId, 10)},
            include: [{
                model: SubCategory,
                attributes: ['id', 'label']
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
router.post('/:postId/comment', async (req, res, next) => {
    try {
        const post = await Post.findOne({
            where: { id: parseInt(req.params.postId, 10) }
        });
        if(!post) {
            return res.status(403).send('존재하지 않는 게시글입니다 ㅠㅠ');
        };
        const comment = await Comment.create({
            text: req.body.text,
            UserId: req.body.id,
            PostId: parseInt(req.params.postId, 10),
        });
        const fullComment = await Comment.findOne({
            where: { id: comment.id },
            include: [{
                model: User,
                attributes: ['id', 'nickname', 'mbti']
            },]
        });
        res.status(201).json(fullComment);
    } catch (error) {
        console.error(error);
        next(error);
    };
});

// SET A POST ENABLE // PATCH /post/1/enable
router.patch('/:postId/enable', async (req, res, next) => {
    try {
        const reqUser = await User.findOne({
            where: { id: parseInt(req.user.id, 10) },
            attributes: ['id' ,'admin'],
        });
        if(!reqUser.admin) {
            return res.status(401).send('해당 기능에 접근 권한이 없습니다.');
        };

        const reqPost = await Post.findOne({
            where: { id: req.params.postId },
            attributes: ['id', 'title'],
        });
        if(!reqPost) {
            return res.status(403).send('해당 포스트가 존재하지 않습니다.');
        };
        await Post.update({
            enabled: req.body.checked,
        }, {
            where: { id: reqPost.id }
        });
        res.status(200).send(`${reqPost.title} 포스트는 볼 수 ${req.body.checked === true || req.body.checked === 'true'? '있' : '없'}습니다.`);
    } catch (error) {
        console.error(error);
        next(error);
    };
});

// LIKE A POST // PATCH /post/1/like
router.patch('/:postId/like', async (req, res, next) => {
    try {
        const likePost = await Post.findOne({ where: { id: req.params.postId } });
        if(!likePost) {
            return res.status(403).send('해당 포스트가 존재하지 않습니다.');
        }
        await likePost.addPostLikers(parseInt(req.body.id, 10));
        res.status(200).json({ PostId: likePost.id, UserId: parseInt(req.body.id, 10) });
    } catch (error) {
        console.error(error);
        next(error);
    };
});

// REMOVE LIKE A POST // DELETE /post/1/like
router.delete('/:postId/like', async (req, res, next) => {
    try {
        const likePost = await Post.findOne({ where: { id: req.params.postId } });
        if(!likePost) {
            return res.status(403).send('해당 포스트가 존재하지 않습니다.');
        };
        await likePost.removePostLikers(parseInt(req.body.id, 10));
        res.status(200).json({ PostId: likePost.id, UserId: parseInt(req.body.id, 10) });
    } catch (error) {
        console.error(error);
        next(error);
    };
});

// REPORT A POST // PATCH /post/1/report
router.patch('/:postId/report', async (req, res, next) => {
    try {
        const reportedPost = await Post.findOne({ where: { id: req.params.postId } });
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
        const viewedPost = await Post.findOne({ where: { id: req.params.postId } });
        if(!viewedPost) {
            return res.status(403).send('해당 포스트가 존재하지 않습니다.');
        };
        const viewedSubCategory = await viewedPost.getSubCategory();
        const viewedCategory = await viewedSubCategory.getCategory();
        await PostView.create({
            PostId: req.params.postId,
            UserId: req?.body?.id ? req.body.id :  null ,
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

module.exports = router;