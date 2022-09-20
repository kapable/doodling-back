const express = require('express');
const multer = require('multer')
const path = require('path');
const fs = require('fs');
const multerS3 = require('multer-s3');
const AWS = require('aws-sdk');
// const { Ads, Category, Comment, Image. Post, SubCategory, User  } = require('../models');
// const { isLoggedIn } = require('./middlewares');
const router = express.Router();

module.exports = router;