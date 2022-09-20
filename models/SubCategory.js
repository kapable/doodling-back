const DataTypes = require('sequelize');
const { Model } = DataTypes;

module.exports = class SubCategory extends Model {
    static init(sequelize) {
        return super.init({
            label: {
                type: DataTypes.STRING(20),
                allowNull: false,
                unique: true,
            },
            enabled: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
            }
        }, {
            modelName: 'SubCategory',
            tableName: 'subCategories',
            charset: 'utf8',
            collate: 'utf8_general_ci',
            sequelize
        })
    }
    static associate(db) {
    };
};