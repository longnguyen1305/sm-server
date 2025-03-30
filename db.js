const { Pool } = require('pg');
require("dotenv").config();

let dbConfig;

if (process.env.DATABASE_URL) {
    // Production (Render, Neon)
    dbConfig = {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
    };
    console.log("Using Neon Cloud Database");
} else {
    // Local development
    dbConfig = {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    };
    console.log("Using Local Database");
}

const pool = new Pool(dbConfig);

module.exports = pool;
