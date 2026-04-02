const http = require("http");
const express = require("express");
const { Server } = require("socket.io");
const mongoose = require("mongoose");

const app = express();
const server = http.createServer(app);

app.use(express.json());

// ✅ MongoDB Connect
mongoose.connect("mongodb://127.0.0.1:27017/chat")
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

// ✅ Message Schema
const messageSchema = new mongoose.Schema({
    senderId: String,
    receiverId: String,
    message: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Message = mongoose.model("Message", messageSchema);

// ✅ Socket Setup
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

// 🔥 Users Map
let users = {};

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // ✅ Join
    socket.on("join", (userId) => {
        users[userId] = socket.id;

        io.emit("users", Object.keys(users));
    });

    // ✅ Send Message + Save in DB
    socket.on("private_message", async ({ senderId, receiverId, message }) => {

        // 💾 Save to MongoDB
        const newMsg = await Message.create({
            senderId,
            receiverId,
            message
        });

        // 📤 Send to receiver
        const receiverSocket = users[receiverId];

        if (receiverSocket) {
            io.to(receiverSocket).emit("private_message", newMsg);
        }

        // 📤 Send back to sender (for UI update)
        socket.emit("private_message", newMsg);
    });

    // ❌ Disconnect
    socket.on("disconnect", () => {
        for (let userId in users) {
            if (users[userId] === socket.id) {
                delete users[userId];
            }
        }

        io.emit("users", Object.keys(users));
    });
});


// ✅ API: Get chat history
app.get("/messages/:user1/:user2", async (req, res) => {
    const { user1, user2 } = req.params;

    const messages = await Message.find({
        $or: [
            { senderId: user1, receiverId: user2 },
            { senderId: user2, receiverId: user1 }
        ]
    }).sort({ createdAt: 1 });

    res.json(messages);
});

server.listen(9000, () => console.log("Server running on port 9000"));