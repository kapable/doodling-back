const DataTypes = require('sequelize');
const { Model } = DataTypes;

module.exports = class PostView extends Model {
    static init(sequelize) {
        return super.init({
        }, {
            modelName: "PostView",
            tableName: "PostView",
            charset: 'utf8',
            collate: 'utf8_general_ci',
            sequelize
        });
    };
    static associate(db) {
        db.PostView.belongsTo(db.Post);
        db.PostView.belongsTo(db.Category);
        db.PostView.belongsTo(db.SubCategory);
        db.PostView.belongsTo(db.User);
    };
};