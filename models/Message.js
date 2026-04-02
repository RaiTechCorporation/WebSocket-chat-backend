const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    senderId: String,
    receiverId: String,
    message: String,
    fileUrl: String,
    fileName: String,
    fileType: String, // ✅ ADD THIS
    type: {
      type: String,
      enum: ["text", "image", "video", "audio", "document", "contact","poll"], // ✅ improve
      default: "text",
    },
    contact: {
      name: String,
      phone: String
    },
    question: String, // For polls
    pollOptions: [{
    optionText: String,
    votes: [String] // Array of User IDs
  }],
    status: {
      type: String,
      enum: ["sent", "delivered", "seen"],
      default: "sent",
    },
    deletedFor: {
  type: [String], // Storing IDs as strings is easier for comparisons with JWT data
  default: []
},

replyTo: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Message",
  default: null
},
replyData: {
  type: mongoose.Schema.Types.Mixed,
  default: null
},
  reactions: [
  {
    userId: String,
    emoji: String
  }
],
   forwarded: {
      type: Boolean,
      default: false     // 👈 IMPORTANT
    },
  },

  
  { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);