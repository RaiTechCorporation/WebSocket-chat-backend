const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");



// GET all users
exports.getUsers = async (req, res) => {
  const users = await User.find();
  res.json(users);
};

// SIMPLE LOGIN (no auth)
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. User find
    const user = await User.findOne({ email, password });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // 2. Password check
    // const isMatch = await bcrypt.compare(password, user.password);

    // if (!isMatch) {
    //   return res.status(401).json({
    //     success: false,
    //     message: "Invalid email or password",
    //   });
    // }

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