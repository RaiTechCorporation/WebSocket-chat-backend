const mongoose = require("mongoose");

const statusSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User", 
        required: true 
    },
    contacts: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User" 
    }],
    stories: [{
        url: String,         // Image/Video path
        type: { type: String, enum: ["image", "video", "text"] },
        caption: String,
        createdAt: { type: Date, default: Date.now }
    }],
    viewers: [{ 
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        at: { type: Date, default: Date.now }
    }],
    createdAt: { 
        type: Date, 
        default: Date.now, 
        index: { expires: '24h' } // 24 ghante baad auto-delete logic
    }
});

module.exports = mongoose.model("Status", statusSchema);