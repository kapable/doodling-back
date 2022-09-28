const DataTypes = require('sequelize');
const { Model } = DataTypes;

module.exports = class PostLike extends Model {
    static init(sequelize) {
        return super.init({
            likeId: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: 'likeId'
            },
        }, {
            modelName: "PostLike",
            tableName: "PostLike",
            charset: 'utf8',
            collate: 'utf8_general_ci',
            sequelize
        });
    };
    static associate(db) {
        db.PostLike.belongsTo(db.Post, {
            foreignKey: 'PostId', sourceKey: 'id'
        });
        db.PostLike.belongsTo(db.User, {
            foreignKey: 'UserId', sourceKey: 'id'
        });
    };
};