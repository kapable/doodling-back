const ads = require('./ads');
// const category = require('./category');
const subCategory = require('./subCategory');
const comment = require('./comment');
const image = require('./image');
const post = require('./post');
const user = require('./user');

const Sequelize = require('sequelize');
const env = process.env.NODE_ENV || 'development';
const config = require('../config/config.js')[env];
const db = {};

const sequelize = new Sequelize(config.database, config.username, config.password, config);

db.Ads = ads;
// db.Category = category;
db.SubCategory = subCategory;
db.Comment = comment;
db.Image = image;
db.Post = post;
db.User = user;

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