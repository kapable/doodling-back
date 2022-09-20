const DataTypes = require('sequelize');
const { Model } = DataTypes;

module.exports = class User extends Model {
    static init(sequelize) {
        return super.init({
            email: {
                type: DataTypes.STRING(30),
                allowNull: false,
                unique: true,
            },
            nickname: {
                type: DataTypes.STRING(30),
                allowNull: false,
            },
            password: {
                type: DataTypes.STRING(70),
                allowNull: false,
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            mbti: {
                type: DataTypes.STRING(10),
                allowNull: false,
            },
            admin: {
                type: DataTypes.BOOLEAN,
                allowNull: true,
            },
            // for Ads clients
            adsAdmin: {
                type: DataTypes.BOOLEAN,
                allowNull: true,
            },
            // for banning a abusing user
            enabled: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
            },
            points: {
                type: DataTypes.NUMBER,
                allowNull: false,
            },
            grade: {
                type: DataTypes.STRING(15),
                allowNull: true,
            },
            gender: {
                type: DataTypes.STRING(10),
                allowNull: true,
            },
            birthDate: {
                type: DataTypes.DATEONLY,
                allowNull: true,
            },
        }, {
            modelName: 'User',
            tableName: 'users',
            charset: 'utf8',
            collate: 'utf8_general_ci',
            sequelize
        });
    };
    static associate(db) {
        db.User.hasMany(db.Post);
        db.User.hasMany(db.Comment);
        db.User.belongsToMany(db.Post, { through: "PostLike", as: "Liked" });
        db.User.belongsToMany(db.Post, { through: "PostLink", as: "Linked" });
        db.User.belongsToMany(db.Post, { through: "PostView", as: "Viewed" });
        db.User.belongsToMany(db.Comment, { through: "CommentLike", as: "Liked" });
    };
};