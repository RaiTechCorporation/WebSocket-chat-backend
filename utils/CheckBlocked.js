const Block = require("../models/Block");

exports.getBlockedUserIds = async (userId, targetIds = []) => {
  const blocks = await Block.find({
    $or: [
      { blocker: userId, blocked: { $in: targetIds } },
      { blocked: userId, blocker: { $in: targetIds } },
    ],
  });

  const blockedSet = new Set();

  blocks.forEach((b) => {
    if (b.blocker.toString() === userId.toString()) {
      blockedSet.add(b.blocked.toString());
    } else {
      blockedSet.add(b.blocker.toString());
    }
  });

  return blockedSet;
};
