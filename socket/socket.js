// server.js or socket.js
const Message = require("../models/Message");
const fs = require("fs");
const path = require("path");
const User = require("../models/User");
const Status = require("../models/statusSchema");


let users = {}; // { userId: socketId }

const socketHandler = (io) => {
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // 1️⃣ Join: track online users
    socket.on("join", async (userId) => {
      users[userId] = socket.id;

      await User.findByIdAndUpdate(userId, {
        status: "online",
        lastSeen: null,
      });

      io.emit("user_status", {
        userId,
        status: "online",
      });
    });

    // 2️⃣ Send text message
    socket.on("private_message", async ({ senderId, receiverId, message, type, contact, pollOptions, question, replyTo, replyData
    }) => {
      let newMsg = await Message.create({
        senderId,
        receiverId,
        message,
        type,
        contact,
        status: "sent",
        pollOptions: pollOptions || [], // Array format: [{optionText: "A", votes: []}]
        question,
        replyTo: replyTo || null,
        replyData: replyData || null

      });
      console.log("senderId:", senderId);
      console.log("New message created:", newMsg);
      console.log("receiverId:", receiverId);
      const receiverSocket = users[receiverId]; // check if receiver is online

      if (receiverSocket) {
        newMsg = await Message.findByIdAndUpdate(
          newMsg._id,
          { status: "delivered" },
          { new: true }
        );

        io.to(receiverSocket).emit("private_message", newMsg); // send to receiver
        io.to(socket.id).emit("private_message", newMsg); // send to sender
      } else {
        io.to(socket.id).emit("private_message", newMsg); // offline: only sender sees
      }
    });
    // server.js / socket logic
    socket.on("vote_poll", async ({ messageId, optionIndex, userId, receiverId }) => {
      try {
        const msg = await Message.findById(messageId);
        if (!msg) return;

        const hasVoted = msg.pollOptions[optionIndex].votes.includes(userId);

        let updateQuery;
        if (hasVoted) {
          // 🔴 AGAR PEHLE SE VOTE HAI: Toh $pull karke remove karo
          updateQuery = { $pull: { [`pollOptions.${optionIndex}.votes`]: userId } };
        } else {
          // 🟢 AGAR VOTE NAHI HAI: Toh $addToSet karke add karo
          updateQuery = { $addToSet: { [`pollOptions.${optionIndex}.votes`]: userId } };
        }

        const updatedPoll = await Message.findByIdAndUpdate(messageId, updateQuery, { new: true });

        // Dono ko update bhejo
        const receiverSocket = users[receiverId];
        io.to(socket.id).emit("poll_updated", updatedPoll);
        if (receiverSocket) io.to(receiverSocket).emit("poll_updated", updatedPoll);

      } catch (err) {
        console.error("Poll Toggle Error:", err);
      }
    });

    socket.on("file_uploaded", async (fileMsg) => {
      try {
        const receiverSocket = users[fileMsg.receiverId];

        let updatedMsg = fileMsg;

        if (receiverSocket) {
          updatedMsg = await Message.findByIdAndUpdate(
            fileMsg._id,
            { status: "delivered" },
            { new: true }
          );

          io.to(receiverSocket).emit("private_message", updatedMsg);
        }

        io.to(socket.id).emit("private_message", updatedMsg);

      } catch (err) {
        console.error(err);
      }
    });

    // 4️⃣ Mark messages as seen
    socket.on("markSeen", async ({ senderId, receiverId }) => {
      try {
        await Message.updateMany(
          {
            senderId,
            receiverId,
            status: { $ne: "seen" },
          },
          { status: "seen" }
        );

        const senderSocket = users[senderId];
        if (senderSocket) {
          io.to(senderSocket).emit("messagesSeen", { senderId, receiverId });
        }
      } catch (err) {
        console.error(err);
      }
    });



    // 5️⃣ Delete message (everyone / me)
    socket.on("deleteMessage", async ({ messageId, type, fileUrl, deleteFor, userId }) => {
      try {
        const msg = await Message.findById(messageId);
        if (!msg) return socket.emit("error", { message: "Message not found!" });

        if (deleteFor === "everyone") {
          // 🔴 Delete for everyone (Physical Delete)
          await Message.findByIdAndDelete(messageId);

          // File Cleanup
          if ((type === "image" || type === "document") && fileUrl) {
            const filePath = path.join(process.cwd(), "uploads", fileUrl);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
          }

          // Notify all users in the chat/room
          io.emit("messageDeleted", { messageId, deleteFor: "everyone" });

        } else if (deleteFor === "me") {
          // 🟢 Delete only for this user (Logical Delete)

          // Use $addToSet to prevent duplicate IDs in the array
          await Message.findByIdAndUpdate(messageId, {
            $addToSet: { deletedFor: userId }
          });

          // Notify ONLY the sender that it was successful so they can update their UI
          socket.emit("messageDeleted", { messageId, deleteFor: "me" });
        }
      } catch (err) {
        console.error("Delete Error:", err);
        socket.emit("error", { message: "Failed to delete message" });
      }
    });

    socket.on("forwardMessage", async (data) => {
      try {
        const { message, type, fileUrl, senderId, receiverId } = data;
        console.log("Forwarding message:", data);

        const newMessage = await Message.create({
          senderId,
          receiverId,
          message,        // ✅ FIXED
          type,
          fileUrl,
          forwarded: true,
          status: "sent"
        });

        const receiverSocket = users[receiverId];

        if (receiverSocket) {
          const updatedMsg = await Message.findByIdAndUpdate(
            newMessage._id,
            { status: "delivered" },
            { new: true }
          );

          io.to(receiverSocket).emit("private_message", updatedMsg);
          io.to(socket.id).emit("private_message", updatedMsg);
        } else {
          io.to(socket.id).emit("private_message", newMessage);
        }

      } catch (err) {
        console.error("Forward Error:", err);
        socket.emit("error", { message: "Forward failed" });
      }
    });

    socket.on("sendReaction", async ({ messageId, emoji, senderId, receiverId }) => {
      try {
        const msg = await Message.findById(messageId);
        if (!msg) return;

        const existingReaction = msg.reactions.find(
          r => r.userId.toString() === senderId.toString()
        );

        let updatedMsg;

        if (existingReaction) {
          if (existingReaction.emoji === emoji) {
            // ❌ SAME emoji → REMOVE (toggle off)
            updatedMsg = await Message.findByIdAndUpdate(
              messageId,
              {
                $pull: { reactions: { userId: senderId } }
              },
              { new: true }
            );
          } else {
            // 🔁 Different emoji → UPDATE
            updatedMsg = await Message.findOneAndUpdate(
              { _id: messageId, "reactions.userId": senderId },
              { $set: { "reactions.$.emoji": emoji } },
              { new: true }
            );
          }
        } else {
          // ➕ New reaction
          updatedMsg = await Message.findByIdAndUpdate(
            messageId,
            {
              $push: {
                reactions: { userId: senderId, emoji }
              }
            },
            { new: true }
          );
        }

        const receiverSocket = users[receiverId];

        // Emit to sender
        io.to(socket.id).emit("reaction_updated", updatedMsg);

        // Emit to receiver
        if (receiverSocket) {
          io.to(receiverSocket).emit("reaction_updated", updatedMsg);
        }

      } catch (err) {
        console.error("Reaction Error:", err);
      }
    });


    // socket.on("upload_status", async ({ userId, stories }) => {
    //   try {
    //     const updatedStatus = await Status.findOneAndUpdate(
    //       { userId },
    //       {
    //         $push: { stories: { $each: stories } },
    //         $set: { createdAt: new Date() }
    //       },
    //       { upsert: true, new: true }
    //     ).populate("userId", "name profileImg");

    //     // 👇 contacts ko bhejo
    //     const user = await User.findById(userId).populate("contacts");

    //     user.contacts.forEach(contact => {
    //       const contactSocket = users[contact._id.toString()];
    //       if (contactSocket) {
    //         io.to(contactSocket).emit("status_update_received", updatedStatus);
    //       }
    //     });

    //   } catch (err) {
    //     console.error(err);
    //   }
    // });
    socket.on("disconnect", async () => {
      let userId;

      for (let id in users) {
        if (users[id] === socket.id) {
          userId = id;
          delete users[id];
          break;
        }
      }

      if (userId) {
        const time = new Date();

        await User.findByIdAndUpdate(userId, {
          status: "offline",
          lastSeen: time,
        });

        io.emit("user_status", {
          userId,
          status: "offline",
          lastSeen: time,
        });
      }
    });
  });
};

module.exports = socketHandler;