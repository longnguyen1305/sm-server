const jwt = require("jsonwebtoken");
require("dotenv").config();

module.exports = async (req, res, next) => {
    try {
        const jwtToken = req.header("token");

        if (!jwtToken) {
            return res.status(403).json("Not Authorize");
        }

        const verify = jwt.verify(jwtToken, process.env.jwtSecret);
        req.user = verify.user;
        next();

    } catch (err) {
        console.error(err.message);
        return res.status(403).json("Not Authorize");
    }
};
