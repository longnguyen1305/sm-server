const router = require("express").Router();
const authorization = require("../middleware/authorization");
const multer = require("multer");
const pool = require("../db");
const supabaseClient = require("../utils/supabaseClient");

require("dotenv").config();

const upload = multer({ storage: multer.memoryStorage() });

router.post("/upload", authorization, upload.single('zipfile'), async (req, res) => {
    try {
      const file = req.file;

      // Add new project to database
      const projectQuery = `
        INSERT INTO projects (user_id, project_name, project_status)
        VALUES ($1, $2, 'completed') RETURNING *;
      `;
      const newProject = await pool.query(projectQuery, [req.user.id, file.originalname]);
      const projectId = newProject.rows[0].project_id;

      // Store file into Supabase
      const bucketName = process.env.SUPABASE_BUCKET;
      const filePath = `${req.user.id}/${projectId}/${file.originalname}`;
      
      const { error: uploadError } = await supabaseClient.storage
        .from(bucketName)
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: true,
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        return res.status(500).json({ error: "Failed to upload file to Supabase" });
      }

      // Add new folder to database
      const folderQuery = `
        INSERT INTO folders (project_id, folder_path_input)
        VALUES ($1, $2) RETURNING *;
      `;
      const newFolder = await pool.query(folderQuery, [projectId, filePath]);

      res.json({ success: true, message: 'File uploaded!', time: newFolder.rows[0].folder_createtime });

    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
})

router.get("/:projectId/download", authorization, async (req, res) => {
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

module.exports = router;
