const ads = require('./ads');
const category = require('./category');
const subCategory = require('./subCategory');
const comment = require('./comment');
const reComment = require('./reComment');
const image = require('./image');
const post = require('./post');
const user = require('./user');
const postView = require('./postView');
const postReport = require('./postReport');
const reportLabel = require('./reportLabel');
const postLike = require('./postLike');
const postLink = require('./postLink');
const topPosts = require('./topPost');

const Sequelize = require('sequelize');
const env = process.env.NODE_ENV || 'development';
const config = require('../config/config.js')[env];
const db = {};

const sequelize = new Sequelize(config.database, config.username, config.password, config);

db.Ads = ads;
db.Category = category;
db.SubCategory = subCategory;
db.Comment = comment;
db.ReComment = reComment;
db.Image = image;
db.Post = post;
db.User = user;
db.PostView = postView;
db.PostReport = postReport;
db.ReportLabel = reportLabel;
db.PostLike = postLike;
db.PostLink = postLink;
db.TopPost = topPosts;

Object.keys(db).forEach(modelName => {
  db[modelName].init(sequelize);
});

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;