// controllers/blockController.js

const Block = require("../models/Block");
exports.blockUser = async (req, res) => {
  try {
    const blockerId = req.user.userId; // token se
    const { userId } = req.body;

    if (blockerId === userId) {
      return res.status(400).json({ message: "You can't block yourself" });
    }

    const alreadyBlocked = await Block.findOne({
      blocker: blockerId,
      blocked: userId,
    });

    if (alreadyBlocked) {
      return res.status(400).json({ message: "User already blocked" });
    }

    const block = await Block.create({
      blocker: blockerId,
      blocked: userId,
    });

    // 🔥 socket emit
 const io = req.app.get("io");

if (io) {
  // receiver ko
  io.to(userId).emit("blocked", {
    by: blockerId,
    blockedUser: userId,
  });

  // sender ko
  io.to(blockerId).emit("blocked", {
    by: blockerId,
    blockedUser: userId,
  });
}

    res.json({ message: "User blocked successfully", block });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getBlockedUsers = async (req, res) => {
  try {
    const userId = req.user.userId;

    const blockedUsers = await Block.find({ blocker: userId })
      .populate("blocked", "name email");

    res.json(blockedUsers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.unblockUser = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { blockedId } = req.body;

    await Block.findOneAndDelete({
      blocker: userId,
      blocked: blockedId,
    });

    res.json({ message: "User unblocked" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};