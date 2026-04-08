const mongoose = require("mongoose");

const chatMetaSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  chatWith: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  unreadCount: { type: Number, default: 0 },
});

module.exports = mongoose.model("ChatMeta", chatMetaSchema);