const DataTypes = require('sequelize');
const { Model } = DataTypes;

module.exports = class Post extends Model {
    static init(sequelize) {
        return super.init({
            title: {
                type: DataTypes.STRING(70),
                allowNull: false,
            },
            text: {
                type: DataTypes.TEXT,
                allowNull: false,
            },
            noticeTop: {
                type: DataTypes.BOOLEAN,
                allowNull: true,
            },
            // for banning a abusing post
            enabled: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
            },
        }, {
            modelName: 'Post',
            tableName: 'posts',
            charset: 'utf8mb4',
            collate: 'utf8mb4_general_ci',
            sequelize
        });
    };
    static associate(db) {
    };
};