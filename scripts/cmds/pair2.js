const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

module.exports = {
  config: {
    name: "pair2",
    aliases: ["couple2", "match2"],
    version: "1.0.2",
    author: "Bot",
    countDown: 5,
    role: 0,
    description: {
      en: "Pair with mentioned user using exact chocolate frame layout",
      ur: "Naye chocolate frame ke mutabiq exact positioning ke sath couple pair karein"
    },
    category: "fun",
    guide: {
      en: "{pn} [@mention / reply]",
      ur: "{pn} [@mention / reply]"
    }
  },

  TEMPLATE_URL: "https://up6.cc/2026/09/178972937443311.jpg",

  async onStart({ api, event, args }) {
    const { threadID, messageID, senderID, mentions, type, messageReply } = event;

    let targetID;
    let targetName = "";

    if (mentions && Object.keys(mentions).length > 0) {
      targetID = Object.keys(mentions)[0];
      targetName = mentions[targetID].replace(/@/g, "").trim();
    } else if (type === "message_reply") {
      targetID = messageReply.senderID;
    } else {
      return api.sendMessage(
        "❌ **Aapne kisi ko mention nahi kiya!**\n\n💡 *Istemaal ka tarika:* Kisi member ko `@mention` karein ya unke message par `reply` karke `.pair2` likhein.",
        threadID,
        messageID
      );
    }

    if (targetID === senderID) {
      return api.sendMessage("😅 Apne aap ko mention nahi kar sakte! Kisi aur ko mention karein.", threadID, messageID);
    }

    if (api.setMessageReaction) api.setMessageReaction("❤️", messageID, () => {}, true);

    try {
      const userInfo = await api.getUserInfo([senderID, targetID]);
      const senderName = userInfo[senderID]?.name || "User 1";
      if (!targetName) {
        targetName = userInfo[targetID]?.name || "User 2";
      }

      const matchPercentage = Math.floor(Math.random() * 26) + 75;

      const cacheDir = path.join(__dirname, "cache");
      await fs.ensureDir(cacheDir);
      const outputPath = path.join(cacheDir, `pair2_${senderID}_${targetID}_${Date.now()}.png`);

      const senderAvatarUrl = `https://graph.facebook.com/${senderID}/picture?width=500&height=500&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662`;
      const targetAvatarUrl = `https://graph.facebook.com/${targetID}/picture?width=500&height=500&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662`;

      try {
        const [bgImage, senderImg, targetImg] = await Promise.all([
          loadImage(this.TEMPLATE_URL),
          loadImage(senderAvatarUrl),
          loadImage(targetAvatarUrl)
        ]);

        const canvas = createCanvas(bgImage.width, bgImage.height);
        const ctx = canvas.getContext("2d");

        // 1. Draw Background Template
        ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);

        // 2. Frame Center Positions (Matching Gold Rings)
        const leftX = Math.floor(canvas.width * 0.202);
        const rightX = Math.floor(canvas.width * 0.798);
        const centerY = Math.floor(canvas.height * 0.495);
        const radius = Math.floor(canvas.height * 0.232);

        // Circular DP Clipping
        const drawClippedDP = (img, x, y, r) => {
          ctx.save();
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2, true);
          ctx.closePath();
          ctx.clip();
          ctx.drawImage(img, x - r, y - r, r * 2, r * 2);
          ctx.restore();
        };

        // Draw Left & Right DPs inside Gold Frames
        drawClippedDP(senderImg, leftX, centerY, radius);
        drawClippedDP(targetImg, rightX, centerY, radius);

        // 3. Name Banners Position (Bottom Gold Frames)
        const bannerY = Math.floor(canvas.height * 0.865);
        const nameFontSize = Math.floor(canvas.height * 0.048);

        ctx.textAlign = "center";
        ctx.font = `bold ${nameFontSize}px "Arial", sans-serif`;

        // Metallic Gold Font Style
        const textGradient = ctx.createLinearGradient(0, bannerY - nameFontSize, 0, bannerY);
        textGradient.addColorStop(0, "#FFF3A1");
        textGradient.addColorStop(0.5, "#FFD700");
        textGradient.addColorStop(1, "#FFA500");

        ctx.fillStyle = textGradient;
        ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
        ctx.shadowBlur = 6;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 2;

        const formatBannerName = (name) => {
          return name.length > 12 ? name.substring(0, 10) + ".." : name;
        };

        // Draw Names inside Bottom Gold Banners
        ctx.fillText(formatBannerName(senderName), leftX, bannerY);
        ctx.fillText(formatBannerName(targetName), rightX, bannerY);

        // Save Image Output
        const buffer = canvas.toBuffer("image/png");
        await fs.writeFile(outputPath, buffer);

        await api.sendMessage(
          {
            body: `💖 **𝙋𝘼𝙄𝙍𝙄𝙉𝙂 𝙈𝘼𝙏𝘾𝙃** 💖\n━━━━━━━━━━━━━━━━━━━━\n👤 **${senderName}** ❤️ 👤 **${targetName}**\n\n📊 **Love Rate:** ${matchPercentage}%\n✨ *Aap dono ki jodi bilkul perfect hai!* 💕`,
            attachment: fs.createReadStream(outputPath),
            mentions: [
              { tag: senderName, id: senderID },
              { tag: targetName, id: targetID }
            ]
          },
          threadID,
          messageID
        );

        if (fs.existsSync(outputPath)) await fs.unlink(outputPath);

      } catch (imgErr) {
        console.error("[PAIR2 CANVAS ERROR]:", imgErr);
        await api.sendMessage(
          {
            body: `💖 **𝙋𝘼𝙄𝙍𝙄𝙉𝙂 𝙈𝘼𝙏𝘾𝙃** 💖\n━━━━━━━━━━━━━━━━━━━━\n👤 **${senderName}** ❤️ 👤 **${targetName}**\n\n📊 **Love Rate:** ${matchPercentage}%\n✨ *Aap dono ki jodi bilkul perfect hai!* 💕`,
            mentions: [
              { tag: senderName, id: senderID },
              { tag: targetName, id: targetID }
            ]
          },
          threadID,
          messageID
        );
      }

    } catch (err) {
      console.error("[PAIR2 CMD ERROR]:", err);
      return api.sendMessage("❌ Pair command chalane me error aaya!", threadID, messageID);
    }
  }
};
