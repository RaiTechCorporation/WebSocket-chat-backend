const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
require("dotenv").config();


const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const messageRoutes = require("./routes/messageRoutes");
const uploadRoutes = require("./routes/uploadRoutes")
const socketHandler = require("./socket/socket");
const path = require("path");
const app = express();
const server = http.createServer(app);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(cors());
app.use(express.json());

// DB connect
connectDB();

// Routes
app.use("/users", userRoutes);
app.use("/messages", messageRoutes);
app.use("/uploads", uploadRoutes);




// Socket
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true,
    exposedHeaders: ["Content-Disposition"] // Ye line important hai download ke liye
  },
});


socketHandler(io);

server.listen(9000, () => console.log("Server running on 9000"));