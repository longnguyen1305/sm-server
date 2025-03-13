const router = require("express").Router();
const pool = require("../db");
const authorization = require("../middleware/authorization");
const express = require("express");
const fs = require("fs");
const minioClient = require("../minioClient");

require("dotenv").config();

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

router.get("/projects", authorization, async (req, res) => {
    try {
        const userId = req.user.id;
        
        const projectsQuery = `
            SELECT project_id, project_name, project_status, project_createtime 
            FROM projects 
            WHERE user_id = $1 
            ORDER BY project_createtime DESC;
        `;
        const projects = await pool.query(projectsQuery, [userId]);

        if (projects.rows.length === 0) {
            return res.json({ success: true, projects: [] });
        }

        res.json({ success: true, projects: projects.rows });
        
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
})

router.get("/projects/:projectId", authorization, async (req, res) => {
    try {
        const { projectId } = req.params;
        const bucketName = process.env.MINIO_BUCKET_NAME;

        const foldersQuery = `
            SELECT folder_path_input FROM folders 
            WHERE project_id = $1 
            ORDER BY folder_createtime DESC;
        `;
        const result = await pool.query(foldersQuery, [projectId]);
        const filePath = result.rows[0].folder_path_input;

        minioClient.getObject(bucketName, filePath, (err, stream) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            stream.pipe(res);
        });

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
