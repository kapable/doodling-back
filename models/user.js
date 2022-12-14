const DataTypes = require('sequelize');
const { Model } = DataTypes;

module.exports = class User extends Model {
    static init(sequelize) {
        return super.init({
            email: {
                type: DataTypes.STRING(30),
                allowNull: false,
                unique: 'email',
            },
            nickname: {
                type: DataTypes.STRING(30),
                allowNull: false,
                unique: 'nickname',
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
                type: DataTypes.INTEGER,
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
                type: DataTypes.DATE,
                allowNull: true,
            },
            followers: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            followings: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            posts: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            postLikes: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            comments: {
                type: DataTypes.INTEGER,
                allowNull: false,
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
        db.User.hasMany(db.ReComment);
        db.User.belongsToMany(db.Post, { through: "PostLike", as: "PostLiked" });
        db.User.hasMany(db.PostView);
        db.User.hasMany(db.PostReport);
        db.User.hasMany(db.PostLink);
        db.User.belongsToMany(db.Comment, { through: "CommentLike", as: "CommentLiked" });
        db.User.belongsToMany(db.User, { through: "Follow", as: "Followers", foreignKey: "FollowingId" });
        db.User.belongsToMany(db.User, { through: "Follow", as: "Followings", foreignKey: "FollowerId" });
    };
};