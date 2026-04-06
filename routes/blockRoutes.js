
// routes/blockRoutes.js

const express = require("express");
const router = express.Router();
const { blockUser, getBlockedUsers, unblockUser, getBlockedUsersList } = require("../controllers/blockControllers");

const authMiddleware = require("../config/authMiddleware");

// 🔴 Block User
router.post("/block", authMiddleware, blockUser);
router.get("/blocked-status/:targetUserId", authMiddleware, getBlockedUsers);

// 📥 Get All Blocked Users
router.get("/blocked-users", authMiddleware, getBlockedUsersList);

// 🟢 Unblock User
router.post("/unblock", authMiddleware, unblockUser);

module.exports = router;