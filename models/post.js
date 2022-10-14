const DataTypes = require('sequelize');
const { Model } = DataTypes;

module.exports = class Post extends Model {
    static init(sequelize) {
        return super.init({
            title: {
                type: DataTypes.STRING(70),
                allowNull: false,
            },
            text: {
                type: DataTypes.TEXT,
                allowNull: false,
            },
            noticeTop: {
                type: DataTypes.BOOLEAN,
                allowNull: true,
            },
            // for banning a abusing post
            enabled: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
            },
            views: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            likes: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            comments: {
                type: DataTypes.INTEGER,
                allowNull: false,
            }
        }, {
            modelName: 'Post',
            tableName: 'posts',
            charset: 'utf8mb4',
            collate: 'utf8mb4_general_ci',
            sequelize
        });
    };
    static associate(db) {
        db.Post.belongsTo(db.User);
        db.Post.hasMany(db.Comment);
        db.Post.hasMany(db.Image);
        db.Post.belongsTo(db.SubCategory);
        db.Post.belongsTo(db.Category);
        db.Post.hasMany(db.TopPost);
        db.Post.belongsToMany(db.User, { through: "PostLike", as: "PostLikers" });
        db.Post.hasMany(db.PostLink);
        db.Post.hasMany(db.PostView);
        db.Post.hasMany(db.PostReport);
    };
};