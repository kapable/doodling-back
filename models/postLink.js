const DataTypes = require('sequelize');
const { Model } = DataTypes;

module.exports = class PostLink extends Model {
    static init(sequelize) {
        return super.init({
        }, {
            modelName: "PostLink",
            tableName: "PostLink",
            charset: 'utf8',
            collate: 'utf8_general_ci',
            sequelize
        });
    };
    static associate(db) {
        db.PostLink.belongsTo(db.Post);
        db.PostLink.belongsTo(db.User);
    };
};