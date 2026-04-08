const mongoose = require("mongoose");

const blacklistedTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: "7d", // auto delete after token expiry
  },
});

module.exports = mongoose.model("BlacklistedToken", blacklistedTokenSchema);