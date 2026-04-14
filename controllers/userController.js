const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Status = require("../models/statusSchema");
const ChatMeta = require("../models/chatMeta")
const BlacklistedToken = require("../models/BlacklistedToken")
const Message = require("../models/Message")
const {getBlockedUserIds} = require("../utils/CheckBlocked")
exports.checkIsBlocked = async (userId, targetUserId) => {
  console.log("Checking block:", userId, targetUserId);

  const block = await Block.findOne({
    $or: [
      { blocker: userId, blocked: targetUserId },
      { blocker: targetUserId, blocked: userId },
    ],
  });

  console.log("Block result:", block);

  return !!block;
};

// GET all users
const Block = require("../models/Block");

exports.getUsers = async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const { search } = req.query; // 👈 search query

    // Search filter build karo
    let searchFilter = {};
    if (search && search.trim() !== "") {
      searchFilter = {
        $or: [
          { name: { $regex: search, $options: "i" } },   // name se search
          { email: { $regex: search, $options: "i" } },  // email se search
        ],
      };
    }

    const users = await User.find(searchFilter); // 👈 filter apply

    const updatedUsers = await Promise.all(
      users.map(async (user) => {

        const block = await Block.findOne({
          $or: [
            { blocker: currentUserId, blocked: user._id },
            { blocker: user._id, blocked: currentUserId },
          ],
        });
        const isBlocked = !!block;

        const isOwner = currentUserId.toString() === user._id.toString();
        const isContact = user.contacts?.includes(currentUserId);

        const checkField = (setting) => {
          if (isOwner || setting === "everyone") return true;
          if (setting === "nobody") return false;
          if (setting === "contacts") return isContact;
          return false;
        };

        const showPic = !isBlocked && checkField(user.privacy.profilePic);
        const showAbout = !isBlocked && checkField(user.privacy.about);
        const showLastSeen = !isBlocked && checkField(user.privacy.lastSeen);

        const meta = await ChatMeta.findOne({
          userId: currentUserId,
          chatWith: user._id,
        });

        return {
          _id: user._id,
          name: user.name,
          email: user.email,  // 👈 email bhi bhejo
          profilePic: showPic ? user.profilePic : null,
          about: showAbout ? user.about : "",
          lastSeen: showLastSeen ? user.lastSeen : null,
          status: !isBlocked ? user.status : "",
          isBlocked,
          unreadCount: meta?.unreadCount || 0,
        };
      })
    );

    res.json(updatedUsers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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
      process.env.JWT_SECRET || "key",
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

exports.logoutUser = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Token required",
      });
    }

    // Save token to blacklist
    await BlacklistedToken.create({ token });

    res.json({
      success: true,
      message: "Logout successful",
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
    ).populate("userId", "name profilePic");

const io = req.app.get("io");

// 👇 sab users nahi — sirf valid users ko
const allUsers = await User.find({ _id: { $ne: userId } }).select("_id");

const targetIds = allUsers.map(u => u._id.toString());
console.log("targetIds",targetIds)
// 🔥 blocked users nikaalo
io.to(userId.toString()).emit("status_update_received", updatedStatus);

const blockedSet = await getBlockedUserIds(userId, targetIds);
console.log("blockedSet",blockedSet)
// 🔥 emit only allowed users
targetIds.forEach((id) => {
  if (!blockedSet.has(id)) {
    io.to(id).emit("status_update_received", updatedStatus);
  }
});
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
    // ✅ FIX HERE
    const currentUserId = req.user.userId;

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // 🔥 Get blocked users
    const blockedUsers = await Block.find({
      $or: [
        { blocker: currentUserId },
        { blocked: currentUserId },
      ],
    });
    console.log("blockedUsers", blockedUsers)
    const blockedUserIds = blockedUsers.map((b) =>
      b.blocker.equals(currentUserId)
        ? b.blocked
        : b.blocker
    );

    console.log("Blocked Users:", blockedUserIds); // 🧪 DEBUG

    // 🔥 Fetch statuses
    const statuses = await Status.find({
      "stories.createdAt": { $gte: last24Hours },
      userId: { $nin: blockedUserIds },
    })
      .populate("userId", "name profilePic")
      .sort({ createdAt: -1 });

    const updatedStatuses = statuses.map((status) => {
      const updatedStories = status.stories.map((story) => ({
        ...story._doc,
        url: story.url.startsWith("http")
          ? story.url
          : `${baseUrl}${story.url}`,
      }));

      const user = { ...status.userId._doc };

      if (user.profilePic && !user.profilePic.startsWith("http")) {
        user.profilePic = `${baseUrl}/uploads/${user.profilePic}`;
      } else if (!user.profilePic) {
        user.profilePic = `${baseUrl}/uploads/default-avatar.png`;
      }

      return {
        ...status._doc,
        stories: updatedStories,
        userId: user,
      };
    });

    res.json({
      success: true,
      statuses: updatedStatuses,
    });
  } catch (err) {
    console.error("Status Fetch Error:", err);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};


exports.updateStatusPrivacy = async (req, res) => {
  try {
    const userId = req.user.userId;

    const {
      type,            // ALL | EXCEPT | ONLY
      exceptUsers = [],
      onlyUsers = []
    } = req.body;

    // 🔒 validation
    if (type === "EXCEPT" && exceptUsers.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Select users to exclude"
      });
    }

    if (type === "ONLY" && onlyUsers.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Select users to share with"
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        statusPrivacy: {
          type,
          exceptUsers: type === "EXCEPT" ? exceptUsers : [],
          onlyUsers: type === "ONLY" ? onlyUsers : []
        }
      },
      { new: true }
    );

    res.json({
      success: true,
      message: "Privacy updated",
      data: updatedUser.statusPrivacy
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};





// ✅ 2. Contact add karo
exports.addContact = async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const { contactId } = req.body;

    if (!contactId) {
      return res.status(400).json({ success: false, message: "contactId required" });
    }

    const contactUser = await User.findById(contactId);
    if (!contactUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const currentUser = await User.findById(currentUserId);
    if (currentUser.contacts.includes(contactId)) {
      return res.status(400).json({ success: false, message: "Already in contacts" });
    }

    await User.findByIdAndUpdate(
      currentUserId,
      { $addToSet: { contacts: contactId } }
    );

    // 🔥 SOCKET EMIT
    const io = req.app.get("io");

    if (io) {
      const payload = {
        type: "ADD",
        userId: currentUserId,
        contactId,
      };

      // sender ko
      io.to(currentUserId).emit("contact_update", payload);

      // receiver ko
      io.to(contactId).emit("contact_update", payload);
    }

    res.status(201).json({ success: true, message: "Contact added successfully" });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};



exports.getContacts = async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const { search } = req.query;

    // 👇 1. user + contacts
    const user = await User.findById(currentUserId)
      .populate("contacts", "-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // 👇 2. messages
    const messages = await Message.find({
      $or: [
        { senderId: currentUserId },
        { receiverId: currentUserId },
      ],
    });

    // 👇 3. unique chat user ids
    const chatUserIds = new Set();

    messages.forEach((msg) => {
      if (msg.senderId.toString() !== currentUserId.toString()) {
        chatUserIds.add(msg.senderId.toString());
      }
      if (msg.receiverId.toString() !== currentUserId.toString()) {
        chatUserIds.add(msg.receiverId.toString());
      }
    });

    // 👇 4. fetch chat users
    const chatUsers = await User.find({
      _id: { $in: Array.from(chatUserIds) },
    }).select("-password");

    // 👇 5. merge (Map)
    const userMap = new Map();

    // contacts
    user.contacts.forEach((u) => {
      userMap.set(u._id.toString(), {
        ...u.toObject(),
        isContact: true,
        contactId: u._id,
      });
    });

    // chat users
    chatUsers.forEach((u) => {
      if (!userMap.has(u._id.toString())) {
        userMap.set(u._id.toString(), {
          ...u.toObject(),
          isContact: false,
          contactId: null,
        });
      }
    });

    let users = Array.from(userMap.values());

    // 🔍 6. SEARCH APPLY
    if (search && search.trim() !== "") {
      const query = search.toLowerCase();

      users = users.filter(
        (u) =>
          u.name?.toLowerCase().includes(query) ||
          u.email?.toLowerCase().includes(query)
      );
    }

    // =====================================================
    // ✅ 7. BLOCK OPTIMIZATION (Single Query 🚀)
    // =====================================================
    const userIds = users.map((u) => u._id);

    const blocks = await Block.find({
      $or: [
        { blocker: currentUserId, blocked: { $in: userIds } },
        { blocked: currentUserId, blocker: { $in: userIds } },
      ],
    });

    const blockedSet = new Set();

    blocks.forEach((b) => {
      if (b.blocker.toString() === currentUserId.toString()) {
        blockedSet.add(b.blocked.toString());
      } else {
        blockedSet.add(b.blocker.toString());
      }
    });

    // =====================================================
    // ✅ 8. FINAL FORMAT (Privacy + Block Apply)
    // =====================================================
    users = users.map((u) => {
      const isBlocked = blockedSet.has(u._id.toString());
      const isOwner = currentUserId.toString() === u._id.toString();

      const checkField = (setting) => {
        if (isOwner || setting === "everyone") return true;
        if (setting === "nobody") return false;
        if (setting === "contacts") return u.isContact;
        return false;
      };

      const showPic = !isBlocked && checkField(u.privacy?.profilePic);
      const showAbout = !isBlocked && checkField(u.privacy?.about);
      const showLastSeen = !isBlocked && checkField(u.privacy?.lastSeen);

      return {
        _id: u._id,
        name: u.name,
        email: u.email,

        isContact: u.isContact,
        contactId: u.contactId,

        isBlocked,

        profilePic: showPic ? u.profilePic : null,
        about: showAbout ? u.about : "",
        lastSeen: showLastSeen ? u.lastSeen : null,
        status: !isBlocked ? u.status : "",
      };
    });

    // =====================================================
    // ❌ OPTIONAL: block users hide karna ho to
    // =====================================================
    // users = users.filter(u => !u.isBlocked);

    res.json({
      success: true,
      users,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
exports.removeContact = async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const { contactId } = req.params;

    const user = await User.findById(currentUserId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const exists = user.contacts.includes(contactId);
    if (!exists) {
      return res.status(400).json({ success: false, message: "Contact not found" });
    }

    await User.findByIdAndUpdate(
      currentUserId,
      { $pull: { contacts: contactId } }
    );

    // 🔥 SOCKET EMIT
    const io = req.app.get("io");

    if (io) {
      const payload = {
        type: "REMOVE",
        userId: currentUserId,
        contactId,
      };

      io.to(currentUserId).emit("contact_update", payload);
      io.to(contactId).emit("contact_update", payload);
    }

    res.json({ success: true, message: "Contact removed successfully" });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};