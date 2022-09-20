const DataTypes = require('sequelize');
const { Model } = DataTypes;

module.exports = class Ads extends Model {
    static init(sequelize) {
        return super.init({ 
            campaign: {
                type: DataTypes.STRING(20),
                allowNull: false,
                unique: true,
            },
            link: {
                type: DataTypes.STRING(200),
                allowNull: false,
            },
        }, {
            modelName: 'Ads',
            tableName: 'adss',
            charset: 'utf8',
            collate: 'utf8_general_ci',
            sequelize
        });
    };
    static associate(db) {
        // db.Ads.hasOne(db.Image);
    };
};