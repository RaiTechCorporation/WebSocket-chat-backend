const mongoose = require("mongoose");
const Message = require("../models/Message");

exports.getMessages = async (req, res) => {
  try {
    const { user1, user2 } = req.params;
    const currentUserId = req.user.userId;

    const messages = await Message.find({
      $and: [
        {
          $or: [
            { senderId: user1, receiverId: user2 },
            { senderId: user2, receiverId: user1 }
          ]
        },
        {
          // Filter: Only show messages where currentUserId is NOT in the deletedFor array
          deletedFor: { $nin: [currentUserId] } 
        }
      ]
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

exports.getAllMessages = async (req, res) => {
  const { userId } = req.params;
  console.log("Fetching all messages for User ID:", userId);

  const messages = await Message.find({
    $or: [{ senderId: userId }, { receiverId: userId }]
  }).sort({ createdAt: 1 });

  res.json(messages);
};