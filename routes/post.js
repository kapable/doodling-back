const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const multerS3 = require('multer-s3');
const AWS = require('aws-sdk');
const { Comment, Post, SubCategory, User  } = require('../models');
const { isLoggedIn } = require('./middlewares');
const router = express.Router();

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
            SubCategoryId: req.body.subCategoryId,
            enabled: true,
        });
        const fullPost = await Post.findOne({
            where: { id: post.id },
            include: [{
                model: SubCategory,
                attributes: ['id', 'label'],
            }, {
                model: User,
                attributes: ['id', 'nickname', 'mbti']
            }]
        });
        res.status(201).json(fullPost);
    } catch (error) {
        console.error(error);
        next(error);
    };
});

// ADD COMMENT // POST /1/comment
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
            UserId: req.body.userId,
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

module.exports = router;