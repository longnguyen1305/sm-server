const router = require("express").Router();
const authorization = require("../middleware/authorization");
const multer = require("multer");

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './uploads')
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname)
    }
})
const upload = multer({ storage });

router.post("/upload", authorization, upload.single('zipfile'), async (req, res) => {
    try {
      
      res.json(req.file);

    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
})

module.exports = router;
