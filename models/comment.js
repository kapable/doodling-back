const DataTypes = require('sequelize');
const { Model } = DataTypes;

module.exports = class Comment extends Model {
    static init(sequelize) {
        return super.init({
            text: {
                type: DataTypes.TEXT,
                allowNull: false,
            },
        }, {
            modelName: 'Comment',
            tableName: 'comments',
            charset: 'utf8mb4',
            collate: 'utf8mb4_general_ci',
            sequelize
        });
    };
    static associate(db) {
        db.Comment.belongsTo(db.User);
        db.Comment.belongsTo(db.Post);
        db.Comment.belongsToMany(db.User, { through: "CommentLike", as: "CommentLikers" });
        db.Comment.belongsTo(db.Comment, { as: "ReComment" });
    };
};