const router = require("express").Router();
const pool = require("../db");
const authorization = require("../middleware/authorization");
const supabaseClient = require("../utils/supabaseClient");

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
        const bucketName = process.env.SUPABASE_BUCKET;

        const foldersQuery = `
            SELECT folder_path_input FROM folders 
            WHERE project_id = $1 
            ORDER BY folder_createtime DESC;
        `;
        const result = await pool.query(foldersQuery, [projectId]);
        const filePath = result.rows[0].folder_path_input;

        const { data, error } = await supabaseClient
            .storage
            .from(bucketName)
            .createSignedUrl(filePath, 3600); // 1 hour signed URL

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        res.redirect(data.signedUrl);

    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
})

router.get("/metrics/:projectId", authorization, async (req, res) => {
    try {
        const bucketName = process.env.SUPABASE_BUCKET;
        const metricsWithLinks = [];
        const path = "metrics";

        const { data: objects, error } = await supabaseClient
            .storage
            .from(bucketName)
            .list(path);

        if (error) {
            console.error("Error listing metrics:", error);
            return res.status(500).json({ error: "Error fetching metrics" });
        }

        if (!objects || objects.length === 0) {
            return res.json({ success: true, metrics: [] });
        }

        objects.forEach((obj) => {
            const publicUrl = supabaseClient
                .storage
                .from(bucketName)
                .getPublicUrl(`${path}/${obj.name}`).data.publicUrl;
      
            metricsWithLinks.push({
                metric_name: obj.name,
                metric_url: publicUrl,
            });
        });

        res.json({ success: true, metrics: metricsWithLinks });

    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
})

module.exports = router;
