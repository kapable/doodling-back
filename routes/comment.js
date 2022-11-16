const express = require('express');
const { Op } = require('sequelize');
const { Comment, Post, User, ReComment  } = require('../models');
const { isLoggedIn } = require('./middlewares');
const router = express.Router();

// REMOVE A COMMENT // DELETE /commnet/1
router.delete(`/:commentId`, async (req, res, next) => {
    try {
        const comment = await Comment.findOne({
            where: { id: parseInt(req.params.commentId ,10) }
        });
        if(!comment) {
            return res.status(403).send('이미 존재하지 않는 댓글입니다.');
        };
        await Comment.destroy({
            where: { id: parseInt(req.params.commentId ,10) }
        });
        res.status(200).json({ commentId: parseInt(req.params.commentId ,10) });
    } catch (error) {
        console.error(error);
        next(error);
    }
});

// ADD RE-COMMENT // POST /comment/1/reComment
/**
 * @openapi
 * /:commentId/reComment:
 *  post:
 *      tags:
 *          - reComment
 *      description: Upload a ReComment
 *      summary: Upload a ReComment
 *      requestBody:
 *          description: Upload a ReComment
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
router.post('/:commentId/reComment', isLoggedIn, async (req, res, next) => {
    try {
        const exComment = await Comment.findOne({
            where: { id: parseInt(req.params.commentId, 10) }
        });
        if(!exComment) {
            return res.status(403).send("해당하는 댓글이 존재하지 않습니다 ㅠㅠ");
        };
        const post = await Post.findOne({
            where: { id: parseInt(req.body.postId, 10) }
        });
        if(!post) {
            return res.status(403).send('존재하지 않는 게시글입니다 ㅠㅠ');
        };
        const reComment = await ReComment.create({
            text: req.body.text,
            UserId: req.user.id,
            CommentId: parseInt(req.params.commentId, 10),
        });
        const fullReComment = await ReComment.findOne({
            where: { id: reComment.id },
            include: [{
                model: User,
                attributes: ['id', 'nickname', 'mbti']
            },]
        });
        res.status(201).json(fullReComment);
    } catch (error) {
        console.error(error);
        next(error);
    };
});

// LIKE A COMMENT // PATCH /comment/1/like
router.patch('/:commentId/like', isLoggedIn, async (req, res, next) => {
    try {
        const likeComment = await Comment.findOne({ where: { id: req.params.commentId } });
        if(!likeComment) {
            return res.status(403).send('해당 댓글이 존재하지 않습니다.');
        }
        await likeComment.addCommentLikers(parseInt(req.user.id, 10));
        const likers = await likeComment.getCommentLikers({ attributes: ['id'] })
        res.status(200).json({ id: likeComment.id, likers });
    } catch (error) {
        console.error(error);
        next(error);
    }
});

// REMOVE LIKE A COMMENT // DELETE /comment/1/like
router.delete('/:commentId/like', isLoggedIn, async (req, res, next) => {
    try {
        const unLikeComment = await Comment.findOne({ where: { id: req.params.commentId } });
        if(!unLikeComment) {
            return res.status(403).send('해당 댓글이 존재하지 않습니다.');
        };
        await unLikeComment.removeCommentLikers(parseInt(req.user.id, 10));
        const likers = await unLikeComment.getCommentLikers({ attributes: ['id'] })
        res.status(200).json({ id: unLikeComment.id, likers });
    } catch (error) {
        console.error(error);
        next(error);
    };
});

// LOAD MORE COMMENTS OF A POST // GET /comment/1
router.get('/:postId', async (req, res, next) => {
    try {
        const post = await Post.findOne({
            where: { id: parseInt(req.params.postId, 10) },
            attributes: ['id']
        });
        if(!post) {
            return res.status(403).send('존재하지 않는 게시글입니다');
        };
        const fullComments = await Comment.findAll({
            where: {
                id: { [Op.lt]: parseInt(req.query.lastId ,10)},
                PostId: parseInt(req.params.postId, 10)
            },
            limit: 10,
            order: [['createdAt', 'DESC']],
            include: [{
                model: User,
                attributes: ['id', 'nickname', 'mbti'],
            }, {
                model: Comment,
                as: 'ReComment',
                include: [{
                    model: User,
                    attributes: ['id', 'nickname', 'mbti']
                }]
            }, {
                model: User,
                as: 'CommentLikers',
                attributes: ['id']
            }]
        });
        res.status(201).json(fullComments);
    } catch (error) {
        console.error(error);
        next(error);
    };
});

module.exports = router;