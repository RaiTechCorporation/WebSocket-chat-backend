const Message = require("../models/Message");

exports.uploadFiles = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    const { senderId, receiverId } = req.body;

    const savedFiles = [];

    for (let file of req.files) {
      const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${file.filename}`;

      const newFile = await Message.create({
        fileName: file.originalname,
        fileType: file.mimetype,
        fileUrl,
        senderId,
        receiverId
      });

      savedFiles.push(newFile);
    }

    res.json({
      success: true,
      files: savedFiles
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
