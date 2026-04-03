const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No or invalid token format" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, "key");

    req.user = decoded;

    next();
  } catch (error) {
    console.log(error.message); // 👈 debug ke liye

    return res.status(401).json({ message: "Invalid token" });
  }
};

module.exports = authMiddleware;