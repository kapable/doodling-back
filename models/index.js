const post = require('./post');
// const user = require('./user');
// const comment = require('./comment');
// const image = require('./image');
// const thumbnail = require('./thumbnail');
// const category = require('./category');
// const url = require('./url');

const Sequelize = require('sequelize');
const env = process.env.NODE_ENV || 'development';
const config = require('../config/config.js')[env];
const db = {};

const sequelize = new Sequelize(config.database, config.username, config.password, config);

db.Post = post;
// db.User = user;
// db.Comment = comment;
// db.Image = image;
// db.Thumbnail = thumbnail;
// db.Category = category;
// db.Url = url;

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