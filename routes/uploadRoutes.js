const express = require("express");
const router = express.Router();
const multer = require("multer");
const uploadController = require("../controllers/uploadController");
const fs = require("fs");
const path = require('path');
// ✅ Multer Storage Setup
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 200 * 1024 * 1024 }, // 500MB limit for videos
    fileFilter: (req, file, cb) => {
        if (
            file.mimetype.startsWith("image/") ||
            file.mimetype.startsWith("video/") ||
            file.mimetype.startsWith("audio/") ||
            file.mimetype === "application/pdf" ||
            file.mimetype.includes("word") ||
            file.mimetype.includes("excel") ||
            file.mimetype.includes("powerpoint") ||
            file.mimetype === "text/plain" ||
            file.mimetype === "text/csv"
        ) {
            cb(null, true);
        } else {
            cb(new Error("Unsupported file type"), false);
        }
    }
});

// ✅ Route: POST /api/upload
router.post("/", (req, res, next) => {
    upload.array("files")(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            // A Multer error occurred when uploading.
            return res.status(400).json({ success: false, message: `Multer error: ${err.message}` });
        } else if (err) {
            // An unknown error occurred when uploading.
            return res.status(400).json({ success: false, message: err.message });
        }
        // Everything went fine.
        next();
    });
}, uploadController.uploadFiles);

router.get("/download", (req, res) => {
    const fileName = req.query.file;

    // path.resolve starts from the project root
    const filePath = path.join(process.cwd(), "uploads", fileName);

    console.log("Checking file at:", filePath); // This will show in your terminal

    if (fs.existsSync(filePath)) {
        // res.download sets 'Content-Disposition' to 'attachment' automatically
        res.download(filePath, fileName, (err) => {
            if (err) {
                console.error("Download error:", err);
                res.status(500).send("Could not download file");
            }
        });
    } else {
        console.log("File not found at:", filePath);
        res.status(404).send("File not found on server");
    }
});


module.exports = router;