const express = require('express');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const { User, Post, Comment } = require('../models');
const passport = require('passport');
const router = express.Router();

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
        console.log("THIS", req.body.email);
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

module.exports = router;