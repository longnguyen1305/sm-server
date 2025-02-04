const Pool = require("pg").Pool;

const pool = new Pool({
    user: "postgres",
    password: "honglong1305",
    host: "localhost",
    port: 5432,
    database: "smserver"
});

module.exports = pool;
