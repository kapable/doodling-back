const DataTypes = require('sequelize');
const { Model } = DataTypes;

module.exports = class ReportLabel extends Model {
    static init(sequelize) {
        return super.init({
            label: {
                type: DataTypes.STRING(30),
                allowNull: false,
            },
        }, {
            modelName: "ReportLabel",
            tableName: "reportLabels",
            charset: 'utf8',
            collate: 'utf8_general_ci',
            sequelize
        });
    };
    static associate(db) {
        db.ReportLabel.hasMany(db.PostReport);
    };
};