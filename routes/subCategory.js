const express = require('express');
const { SubCategory } = require('../models');
const { isLoggedIn } = require('./middlewares');
const router = express.Router();
const { Op } = require("sequelize");

// ADD SUBCATEGORY // POST /subCategory
/**
 * @openapi
 * /subCategory:
 *  post:
 *      tags:
 *          - subCategory
 *      description: Create a new subCategory
 *      summary: Create a new subCategory
 *      requestBody:
 *          description: Create a new subCategory
 *          required: true
 *          content:
 *            application/json:
 *                schema:
 *                   $ref: '#/components/schemas/subcategoryform'
 *            application/x-www-form-urlencoded:
 *                schema:
 *                   $ref: '#/components/schemas/subcategoryform'
 *      responses:
 *          200:
 *              description: "ADD SUBCATEGORY SUCCESS"
 *              content:
 *                application/json:
 *                  schema:
 *                    type: 'object'
 *                    properties:
 *                      message:
 *                          type: string
 *                          example: "서브 카테고리 생성에 성공했습니다."
 */
router.post('/', async (req, res, next) => {
    try {
        const exSubCategory = await SubCategory.findOne({
            where: { label: req.body.label }
        });
        if(!req.body.categoryId) {
            return res.status(403).send("상위 카테고리 아이디가 필요합니다.");
        };
        if(exSubCategory) {
            return res.status(403).send("이미 존재하는 서브 카테고리입니다.");
        };
        await SubCategory.create({
            label: req.body.label,
            CategoryId: req.body.categoryId,
            enabled: false,
        });
        const subCategories = await SubCategory.findAll({
            order: [
                ['id', 'ASC']
            ],
            where: {
                CategoryId: req.body.categoryId
            },
        });
        res.status(201).json(subCategories);
    } catch (error) {
        console.error(error);
        next(error);
    };
});

// LOAD SUBCATEGORIES // GET /subCategory
/**
 * @openapi
 * /subCategory:
 *   get:
 *     tags:
 *       - subCategory
 *     description: Get the subCategories of a category
 *     summary: Get the subCategories of a category
 *     responses:
 *       200:
 *              description: "SUBCATEGORIES LIST"
 *              content:
 *                application/json:
 *                  schema:
 *                    type: 'object'
 *                    properties:
 *                      subCategories:
 *                          type: array
 *                          example: ['전체', '이슈']
 */
router.get('/', async (req, res, next) => {
    try {
        const subCategories = await SubCategory.findAll({
            where: { CategoryId: req.body.categoryId },
            order: [
                ['id', 'ASC']
            ]
        });
        res.status(200).send(subCategories);
    } catch (error) {
        console.error(error);
        next(error);
    };
});

// SET SUBCATEGORY ENABLE // patch /subCategory
/**
 * @openapi
 * /subCategory:
 *   patch:
 *     tags:
 *       - subCategory
 *     description: Update a subCategory Enabled
 *     summary: Update a subCategory Enabled
 *     responses:
 *       200:
 *              description: "ENABLING A SUBCATEGORY"
 *              content:
 *                application/json:
 *                  schema:
 *                    type: 'object'
 *                    properties:
 *                      categoryId:
 *                          type: integer
 *                          example: 1
 *                      subCategoryId:
 *                          type: integer
 *                          example: 3
 *                      enabled:
 *                          type: BOOLEAN
 *                          example: true
 * 
 */
router.patch('/', async (req, res, next) => {
    try {
        // get current 'Order' columns and max value
        let orders = await SubCategory.findAll({
            attributes: ['order']
        }, {
            where: { CategoryId: req.body.categoryId }
        });
        let subCategoryOrder = await SubCategory.findOne({
            where: { id: req.body.subCategoryId }
        }, {
            attributes: ['order']
        });
        subCategoryOrder = subCategoryOrder.dataValues.order;
        orders = orders.map(v => v.dataValues.order);
        let order = null; // In case of checked to DISABLE, set null to order value
        if(req.body.checked === 'true' || req.body.checked === true) { // In case of checked to ENABLE
            order = 1;
            // Max value of order col + 1
            if(Math.max(...orders)) {
                order = Math.max(...orders) + 1 
            };
        };
        await SubCategory.update({
            enabled: req.body.checked,
            order: order,
        }, {
            where: {
                CategoryId: req.body.categoryId,
                id: req.body.subCategoryId,
            }
        });
        // In case of checked is false, rearrange orders
        let newOrders = await SubCategory.findAll({
            attributes: ['order']
        }, {
            where: { CategoryId: req.body.categoryId, enabled: true }
        });
        newOrders = newOrders.map(v => v.dataValues.order);
        if((req.body.checked === 'false' || req.body.checked === false) && Math.max(...newOrders)) {
            await SubCategory.increment({
                order: -1
            }, {
                where: { order: { [Op.gt]: subCategoryOrder } }
            });
        };
        res.status(200).json({ categoryId: req.body.categoryId, subCategoryId: req.body.subCategoryId, enabled: req.body.checked });
    } catch (error) {
        console.error(error);
        next(error);
    };
});

module.exports = router;