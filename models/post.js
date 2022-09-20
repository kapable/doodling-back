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
        db.Post.belongsToMany(db.User, { through: "PostLike", as: "Likers" });
        db.Post.belongsToMany(db.User, { through: "PostLink", as: "Linkers" });
        db.Post.belongsToMany(db.User, { through: "PostView", as: "Viewers" });
    };
};