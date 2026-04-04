
// routes/blockRoutes.js

const express = require("express");
const router = express.Router();
const { blockUser, getBlockedUsers, unblockUser } = require("../controllers/blockControllers");

const authMiddleware = require("../config/authMiddleware");

// 🔴 Block User
router.post("/block", authMiddleware, blockUser);

// 📥 Get All Blocked Users
router.get("/blocked-users", authMiddleware, getBlockedUsers);

// 🟢 Unblock User
router.post("/unblock", authMiddleware, unblockUser);

module.exports = router;