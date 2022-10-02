const DataTypes = require('sequelize');
const { Model } = DataTypes;

module.exports = class SubCategory extends Model {
    static init(sequelize) {
        return super.init({
            label: {
                type: DataTypes.STRING(20),
                allowNull: false,
                unique: 'label',
            },
            enabled: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
            },
            order: {
                type: DataTypes.INTEGER,
                allowNull: true,
                unique: 'order',
            }
        }, {
            modelName: 'SubCategory',
            tableName: 'subCategories',
            charset: 'utf8',
            collate: 'utf8_general_ci',
            sequelize
        });
    };
    static associate(db) {
        db.SubCategory.belongsTo(db.Category);
        db.SubCategory.hasMany(db.Post);
        db.SubCategory.hasMany(db.PostView);
        db.SubCategory.hasMany(db.TopPost);
    };
};