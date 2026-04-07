const express = require("express");
const { getUsers, loginUser, getUserProfile, updateProfile, updatePrivacy, registerUser, uploadStatus, getStatuses } = require("../controllers/userController");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const authMiddleware = require("../config/authMiddleware");
const checkPrivacy = require("../config/checkPrivacy");
router.get("/", authMiddleware, getUsers);
const User = require("../models/User");

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

router.post("/update-profile/:id", authMiddleware, upload.single("image"), updateProfile);
// router.get("/profile", ...)
router.get("/profile", authMiddleware, getUserProfile);
router.post("/update-privacy/:id", authMiddleware, updatePrivacy);

router.post(
  "/status/upload",
  authMiddleware,
  upload.array("statusMedia"),
  uploadStatus
);

router.get(
  "/status",
  authMiddleware,
  getStatuses
);


module.exports = router;