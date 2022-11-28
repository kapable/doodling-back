const DataTypes = require('sequelize');
const { Model } = DataTypes;

module.exports = class PostReport extends Model {
    static init(sequelize) {
        return super.init({
        }, {
            modelName: "PostReport",
            tableName: "PostReport",
            charset: 'utf8',
            collate: 'utf8_general_ci',
            sequelize
        });
    };
    static associate(db) {
        db.PostReport.belongsTo(db.Post);
        db.PostReport.belongsTo(db.User);
        db.PostReport.belongsTo(db.ReportLabel);
    };
};