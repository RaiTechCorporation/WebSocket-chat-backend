const express = require("express");
const { getUsers, loginUser, getUserProfile, updateProfile, updatePrivacy,registerUser } = require("../controllers/userController");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const authMiddleware = require("../config/authMiddleware");
router.get("/", getUsers);
const User = require("../models/User");
const Status = require("../models/statusSchema");
const fs = require('fs');

// Folder path define karein
const dir = './uploads';

// Check karein aur folder banayein agar nahi hai
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, dir); // Ab ye error nahi dega
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

router.post("/login", loginUser);
router.post("/register", registerUser);

router.post("/update-profile/:id",authMiddleware, upload.single("image"), updateProfile);
// router.get("/profile", ...)
router.get("/profile", authMiddleware, getUserProfile);
router.post("/update-privacy/:id",authMiddleware, updatePrivacy);

router.post('/status/upload',authMiddleware, upload.array('statusMedia'), (req, res) => {
    // req.files contains the uploaded file info
    // req.body.captions contains the text
    
    const savedFiles = req.files.map((file, index) => ({
        url: `/uploads/${file.filename}`,
        type: file.mimetype.startsWith('video') ? 'video' : 'image',
        caption: req.body.captions[index]
    }));

    
    // Save to Database logic here...

    res.json({ success: true, savedFiles });
});



module.exports = router;