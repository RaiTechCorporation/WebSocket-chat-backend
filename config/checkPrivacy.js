const User = require("../models/User"); // Path check kar lena

const checkPrivacy = async (req, res, next) => {
  try {
    const targetUserId = req.params.id || req.query.userId;
    const viewerId = req.user?.userId; // Maan ke chal rahe hain ki auth middleware pehle hai

    const targetUser = await User.findById(targetUserId);

    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Default Filters (Sab kuch hidden maan ke chalo)
    let filters = {
      showProfilePic: false,
      showAbout: false,
      showStatus: false,
      showLastSeen: false
    };

    // Agar khud ki profile hai toh sab dikhao
    if (viewerId && viewerId.toString() === targetUserId.toString()) {
      filters = { showProfilePic: true, showAbout: true, showStatus: true, showLastSeen: true };
      req.privacyFilters = filters;
      req.targetUser = targetUser;
      return next();
    }

    // Helper function to check specific field privacy
    const canSee = (setting, targetUser, viewerId) => {
      if (setting === "everyone") return true;
      if (setting === "nobody") return false;
      if (setting === "contacts") {
        // Check if viewer is in target's contact list
        return targetUser.contacts && targetUser.contacts.includes(viewerId);
      }
      return false;
    };

    // Privacy Logic Apply Karo
    filters.showProfilePic = canSee(targetUser.privacy.profilePic, targetUser, viewerId);
    filters.showAbout = canSee(targetUser.privacy.about, targetUser, viewerId);
    filters.showStatus = canSee(targetUser.privacy.status, targetUser, viewerId);
    filters.showLastSeen = canSee(targetUser.privacy.lastSeen, targetUser, viewerId);

    req.privacyFilters = filters;
    req.targetUser = targetUser;
    next();
  } catch (err) {
    res.status(500).json({ message: "Privacy check failed", error: err.message });
  }
};

module.exports = checkPrivacy;