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
router.post('/', async (req, res, next) => {
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
router.post('/login', (req, res, next) => {
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
                    exclude: ['password'],
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
router.post(`/logout`, (req, res) => { 
    req.logout();
    req.session.destroy();
    res.send('로그아웃 되었습니다!');
});

// GET USER // GET /user
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
                attributes: ['id', 'admin', 'adsAdmin', 'enabled'],
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

// CHANGE NICKNAME // PATCH /user/nickname
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
router.patch('/nickname', async (req, res, next) => {
    try {
        User.update({
            nickname: req.body.nickname,
        }, {
            where: {
                id: req.user.id
            }
        });
        res.status(200).json({ nickname: req.body.nickname });
    } catch (error) {
        console.error(error);
        next(error);
    };
});
// CHANGE DESCRIPTION // PATCH /user/description
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
router.patch('/description', async (req, res, next) => {
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
router.patch('/:userId/enable', async (req, res, next) => {
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
router.patch('/admin', async (req, res, next) => {
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
router.patch('/adsAdmin', async (req, res, next) => {
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