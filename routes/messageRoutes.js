const express = require("express");
const { getMessages ,getAllMessages} = require("../controllers/messageController");
const router = express.Router();
const authMiddleware = require("../config/authMiddleware");
router.get("/message/:user1/:user2",authMiddleware, getMessages);
router.get("/all/:userId", getAllMessages);

module.exports = router;