const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Status = require("../models/statusSchema");


// GET all users
exports.getUsers = async (req, res) => {
  const users = await User.find();
  res.json(users);
};


exports.registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // 1. Check existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    // 2. Hash password (IMPORTANT 🔐)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    // 4. Generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || "fallback_secret",
      { expiresIn: "7d" }
    );

    // 5. Remove password
    const userData = user.toObject();
    delete userData.password;

    // 6. Response
    res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      user: userData,
    });

  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
// SIMPLE LOGIN (no auth)
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. User find
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email ",
      });
    }

    // 2. Password check
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid password",
      });
    }

    // 3. JWT Token generate
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || "fallback_secret",
      { expiresIn: "7d" }
    );

    // 4. Password remove before sending response
    const userData = user.toObject();
    delete userData.password;

    // 5. Response
    res.json({
      success: true,
      message: "Login successful",
      token,
      user: userData,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


exports.getUserProfile = async (req, res) => {
  try {
    // authMiddleware से हमें req.user.userId मिल रहा है
    const user = await User.findById(req.user.userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }


    if (user.profilePic && !user.profilePic.startsWith("http")) {
      user.profilePic = `${req.protocol}://${req.get("host")}/uploads/${user.profilePic}`;
    }

    res.status(200).json(user);
  } catch (err) {
    console.error("Get Profile Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};


exports.updateProfile = async (req, res) => {
  try {
    const userId = req.params.id;
    const { name, about } = req.body;
    let updateData = {};

    // Check 1: Agar sirf text fields aayi hain (JSON request)
    if (name) updateData.name = name;
    if (about) updateData.about = about;

    // Check 2: Agar image file aayi hai (Multer/FormData request)
    if (req.file) {
      updateData.profilePic = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
    }

    // Database Update
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select("-password");

    res.status(200).json({
      success: true,
      message: "Updated successfully",
      user: updatedUser
    });

  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};



exports.updatePrivacy = async (req, res) => {
  try {
    const { field, value } = req.body; // field = "profilePic", value = "nobody"
    const userId = req.params.id;

    // MongoDB nested update logic
    const updatePath = `privacy.${field}`;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { [updatePath]: value } },
      { new: true }
    ).select("-password");

    res.status(200).json({ success: true, user: updatedUser });
  } catch (err) {
    res.status(500).json({ message: "Database update failed" });
  }
};



// controllers/statusController.js

exports.uploadStatus = async (req, res) => {
  try {
    const userId = req.user.userId;
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    let stories = [];

    // 1. Agar Media Files hain (Image/Video)
    if (req.files && req.files.length > 0) {
      stories = req.files.map((file, index) => ({
        url: `${baseUrl}/uploads/${file.filename}`,
        type: file.mimetype.startsWith("video") ? "video" : "image",
        caption: Array.isArray(req.body.captions) 
                 ? req.body.captions[index] 
                 : req.body.captions || ""
      }));
    } 
    // 2. Agar Text Status hai
    else if (req.body.type === "text") {
      stories.push({
        type: "text",
        text: req.body.text, // 'content' ka naya naam 'text'
        backgroundColor: req.body.backgroundColor || "#075E54",
        createdAt: new Date()
      });
    }

    if (stories.length === 0) {
      return res.status(400).json({ success: false, message: "No status data provided" });
    }

    // 3. Database Update
    const updatedStatus = await Status.findOneAndUpdate(
      { userId },
      {
        $push: { stories: { $each: stories } },
        $set: { createdAt: new Date() }
      },
      { upsert: true, new: true } // 'new: true' returns updated doc
    ).populate("userId", "name profileImg");

    // 4. Socket Broadcast
    const io = req.app.get("io");
    if (io) {
      io.emit("status_update_received", updatedStatus);
    }

    res.json({
      success: true,
      status: updatedStatus
    });

  } catch (err) {
    console.error("Upload Error:", err);
    res.status(500).json({ success: false });
  }
};
exports.getStatuses = async (req, res) => {
  try {
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const statuses = await Status.find({
      "stories.createdAt": { $gte: last24Hours }
    })
      .populate("userId", "name profilePic")
      .sort({ createdAt: -1 });

    const updatedStatuses = statuses.map((status) => {
      // 1. Stories ke URLs fix karein
      const updatedStories = status.stories.map((story) => ({
        ...story._doc,
        url: story.url.startsWith("http")
          ? story.url
          : `${baseUrl}${story.url}`
      }));

      // 2. User Profile Image fix karein
      // Hum spread use karenge taaki original document change na ho, bas return object update ho
      const user = { ...status.userId._doc };

      if (user.profilePic && !user.profilePic.startsWith("http")) {
        // Dhyaan dein: Agar aapka static folder '/uploads' hai, toh URL sahi hai
        user.profilePic = `${baseUrl}/uploads/${user.profilePic}`;
      } else if (!user.profilePic) {
        // Safety: Agar image na ho toh default avatar return kar sakte hain
        user.profilePic = `${baseUrl}/uploads/default-avatar.png`;
      }

      // 3. Final Object return karein
      return {
        ...status._doc,
        stories: updatedStories,
        userId: user // Updated user object with full image URL
      };
    });

    res.json({
      success: true,
      statuses: updatedStatuses
    });

  } catch (err) {
    console.error("Status Fetch Error:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};