const swaggerUi = require('swagger-ui-express');
const swaggereJsdoc = require('swagger-jsdoc');

const options = {
	definition: {
		openapi: '3.0.0',
		info: {
			title: 'DOODLING API',
			version: '1.0.1',
		},
		servers: [
			{
				url: 'https://api.doodling.kr/',
				description: 'doodling'
			},
			{
				url: 'http://localhost:3065',
				description: 'localhost'
			}
		],
		components: {
			schemas: {
				joinform: {
					type: 'object',
                    properties: {
                        email: {
                            type: 'string',
                            example: 'abc@abc.com'
                        },
                        nickname: {
                            type: 'string',
                            example: 'John snow'
                        },
                        mbti: {
                            type: 'string',
                            example: 'ISTJ'
                        },
                        password: {
                            type: 'string',
                            example: 'password1234!'
                        },
					},
                required: ['email', 'nickname', 'mbti', 'password' ]
				},
				loginform: {
					type: 'object',
                    properties: {
                        email: {
                            type: 'string',
                            example: 'abc@abc.com'
                        },
                        password: {
                            type: 'string',
                            example: 'password1234!'
                        },
					},
                required: ['email', 'password' ]
				},
                uploadform: {
					type: 'object',
                    properties: {
                        title: {
                            type: 'string',
                            example: 'Sample Title'
                        },
                        text: {
                            type: 'string',
                            example: '<p>Sample contents</p>'
                        },
                        subCategory: {
                            type: 'integer',
                            example: '3'
                        },
                        userId: {
                            type: 'integer',
                            example: '1'
                        },
					},
                required: ['title', 'text', 'subCategory', 'userId' ]
				},
                categoryform: {
					type: 'object',
                    properties: {
                        label: {
                            type: 'string',
                            example: 'MBTI'
                        },
					},
                required: ['label']
				},
                subcategoryform: {
					type: 'object',
                    properties: {
                        label: {
                            type: 'string',
                            example: 'MBTI'
                        },
                        categoryId: {
                            type: 'integer',
                            example: 1
                        },
					},
                required: ['label', 'categoryId']
				},
			}
		}
	},
	apis: ['./routes/*.js'], // files containing annotations as above
};

const specs = swaggereJsdoc(options);

module.exports = {
    swaggerUi,
    specs
};