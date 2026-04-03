const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    // 1. Username aur Password string mein add karein
    // 2. ?authSource=admin zaroori hai kyunki user admin DB mein bana hai
    const dbURI = "mongodb://admin:StrongPassword%402026@168.231.119.214:27017/chat?authSource=admin";

    await mongoose.connect(dbURI);
    
    console.log("✅ MongoDB Connected Successfully");
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err.message);
    process.exit(1); // Error aane par process stop kar dein
  }
};

module.exports = connectDB;