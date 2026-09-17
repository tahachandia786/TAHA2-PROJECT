module.exports = {
  config: {
    name: "disableAutoSeen",
    version: "1.0.0",
    author: "Bot",
    category: "events",
    description: "Permanently disable auto-seen in GoatBot"
  },

  onLoad: async function ({ api }) {
    // Override api.markAsRead so bot NEVER marks any message as read
    api.markAsRead = function (threadID, callback) {
      if (typeof callback === "function") callback(null);
      return Promise.resolve(true);
    };
    console.log("--> [AutoSeen System] Permanently OFF / Disabled!");
  },

  onStart: async function () {
    // No action needed on chat events
  }
};

