const express = require('express');
const { Comment, Post, User  } = require('../models');
const { isLoggedIn } = require('./middlewares');
const router = express.Router();

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
router.post('/:commentId/reComment', async (req, res, next) => {
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
        const reComment = await Comment.create({
            text: req.body.text,
            UserId: req.body.userId,
            PostId: parseInt(req.body.postId, 10),
            ReCommentId: parseInt(req.params.commentId, 10)
        });
        const fullReComment = await Comment.findOne({
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
router.patch('/:commentId/like', async (req, res, next) => {
    try {
        const likeComment = await Comment.findOne({ where: { id: req.params.commentId } });
        if(!likeComment) {
            return res.status(403).send('해당 댓글이 존재하지 않습니다.');
        }
        await likeComment.addCommentLikers(parseInt(req.body.id, 10));
        res.status(200).json({ CommentId: likeComment.id, UserId: parseInt(req.body.id, 10) });
    } catch (error) {
        console.error(error);
        next(error);
    }
});

// REMOVE LIKE A COMMENT // DELETE /comment/1/like
router.delete('/:commentId/like', async (req, res, next) => {
    try {
        const likeComment = await Comment.findOne({ where: { id: req.params.commentId } });
        if(!likeComment) {
            return res.status(403).send('해당 댓글이 존재하지 않습니다.');
        };
        await likeComment.removeCommentLikers(parseInt(req.body.id, 10));
        res.status(200).json({ CommentId: likeComment.id, UserId: parseInt(req.body.id, 10) });
    } catch (error) {
        console.error(error);
        next(error);
    };
});

module.exports = router;