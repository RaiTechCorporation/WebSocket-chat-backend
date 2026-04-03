const mongoose = require("mongoose");

const statusSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User", 
        required: true 
    },

    stories: [{
        url: String,         // Image/Video path
        type: { type: String, enum: ["image", "video", "text"] },
        text: String,        // ✅ Naya field Text Status ke liye
        backgroundColor: {   // ✅ Naya field background color ke liye
            type: String, 
            default: "#075E54" 
        },
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