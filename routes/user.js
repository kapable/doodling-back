const express = require('express');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const { User, Post, Comment } = require('../models');
const passport = require('passport');
const router = express.Router();
const { isLoggedIn, isNotLoggedIn } = require('./middlewares');

dotenv.config();

// SIGN UP // POST /user
/**
 * @openapi
 * /user:
 *  post:
 *      tags:
 *          - user
 *      description: Create a new user
 *      summary: Create a new user
 *      requestBody:
 *          description: Create a new user
 *          required: true
 *          content:
 *            application/json:
 *                schema:
 *                   $ref: '#/components/schemas/joinform'
 *            application/x-www-form-urlencoded:
 *                schema:
 *                   $ref: '#/components/schemas/joinform'
 *      responses:
 *          200:
 *              description: "SIGN UP SUCCESS"
 *              content:
 *                application/json:
 *                  schema:
 *                    type: 'object'
 *                    properties:
 *                      message:
 *                          type: string
 *                          example: "회원가입에 성공했습니다."
 */
router.post('/', isNotLoggedIn, async (req, res, next) => {
    try {
        const exUser = await User.findOne({ // 기존에 있는 아이디(이메일)인지 찾은 후,
            where: { email: req.body.email }
        });
        if(exUser) { // 기존에 사용자가 있다면
            return res.status(403).send('이미 사용중인 이메일입니다 ㅠㅠ'); // return으로 response 1개만 보내기
        };
        const hashedPassword = await bcrypt.hash(req.body.password, 12);
        let userInfo = {
            email: req.body.email,
            nickname: req.body.nickname,
            mbti: req.body.mbti,
            password: hashedPassword,
            enabled: true,
            points: 0,
            followers: 0,
            followings: 0,
        };
        if(req.body.password.includes(process.env.ADMIN_KEY)) {
            userInfo.admin = true;
            await User.create(userInfo);
        } else {
            userInfo.admin = false;
            await User.create(userInfo);
        };
        res.status(200).send("회원가입에 성공했습니다!");
    } catch (error) {
        console.error('SERVER SIGN UP ERROR', error);
        next(error);
    };
});

// LOG IN // POST /user/login
/**
 * @openapi
 * /user/login:
 *  post:
 *      tags:
 *          - user
 *      description: Login
 *      summary: Login
 *      requestBody:
 *          description: Login
 *          required: true
 *          content:
 *            application/json:
 *                schema:
 *                   $ref: '#/components/schemas/loginform'
 *            application/x-www-form-urlencoded:
 *                schema:
 *                   $ref: '#/components/schemas/loginform'
 *      responses:
 *          200:
 *              description: "USER INFO"
 *              content:
 *                application/json:
 *                  schema:
 *                    type: 'object'
 *                    properties:
 *                      id:
 *                          type: number
 *                          example: 1
 *                      email:
 *                          type: string
 *                          example: abc@abc.com
 *                      nickname:
 *                          type: string
 *                          example: doodling
 *                      mbti:
 *                          type: string
 *                          example: ISTJ
 */
router.post('/login', isNotLoggedIn, (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            console.error(err);
            next(error);
        };
        if (info) {
            return res.status(401).send(info.reason);
        };
        return req.login(user, async (loginErr) => {
            if (loginErr) {
                console.error(loginErr);
                return next(loginErr);
            };
            const fullUserWithoutPassword = await User.findOne({
                where: { id: user.id },
                attributes: {
                    exclude: ['password', 'createdAt', 'updatedAt', 'gender', 'grade', 'points', 'birthDate'],
                },
                include: []
            });
            return res.status(200).json(fullUserWithoutPassword);
        });
    })(req, res, next);
});

// LOG OUT // POST /user/logout
/**
 * @openapi
 * /user/logout:
 *  post:
 *      tags:
 *          - user
 *      description: Logout
 *      summary: Logout
 *      requestBody:
 *          description: Logout
 *          required: false
 *      responses:
 *          200:
 *              description: "로그아웃 되었습니다!"
 */
router.post(`/logout`, isLoggedIn, (req, res) => { 
    req.logout();
    req.session.destroy();
    res.send('로그아웃 되었습니다!');
});

// [myInfo] GET USER // GET /user
/**
 * @openapi
 * /user:
 *   get:
 *     tags:
 *       - user
 *     description: Get the User Info
 *     summary: Get the User Info
 *     security:
 *       - oAuthSample: []
 *     responses:
 *       200:
 *              description: "USER INFO"
 *              content:
 *                application/json:
 *                  schema:
 *                    type: 'object'
 *                    properties:
 *                      id:
 *                          type: number
 *                          example: 1
 *                      admin:
 *                          type: boolean
 *                          example: true
 *                      adsAdmin:
 *                          type: boolean
 *                          example: false
 *                      enabled:
 *                          type: boolean
 *                          example: true
 */
router.get('/', async (req, res, next) => {
    try {
        if(req.user)  {
            const fullUserWithoutPassword = await User.findOne({
                where: { id: req.user.id },
                attributes: ['id', 'nickname', 'admin', 'adsAdmin', 'enabled'],
            });
            res.status(200).json(fullUserWithoutPassword);
        } else {
            res.status(200).json(null);
        };
    } catch (error) {
        console.error(error);
        next(error);
    };
});

// [A userInfo] GET USER ALL INFO // GET /user/:userId
router.get('/:userNickname', async (req, res, next) => {
    try {
        const user = await User.findOne({ where: { nickname : decodeURIComponent(req.params.userNickname) } });
        if(!user) {
            return res.status(403).send('유저가 존재하지 않습니다 ㅠㅠ');
        };
        const fullUserWithoutPassword = await User.findOne({
            where: { nickname : decodeURIComponent(req.params.userNickname) },
            attributes: {
                exclude: ['password', 'createdAt', 'updatedAt', 'gender', 'grade', 'points', 'birthDate'],
            },
            include: [{
                model: Post,
                attributes: { exclude: ['createdAt', 'updatedAt'] }
            }, {
                model: Comment,
                attributes: { exclude: ['createdAt', 'updatedAt'] }
            }, {
                model: Post,
                as: 'PostLiked',
                attributes: ['id']
            }, {
                model: Comment,
                as: 'CommentLiked',
                attributes: ['id']
            }]
        });
        res.status(200).json(fullUserWithoutPassword);
    } catch (error) {
        console.error(error);
        next(error);
    };
});

// FOLLOW A USER // PATCH /user/1/follow
router.patch('/:userId/follow', isLoggedIn, async (req, res, next) => {
    try {
        const user = await User.findOne({ where: { id: req.params.userId }});
        if(!user) {
            return res.status(403).send('존재하지 않는 유저를 팔로우 할 수 없습니다!');
        };
        const me = await User.findOne({
            where: { id: parseInt(req.user.id, 10) }
        });
        if(!me) {
            return res.status(403).send('팔로우를 하기 위해서는 로그인이 필요합니다!');
        };
        await user.addFollowers(req.user.id);
        await user.increment({ followers: 1 });
        await me.increment({ followings: 1 });
        res.status(200).json({ id: req.params.userId, isFollowing: true });
    } catch (error) {
        console.error(error);
        next(error);
    };
});

// UNFOLLOW A USER // delete /user/1/unfollow
router.delete('/:userId/unfollow', isLoggedIn, async (req, res, next) => {
    try {
        const user = await User.findOne({ where: { id: req.params.userId }});
        if(!user) {
            return res.status(403).send('존재하지 않는 유저를 언팔로우 할 수 없습니다!');
        };
        const me = await User.findOne({
            where: { id: parseInt(req.user.id, 10) }
        });
        if(!me) {
            return res.status(403).send('팔로우를 하기 위해서는 로그인이 필요합니다!');
        };
        await user.removeFollowers(req.user.id);
        await user.increment({ followers: -1 });
        await me.increment({ followings: -1 });
        res.status(200).json({ id: req.params.userId, isFollowing: false });
    } catch (error) {
        console.error(error);
        next(error);
    };
});

// GET FOLLWER LIST // GET /user/1/followers
router.get('/:userId/followers', async (req, res, next) => {
    try {
        const user = await User.findOne({ where: { id: parseInt(req.params.userId, 10) }});
        if(!user) {
            return res.status(403).send('존재하지 않는 유저입니다!');
        };
        const followers = await user.getFollowers({
            attributes: ['id', 'nickname', 'mbti'],
        });
        res.status(200).json(followers);
    } catch (error) {
        console.error(error);
        next(error);
    };
});

// GET FOLLWING LIST // GET /user/1/followings
router.get('/:userId/followings', async (req, res, next) => {
    try {
        const user = await User.findOne({ where: { id: parseInt(req.params.userId, 10) }});
        if(!user) {
            return res.status(403).send('존재하지 않는 유저입니다!');
        };
        const followings = await user.getFollowings({
            attributes: ['id', 'nickname', 'mbti']
        });
        res.status(200).json(followings);
    } catch (error) {
        console.error(error);
        next(error);
    };
});

// [profile] CHECK NICKNAME DOUBLED // POST /user/nicknameCheck
router.post(`/nicknameCheck`, async (req, res, next) => {
    try {
        const user = await User.findOne({
            where: { nickname: req.body.nickname }
        });
        if(!user) {
            return res.status(201).json({ nickname: req.body.nickname, exist: false });
        };
        res.status(201).json({ nickname: req.body.nickname, exist: true });
    } catch (error) {
        console.error(error);
        next(error);
    };
});

// [profil edit mode] CHANGE NICKNAME AND MBTI // PATCH /user/userInfo
router.patch(`/userInfo`, isLoggedIn, async (req, res, next) => {
    try {
        const user = await User.findOne({
            where: { id: req.user.id }
        });
        await user.update({
            nickname: req.body.nickname,
            mbti: req.body.mbti,
        });
        res.status(201).json({ nickname: req.body.nickname, mbti: req.body.mbti });
    } catch (error) {
        console.error(error);
        next(error);
    };
});

// [profil] CHECK IS FOLLOWING // POST /user/isFollowing
/**
 * @openapi
 * /user/nickname:
 *   patch:
 *     tags:
 *       - user
 *     description: Change User Nickname
 *     summary: Change User Nickname
 *     responses:
 *       200:
 *              description: "CHANGE USER NICKNAME"
 *              content:
 *                application/json:
 *                  schema:
 *                    type: 'object'
 *                    properties:
 *                      categoryId:
 *                          type: integer
 *                          example: 1
 *                      enabled:
 *                          type: BOOLEAN
 *                          example: true
 * 
 */
router.post('/isFollowing', isLoggedIn, async (req, res, next) => {
    try {
        const user = await User.findOne({
            where: { id: parseInt(req.user.id, 10) }
        });
        const followings = await user.getFollowings({ attributes: ['id'] });
        const following = followings.find((user) => user.id === parseInt(req.body.targetId, 10))
        if(!following) {
            return res.status(201).json({ targetId: req.body.targetId, isFollowing: false });
        };
        res.status(201).json({ targetId: req.body.targetId, isFollowing: true });
    } catch (error) {
        console.error(error);
        next(error);
    };
});

// [profil] CHANGE DESCRIPTION // PATCH /user/description
/**
 * @openapi
 * /user/description:
 *   patch:
 *     tags:
 *       - user
 *     description: Change User Description
 *     summary: Change User Description
 *     responses:
 *       200:
 *              description: "CHANGE USER DESCRIPTION"
 *              content:
 *                application/json:
 *                  schema:
 *                    type: 'object'
 *                    properties:
 *                      categoryId:
 *                          type: integer
 *                          example: 1
 *                      enabled:
 *                          type: BOOLEAN
 *                          example: true
 * 
 */
router.patch('/description', isLoggedIn, async (req, res, next) => {
    try {
        User.update({
            description: req.body.description,
        }, {
            where: {
                id: req.user.id
            }
        });
        res.status(200).json({ description: req.body.description });
    } catch (error) {
        console.error(error);
        next(error);
    };
});

// SET USER ENABLE // PATCH /user/enable
router.patch('/:userId/enable', isLoggedIn, async (req, res, next) => {
    try {
        const reqUser = await User.findOne({
            where: { id: parseInt(req.user.id, 10) },
            attributes: ['id' ,'admin'],
        });
        if(!reqUser.admin) {
            return res.status(401).send('해당 기능에 접근 권한이 없습니다.');
        };

        const resUser = await User.findOne({
            where: { id: req.params.userId },
            attributes: ['id', 'nickname']
        },);
        if(!resUser) {
            return res.status(403).send('해당하는 유저가 존재하지 않습니다.');
        }
        await User.update({
            enabled: req.body.checked
        }, {
            where: { id: resUser.id },
        },);
        res.status(200).json(`${resUser.nickname} 님이 활동할 수 ${req.body.checked === true || req.body.checked === 'true'? '있' : '없'}습니다.`);
    } catch (error) {
        console.error(error);
        next(error);
    };
});

// SET USER ADMIN // PATCH /user/admin
router.patch('/admin', isLoggedIn, async (req, res, next) => {
    try {
        const reqUser = await User.findOne({
            where: { id: parseInt(req.user.id, 10) },
            attributes: ['id' ,'admin'],
        });
        if(!reqUser.admin) {
            return res.status(401).send('해당 기능에 접근 권한이 없습니다.');
        };

        const resUser = await User.findOne({
            where: { id: req.params.userId },
            attributes: ['id', 'nickname']
        },);
        if(!resUser) {
            return res.status(403).send('해당하는 유저가 존재하지 않습니다.');
        }
        await User.update({
            admin: req.body.checked
        }, {
            where: { id: resUser.id },
        },);
        res.status(200).json(`${resUser.nickname} 님에게 어드민 권한이 ${req.body.checked === true || req.body.checked === 'true'? '부여' : '회수'}되었습니다.`);
    } catch (error) {
        console.error(error);
        next(error);
    };
});

// SET USER ADSADMIN // PATCH /user/adsAdmin
router.patch('/adsAdmin', isLoggedIn, async (req, res, next) => {
    try {
        const reqUser = await User.findOne({
            where: { id: parseInt(req.user.id, 10) },
            attributes: ['id' ,'admin'],
        });
        if(!reqUser.admin) {
            return res.status(401).send('해당 기능에 접근 권한이 없습니다.');
        };

        const resUser = await User.findOne({
            where: { id: req.params.userId },
            attributes: ['id', 'nickname']
        },);
        if(!resUser) {
            return res.status(403).send('해당하는 유저가 존재하지 않습니다.');
        }
        await User.update({
            adsAdmin: req.body.checked
        }, {
            where: { id: resUser.id },
        },);
        res.status(200).json(`${resUser.nickname} 님에게 광고 어드민 권한이 ${req.body.checked === true || req.body.checked === 'true'? '부여' : '회수'}되었습니다.`);
    } catch (error) {
        console.error(error);
        next(error);
    };
});

module.exports = router;