const DataTypes = require('sequelize');
const { Model } = DataTypes;

module.exports = class TopPost extends Model {
    static init(sequelize) {
        return super.init({
            realTimeRank: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            weeklyRank: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            monthlyRank: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
        }, {
            modelName: 'TopPost',
            tableName: 'topPosts',
            charset: 'utf8',
            collate: 'utf8_general_ci',
            sequelize
        });
    };
    static associate(db) {
        db.TopPost.belongsTo(db.Post);
    };
};