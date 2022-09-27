const DataTypes = require('sequelize');
const { Model } = DataTypes;

module.exports = class PostView extends Model {
    static init(sequelize) {
        return super.init({
            viewId: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            }
        }, {
            modelName: "PostView",
            tableName: "PostView",
            charset: 'utf8',
            collate: 'utf8_general_ci',
            sequelize
        });
    };
    static associate(db) {
        db.PostView.belongsTo(db.Post, {
            foreignKey: 'PostId', sourceKey: 'id'
        });
        db.PostView.belongsTo(db.User, {
            foreignKey: 'UserId', sourceKey: 'id'
        });
    };
};