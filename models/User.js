const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  userId: String,
  name: String,
  email: String,
  password: String,
  token: String,
  about: {
    type: String,
    maxLength: 150 // Option to limit length
  },

  status: {
    type: String,
    enum: ["online", "offline"],
    default: "offline",
  },

  lastSeen: {
    type: Date,
    default: null,
  },

  // --- Naya Privacy Section ---
  privacy: {
    profilePic: {
      type: String,
      enum: ["everyone", "contacts", "nobody"],
      default: "everyone"
    },
    about: {
      type: String,
      enum: ["everyone", "contacts", "nobody"],
      default: "everyone"
    },
    status: {
      type: String,
      enum: ["everyone", "contacts", "nobody"],
      default: "everyone"
    },
    lastSeen: {
      type: String,
      enum: ["everyone", "contacts", "nobody"],
      default: "everyone"
    }
  },

  // Blocked users ki list store karne ke liye
  blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
contacts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  statusPrivacy: {
    type: {
      type: String,
      enum: ["ALL", "EXCEPT", "ONLY"],
      default: "ALL"
    },
    exceptUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    onlyUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
  },

  profilePic: {
    type: String,
    default: "" // Shuruat mein khali rahega
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("User", userSchema, "users");