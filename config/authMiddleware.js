const jwt = require("jsonwebtoken");
const BlacklistedToken = require("../models/BlacklistedToken")
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No token" });
    }

    // 🔴 Check blacklist
    const isBlacklisted = await BlacklistedToken.findOne({ token });

    if (isBlacklisted) {
      return res.status(401).json({
        success: false,
        message: "Token expired, please login again",
      });
    }

    // ✅ Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "key");
    req.user = decoded;

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

module.exports = authMiddleware;