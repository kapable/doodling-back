const DataTypes = require('sequelize');
const { Model } = DataTypes;

module.exports = class PostReport extends Model {
    static init(sequelize) {
        return super.init({
            reportId: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            label: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
        }, {
            modelName: "PostReport",
            tableName: "PostReport",
            charset: 'utf8',
            collate: 'utf8_general_ci',
            sequelize
        });
    };
    static associate(db) {
        db.PostReport.belongsTo(db.Post, {
            foreignKey: 'PostId', sourceKey: 'id'
        });
        db.PostReport.belongsTo(db.User, {
            foreignKey: 'UserId', sourceKey: 'id'
        });
    };
};