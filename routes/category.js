const express = require('express');
const { Category, SubCategory } = require('../models');
const { isLoggedIn } = require('./middlewares');
const router = express.Router();
const { Op } = require("sequelize");

// ADD CATEGORY // POST /category
/**
 * @openapi
 * /category:
 *  post:
 *      tags:
 *          - category
 *      description: Create a new category
 *      summary: Create a new category
 *      requestBody:
 *          description: Create a new category
 *          required: true
 *          content:
 *            application/json:
 *                schema:
 *                   $ref: '#/components/schemas/categoryform'
 *            application/x-www-form-urlencoded:
 *                schema:
 *                   $ref: '#/components/schemas/categoryform'
 *      responses:
 *          200:
 *              description: "ADD CATEGORY SUCCESS"
 *              content:
 *                application/json:
 *                  schema:
 *                    type: 'object'
 *                    properties:
 *                      message:
 *                          type: string
 *                          example: "카테고리 생성에 성공했습니다."
 */
router.post('/', async (req, res, next) => {
    console.log(req);
    try {
        const exCategory = await Category.findOne({
            where: { label: req.body.label }
        });
        if(exCategory) {
            return res.status(403).send("이미 존재하는 카테고리입니다.");
        };
        const categoryOrders = await Category.findAll({
            attributes: ['order'],
            raw: true,
        });
        let orders = categoryOrders.map(v => v.order);
        const order = Math.max(...orders) + 1 || 1;
        await Category.create({
            label: req.body.label,
            domain: req.body.domain,
            enabled: false,
            order: order
        });
        const categories = await Category.findAll({
            order: [
                ['id', 'ASC']
            ],
        });
        res.status(201).json(categories);
    } catch (error) {
        console.error(error);
        next(error);
    };
});

// LOAD CATEGORIES // GET /category
/**
 * @openapi
 * /category:
 *   get:
 *     tags:
 *       - category
 *     description: Get the categories
 *     summary: Get the categories
 *     responses:
 *       200:
 *              description: "CATEGORIES LIST"
 *              content:
 *                application/json:
 *                  schema:
 *                    type: 'object'
 *                    properties:
 *                      categories:
 *                          type: array
 *                          example: ['MBTI', 'TOP100']
 */
router.get('/', async (req, res, next) => {
    try {
        const categories = await Category.findAll({
            order: [
                ['id', 'ASC']
            ],
        });
        res.status(200).send(categories);
    } catch (error) {
        console.error(error);
        next(error);
    }
});

// LOAD CATEGORIES AND SUBCATEGORIES // GET /category/withSubs
router.get('/withSubs', async (req, res, next) => {
    try {
        const categories = await Category.findAll({
            order: [
                ['order', 'ASC']
            ],
            where: { enabled: true },
            include: [{
                model: SubCategory,
                order: [
                    ['order', 'ASC']
                ],
                // where: { enabled: true },
                attributes: {
                    exclude: ['createdAt', 'updatedAt'],
                },
            }],
            attributes: {
                exclude: ['createdAt', 'updatedAt'],
            },
        });
        res.status(200).send(categories);
    } catch (error) {
        console.error(error);
        next(error);
    }
});

// SET CATEGORY ENABLE // patch /category/1/enable
/**
 * @openapi
 * /category:
 *   patch:
 *     tags:
 *       - category
 *     description: Update a Category Enabled
 *     summary: Update a Category Enabled
 *     responses:
 *       200:
 *              description: "ENABLING A CATEGORY"
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
router.patch('/:categoryId/enable', async (req, res, next) => {
    try {
        // get current 'Order' columns and max value
        let orders = await Category.findAll({
            attributes: ['order']
        });
        let categoryOrder = await Category.findOne({
            where: { id: req.params.categoryId }
        }, {
            attributes: ['order']
        }, );
        categoryOrder = categoryOrder.dataValues.order;
        orders = orders.map(v => v.dataValues.order);
        let order = null; // In case of checked to DISABLE, set null to order value
        if(req.body.checked === 'true' || req.body.checked === true) { // In case of checked to ENABLE
            order = 1;
            // Max value of order col + 1
            if(Math.max(...orders)) {
                order = Math.max(...orders) + 1 
            };
        };
        await Category.update({
            enabled: req.body.checked,
            order: order,
        }, {
            where: { id: req.params.categoryId }
        });
        // In case of checked is false, rearrange orders
        let newOrders = await Category.findAll({
            attributes: ['order']
        }, {
            where: { enabled: true }
        });
        newOrders = newOrders.map(v => v.dataValues.order);
        if((req.body.checked === 'false' || req.body.checked === false) && Math.max(...newOrders)) {
            await Category.increment({
                order: -1
            }, {
                where: { order: { [Op.gt]: categoryOrder } }
            });
        };
        res.status(200).json({ categoryId: req.params.categoryId, enabled: req.body.checked });
    } catch (error) {
        console.error(error);
        next(error);
    };
});

module.exports = router;