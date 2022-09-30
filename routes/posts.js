const express = require('express');
const { Op } = require("sequelize");
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const multerS3 = require('multer-s3');
const AWS = require('aws-sdk');
const { Comment, Post, SubCategory, User, PostReport, PostView, TopPost  } = require('../models');
const { isLoggedIn } = require('./middlewares');
const router = express.Router();

// GET REALTIME TOP 100 // GET /posts/top100RealTime
router.get('/top100RealTime', async (req, res, next) => {
    try {
        const realTimeTopPosts = await TopPost.findAll({
            where: { realTimeRank: { [Op.not]: null } },
            attributes: ['PostId', 'realTimeRank'],
            include: [{
                model: Post,
            }]
        });
        res.status(200).json(realTimeTopPosts);
    } catch (error) {
        console.error(error);
        next(error);
    };
});

module.exports = router;