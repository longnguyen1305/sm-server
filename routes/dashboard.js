const router = require("express").Router();
const pool = require("../db");
const authorization = require("../middleware/authorization");
const express = require("express");
const fs = require("fs");

router.get("/", authorization, async (req, res) => {
    try {
        const user = await pool.query("SELECT user_name FROM users WHERE user_id = $1", [
            req.user.id
        ]);
        res.json(user.rows[0]);

    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
})

router.get("/project", authorization, async (req, res) => {
    try {

        res.download('./results/projects/RadixSpline.zip');
        
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
})

router.use('/metrics/images', express.static('./results/metrics/images'));

router.get("/metrics", authorization, async (req, res) => {
    try {

        fs.readdir('./results/metrics/images', (err, files) => {
            if (err) {
                console.error("Error reading metrics folder:", err.message);
                return res.status(500).json({ message: "Error fetching metrics" });
            }

            const images = files.map(file => ({
                name: file,
                url: `/metrics/images/${file}`
            }));

            res.json({ images });
        })
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
})

module.exports = router;
