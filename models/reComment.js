const DataTypes = require('sequelize');
const { Model } = DataTypes;

module.exports = class ReComment extends Model {
    static init(sequelize) {
        return super.init({
            text: {
                type: DataTypes.TEXT,
                allowNull: false,
            },
        }, {
            modelName: 'ReComment',
            tableName: 'reComments',
            charset: 'utf8mb4',
            collate: 'utf8mb4_general_ci',
            sequelize
        });
    };
    static associate(db) {
        db.ReComment.belongsTo(db.User);
        db.ReComment.belongsTo(db.Comment);
    };
};