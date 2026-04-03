const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
require("dotenv").config();
const os = require('os');

const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const messageRoutes = require("./routes/messageRoutes");
const uploadRoutes = require("./routes/uploadRoutes")
const socketHandler = require("./socket/socket");
const path = require("path");
const app = express();
const IP_ADDRESS = "0.0.0.0"; // Sabhi network interfaces ke liye
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
    origin: [
      "http://localhost:5173",
      "https://chat.onnbit.com"
    ],
    credentials: true,
    exposedHeaders: ["Content-Disposition"]
  },
});

// 🔥 YE WALA PART ADD KAREIN (Root Route)
app.get("/", (req, res) => {
  res.status(200).send({
    status: "success",
    message: "API is running successfully! 🚀",
    docs: `http://${myIP}:9000/api-docs`
  });
});
app.set("io", io);
// users global rakho
global.users = {};
socketHandler(io);

function getIPAddress() {
  const interfaces = os.networkInterfaces();
  for (const devName in interfaces) {
    const iface = interfaces[devName];
    for (let i = 0; i < iface.length; i++) {
      const alias = iface[i];
      if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
        return alias.address;
      }
    }
  }
  return '0.0.0.0';
}

const myIP = getIPAddress();
console.log("Aapka IP Address hai:", myIP);

// Server listen karte waqt iska use karein
server.listen(9000, "0.0.0.0", () => {
  console.log(`Server is running at http://${myIP}:9000`);
});