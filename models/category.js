const DataTypes = require('sequelize');
const { Model } = DataTypes;

module.exports = class Category extends Model {
    static init(sequelize) {
        return super.init({
            label: {
                type: DataTypes.STRING(20),
                allowNull: false,
            },
            domain: {
                type: DataTypes.STRING(20),
                allowNull: true,
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
            modelName: 'Category',
            tableName: 'categories',
            charset: 'utf8',
            collate: 'utf8_general_ci',
            sequelize
        });
    };
    static associate(db) {
        db.Category.hasOne(db.Image);
        db.Category.hasMany(db.SubCategory);
        db.Category.hasMany(db.Post);
        db.Category.hasMany(db.TopPost);
        db.Category.hasMany(db.PostView);
    };
};