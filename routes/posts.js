const express = require('express');
const { Op, fn, col, where } = require("sequelize");
const { Post, TopPost, SubCategory, Category, User, PostLike, PostView  } = require('../models');
const router = express.Router();

// [top100 page] GET TOP 100 WITH PERIOD // GET /posts/top100
router.get(`/top100/:period`, async (req, res, next) => {
    try {
        let where = {};
        let attributes = ['PostId'];
        if(req.params.period === 'realtime') {
            where = {
                [Op.and]: [
                    { realTimeRank: { [Op.not]: null } },
                    { CategoryId: { [Op.is]: null } },
                    { SubCategoryId: { [Op.is]: null } },
                ]
            };
            attributes.push('realTimeRank');
        } else if (req.params.period === 'weekly') {
            where = {
                [Op.and]: [
                    { weeklyRank: { [Op.not]: null } },
                    { CategoryId: { [Op.is]: null } },
                    { SubCategoryId: { [Op.is]: null } },
                ]
            };
            attributes.push('weeklyRank');
        } else if (req.params.period === 'monthly') {
            where = {
                [Op.and]: [
                    { monthlyRank: { [Op.not]: null } },
                    { CategoryId: { [Op.is]: null } },
                    { SubCategoryId: { [Op.is]: null } },
                ]
            };
            attributes.push('monthlyRank');
        } else {
            return res.status(403).send('TOP 100에 대한 기간 parmas가 필요합니다.');
        }
        const topPosts = await TopPost.findAll({
            where: where,
            attributes: attributes,
            include: [{
                model: Post,
                attributes: ['id', 'title', 'createdAt', 'comments', 'likes', 'views'],
                    include: [{
                        model: User,
                        attributes: ['id', 'nickname', 'mbti']
                    }, {
                        model: Category,
                        attributes: ['id', 'domain', 'label']
                    }, {
                        model: SubCategory,
                        attributes: ['id', 'domain']
                    },]
            }],
            limit: 100,
        })
        res.status(200).json(topPosts);
    } catch (error) {
        console.error(error);
        next(error);
    }
});

// [home main page] GET REALTIME TOP 10 // GET /posts/top10RealTime
router.get('/top10RealTime', async (req, res, next) => {
    try {
        const realTimeTopPosts = await TopPost.findAll({
            where: {
                [Op.and]: [
                    { realTimeRank: { [Op.not]: null } },
                    { CategoryId: { [Op.is]: null } },
                    { SubCategoryId: { [Op.is]: null } },
                ]
            },
            attributes: ['PostId', 'realTimeRank'],
            include: [{
                model: Post,
                attributes: ['id', 'title', 'createdAt', 'comments'],
                    include: [{
                        model: User,
                        attributes: ['id', 'nickname', 'mbti']
                    }, {
                        model: Category,
                        attributes: ['id', 'domain', 'label']
                    }, {
                        model: SubCategory,
                        attributes: ['id', 'domain']
                    },]
            }],
            limit: 10
        });
        res.status(200).json(realTimeTopPosts);
    } catch (error) {
        console.error(error);
        next(error);
    };
});

// [each category main page] GET CATEGORY REALTIME TOP 5 // GET /posts/:categoryDomain/top5CategoryRealTime
router.get('/:categoryDomain/top5CategoryRealTime', async (req, res, next) => {
    try {
        const category = await Category.findOne({
            where: { domain: req.params.categoryDomain },
            attributes: ['id'],
            raw: true
        });
        const categoryRealTimeTopPosts = await TopPost.findAll({
            where: {
                [Op.and]: [
                    { realTimeRank: { [Op.not]: null } },
                    { CategoryId: parseInt(category.id ,10) },
                    { SubCategoryId: { [Op.is]: null } },
                ]
            },
            attributes: ['PostId', 'realTimeRank'],
            include: [{
                model: Post,
                attributes: ['id', 'title', 'createdAt', 'views', 'likes', 'comments'],
                    include: [{
                        model: User,
                        attributes: ['id', 'nickname', 'mbti']
                    }, {
                        model: Category,
                        attributes: ['id', 'domain', 'label']
                    }, {
                        model: SubCategory,
                        attributes: ['id', 'domain']
                    },]
            }],
            limit: 5,
        });
        res.status(200).json(categoryRealTimeTopPosts);
    } catch (error) {
        console.error(error);
        next(error);
    };
});

// [each subCategory page] GET SUBCATEGORY REALTIME TOP 5 // GET /posts/:subCategoryDomain/top5SubCategoryRealTime
router.get('/:subCategoryDomain/top5SubCategoryRealTime', async (req, res, next) => {
    try {
        const subCategory = await SubCategory.findOne({
            where: { domain: req.params.subCategoryDomain },
            attributes: ['id'],
            raw: true,
        });
        const subCategoryRealTimeTopPosts = await TopPost.findAll({
            where: {
                [Op.and]: [
                    { realTimeRank: { [Op.not]: null } },
                    { CategoryId: { [Op.is]: null } },
                    { SubCategoryId: parseInt(subCategory.id ,10) },
                ]
            },
            attributes: ['PostId', 'realTimeRank'],
            include: [{
                model: Post,
                attributes: ['id', 'title', 'createdAt', 'views', 'likes', 'comments'],
                    include: [{
                        model: User,
                        attributes: ['id', 'nickname', 'mbti']
                    }, {
                        model: Category,
                        attributes: ['id', 'domain', 'label']
                    }, {
                        model: SubCategory,
                        attributes: ['id', 'domain']
                    },]
            }],
            limit: 5,
        });
        res.status(200).json(subCategoryRealTimeTopPosts);
    } catch (error) {
        console.error(error);
        next(error);
    };
});

// [each category main page] GET CATEGORY NEW 15 POSTS // GET /posts/:categoryId/new15Category
router.get('/:categoryDomain/new15Category', async (req, res, next) => {
    try {
        let subCategories = await SubCategory.findAll({
            // where: { CategoryId: parseInt(req.params.categoryId , 10) },
            attributes: ['id'],
            include: [{
                model: Category,
                attributes: ['id', 'domain'],
                where: { domain: req.params.categoryDomain }
            }],
            raw: true
        });
        subCategories = subCategories.map(v => v.id);
        let where = { SubCategoryId: { [Op.in]: subCategories } };
        if (parseInt(req.query.lastId, 10)) { // for not first loading
            where.id = { [Op.lt]: parseInt(req.query.lastId, 10)}
        };
        const categoryNewPosts = await Post.findAll({
            where: where,
            limit: 45,
            order: [["createdAt", 'DESC']],
            attributes: ['id', 'title', 'createdAt', 'views', 'likes'],
            include: [{
                model: User,
                attributes: ['id', 'nickname', 'mbti']
            }, {
                model: SubCategory,
                attributes: ['id', 'domain'],
                include: [{
                    model: Category,
                    attributes: ['id', 'domain'],
                }]
            }],
        });
        res.status(200).json(categoryNewPosts);
    } catch (error) {
        console.error(error);
        next(error);
    };
});

// GET CATEGORY NEW 5 POSTS // GET /posts/:categoryId/new5Category
router.get('/:categoryId/new5Category', async (req, res, next) => {
    try {
        let subCategories = await SubCategory.findAll({
            where: { CategoryId: parseInt(req.params.categoryId , 10) },
            attributes: ['id'],
            raw: true
        });
        subCategories = subCategories.map(v => v.id)
        const categoryNewPosts = await Post.findAll({
            where: { SubCategoryId: { [Op.in]: subCategories } },
            limit: 15,
            order: [["createdAt", 'DESC']],
            attributes: ['id', 'title', 'createdAt', 'views', 'likes'],
            include: [{
                model: User,
                attributes: ['id', 'nickname', 'mbti']
            },],
        });
        res.status(200).json(categoryNewPosts);
    } catch (error) {
        console.error(error);
        next(error);
    };
});

// [main home page] GET CATEGORY NEW 5 POSTS // GET /posts/new5Categories
router.get('/new5Categories', async (req, res, next) => {
    try {
        const categories = await Category.findAll({
            where: { [Op.and]: [
                { domain: { [Op.not]: '' } },
                { domain: { [Op.not]: 'top100' } },
            ]},
            attributes: ['id', 'label', 'domain'],
            raw: true,
        });
        let newContents = []; 
        await Promise.all(categories.map(async (cat) => {
            let new5Contents = await Post.findAll({
                where: { CategoryId: cat.id },
                order: [['createdAt', 'DESC']],
                limit: 5,
                attributes: ['id', 'title', 'createdAt'],
                include: [{
                    model: User,
                    attributes: ['id', 'nickname', 'mbti']
                }, {
                    model: SubCategory,
                    attributes: ['id', 'domain']
                }],
                raw: true,
            });
            return newContents.push({ id: cat.id, label: cat.label, domain: cat.domain, posts: new5Contents });
        }));
        res.status(200).json(newContents);
    } catch (error) {
        console.error(error);
        next(error);
    };
});

// [each subCategory page] GET SUBCATEGORY NEW 15 POSTS // GET /posts/:subCategoryDomain/new15SubCategory
router.get('/:subCategoryDomain/new15SubCategory', async (req, res, next) => {
    try {
        const subCategory = await SubCategory.findOne({
            where: { domain: req.params.subCategoryDomain },
            attributes: ['id', 'domain'],
            raw: true
        });
        let where = { SubCategoryId: parseInt(subCategory.id, 10) };
        if (parseInt(req.query.lastId, 10)) { // for not first loading
            where.id = { [Op.lt]: parseInt(req.query.lastId, 10)}
        };
        const subCategoryNewPosts = await Post.findAll({
            where: where,
            limit: 15,
            order: [["createdAt", 'DESC']],
            attributes: ['id', 'title', 'createdAt', 'views', 'likes'],
            include: [{
                model: User,
                attributes: ['id', 'nickname', 'mbti']
            }, {
                model: SubCategory,
                attributes: ['id', 'domain'],
                include: [{
                    model: Category,
                    attributes: ['id', 'domain'],
                }]
            }],
        });
        res.status(200).json(subCategoryNewPosts);
    } catch (error) {
        console.error(error);
        next(error);
    };
});

// [notice main page] GET CATEGORY's EACH SUB NEW 5 POSTS // GET /posts/:categoryDomain/new5SubCategoryPosts
router.get('/:categoryDomain/new5SubCategoryPosts', async (req, res, next) => {
    try {
        const category = await Category.findOne({
            where: { domain: req.params.categoryDomain },
            attributes: ['id', 'label', 'domain'],
            raw: true,
        });
        const subCategories = await SubCategory.findAll({
            where: { CategoryId: category.id },
            attributes: ['id', 'label', 'domain'],
            raw: true,
        });
        let newContents = []; 
        await Promise.all(subCategories.map(async (subCat) => {
            if(subCat?.domain !== '') { // filtering 카테고리 전체 
                let new5Contents = await Post.findAll({
                    where: { SubCategoryId: subCat.id },
                    order: [['createdAt', 'DESC']],
                    limit: 5,
                    attributes: ['id', 'title', 'createdAt'],
                    include: [{
                        model: User,
                        attributes: ['id', 'nickname', 'mbti']
                    }, {
                        model: Category,
                        attributes: ['id', 'domain']
                    }, {
                        model: SubCategory,
                        attributes: ['id', 'domain']
                    },],
                    raw: true,
                });
                return newContents.push({ id: subCat.id, label: subCat.label, domain: subCat.domain, posts: new5Contents });
            }
        }));
        res.status(200).json(newContents);
    } catch (error) {
        console.error(error);
        next(error);
    };
});

module.exports = router;