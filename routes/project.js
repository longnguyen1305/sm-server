const router = require("express").Router();
const authorization = require("../middleware/authorization");
const multer = require("multer");
const pool = require("../db");
const minioClient = require("../minioClient");
const stream = require("stream");

require("dotenv").config();

const upload = multer({ storage: multer.memoryStorage() });

router.post("/upload", authorization, upload.single('zipfile'), async (req, res) => {
    try {
      const file = req.file;

      // Add new project to database
      const projectQuery = `
        INSERT INTO projects (user_id, project_name, project_status)
        VALUES ($1, $2, 'pending') RETURNING *;
      `;
      const newProject = await pool.query(projectQuery, [req.user.id, file.originalname]);
      const projectId = newProject.rows[0].project_id;

      // Store file into MinIO
      const bucketName = process.env.MINIO_BUCKET_NAME;
      const filePath = `${req.user.id}/${projectId}/${file.originalname}`;
      const fileStream = new stream.PassThrough();
      fileStream.end(file.buffer);
      
      await minioClient.putObject(bucketName, filePath, fileStream, file.size, {
        "Content-Type": file.mimetype
      });

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

module.exports = router;
