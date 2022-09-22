const dotenv = require('dotenv');

dotenv.config();

module.exports = {
    "development": {
        "username": "root",
        "password": process.env.DB_PASSWORD,
        "database": "doodling_development",
        "host": "127.0.0.1",
        "dialect": "mysql",
    },
    "test": {
        "username": "root",
        "password": process.env.DB_PASSWORD,
        "database": "doodling_test",
        "host": "127.0.0.1",
        "dialect": "mysql"
    },
    "production": {
        "username": process.env.RDS_USERNAME,
        "password": process.env.RDS_PASSWORD,
        "database": process.env.RDS_DATABASE,
        "host": process.env.RDS_HOST,
        "dialect": "mysql",
        "port":process.env.RDS_PORT
    }
};