const axios = require("axios");
const yts = require("yt-search");
const fs = require("fs-extra");
const path = require("path");
const { pipeline } = require("stream/promises");
const { Transform } = require("stream");

module.exports = {
  config: {
    name: "khushi",
    aliases: ["dewani", "khush"],
    version: "22.0.0",
    author: "TAHA KHAN",
    countDown: 2,
    role: 0,
    description: {
      en: "Dewani — Auto replies to users when replying to bot messages (No Double Reply)",
      ur: "Dewani — Bot k message par sirf doosro k reply par answer kare gi"
    },
    category: "ai",
    guide: {
      en: "{pn} <message | song/video name>",
      ur: "{pn} <paigham | gane ya video ka naam>"
    }
  },

  chatMemory: {},

  AUDIO_API: "https://qzz.io",
  VIDEO_API: "https://qzz.io",
  YT_SEARCH: "https://vercel.app",
  AI_API: "https://qzz.io",
  MAX_FILE_SIZE: 25 * 1024 * 1024,
  OWNER_TAG: "»»𝐎𝐖𝐍𝐄𝐑««★™  »»𝐓𝐀𝐇𝐀 𝐊𝐇𝐀𝐍««",
  TRIGGER_WORDS: ["khushi", "dewani", "khush"],

  // Safe message sender function
  sendMsg(api, content, threadID, messageID, senderID) {
    return new Promise((resolve) => {
      api.sendMessage(content, threadID, (err, info) => {
        if (!err && info && global.GoatBot?.onReply) {
          global.GoatBot.onReply.set(info.messageID, {
            commandName: this.config.name,
            author: senderID,
            messageID: info.messageID
          });
        }
        resolve(info);
      }, messageID);
    });
  },

  fileSizeGuard(maxBytes) {
    let received = 0;
    return new Transform({
      transform(chunk, _, cb) {
        received += chunk.length;
        if (received > maxBytes) {
          const e = new Error("File too large");
          e.code = "TOO_LARGE";
          return cb(e);
        }
        cb(null, chunk);
      }
    });
  },

  async removeFile(p) {
    if (p && fs.existsSync(p)) {
      try { await fs.unlink(p); } catch {}
    }
  },

  async getYTInfo(query) {
    try {
      const { data } = await axios.get(`${this.YT_SEARCH}${encodeURIComponent(query)}`, { timeout: 8000 });
      const video = data?.result?.[0] || data?.result?.items?.[0];
      if (video) return { url: video.url, title: video.title };
    } catch (e) {}

    try {
      const search = await yts(query);
      if (search.videos?.[0]) {
        return { url: search.videos[0].url, title: search.videos[0].title };
      }
    } catch (err) {}

    return null;
  },

  isYouTubeUrl(text) {
    return /(youtube\.com|youtu\.be)/i.test(text);
  },

  // ===== AUDIO DOWNLOADER =====
  async downloadAudio(api, event, query) {
    const { threadID, messageID, senderID } = event;
    const cacheDir = path.join(__dirname, "cache");
    await fs.ensureDir(cacheDir);
    let filePath = null;

    api.setMessageReaction("⌛", messageID, () => {}, true);

    try {
      const info = this.isYouTubeUrl(query) ? { url: query, title: "Requested Media" } : await this.getYTInfo(query);
      if (!info || !info.url) {
        api.setMessageReaction("❌", messageID, () => {}, true);
        return this.sendMsg(api, "Maafi jaanu, ye audio nahi mili 🥺💔", threadID, messageID, senderID);
      }

      const { data } = await axios.post(this.AUDIO_API, { url: info.url }, { timeout: 30000 });
      const downloadUrl = data?.result?.video || data?.result?.download_url || data?.result?.url || data?.download_url;

      if (!downloadUrl) {
        api.setMessageReaction("❌", messageID, () => {}, true);
        return this.sendMsg(api, "Maafi jaanu, iska download link nahi mil raha 🥺", threadID, messageID, senderID);
      }

      filePath = path.join(cacheDir, `khushi_${senderID}_${Date.now()}.mp3`);
      const res = await axios({ url: downloadUrl, method: "GET", responseType: "stream", timeout: 60000 });

      await pipeline(
        res.data,
        this.fileSizeGuard(this.MAX_FILE_SIZE),
        fs.createWriteStream(filePath)
      );

      api.setMessageReaction("✅", messageID, () => {}, true);
      await this.sendMsg(api, {
        body: `${this.OWNER_TAG}\n\n𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰👉 MP3 file tayar hai! 💖\n🎵 Title: ${info.title}`,
        attachment: fs.createReadStream(filePath)
      }, threadID, messageID, senderID);

      await this.removeFile(filePath);

    } catch (err) {
      api.setMessageReaction("❌", messageID, () => {}, true);
      await this.removeFile(filePath);
      return this.sendMsg(api, "Jaanu server busy hai, thodi der baad try karna 🥺", threadID, messageID, senderID);
    }
  },

  // ===== VIDEO DOWNLOADER =====
  async downloadVideo(api, event, query) {
    const { threadID, messageID, senderID } = event;
    const cacheDir = path.join(__dirname, "cache");
    await fs.ensureDir(cacheDir);
    let filePath = null;

    api.setMessageReaction("⌛", messageID, () => {}, true);

    try {
      const info = this.isYouTubeUrl(query) ? { url: query, title: "Requested Media" } : await this.getYTInfo(query);
      if (!info || !info.url) {
        api.setMessageReaction("❌", messageID, () => {}, true);
        return this.sendMsg(api, "Maafi jaanu, ye video nahi mili 🥺💔", threadID, messageID, senderID);
      }

      const { data } = await axios.post(this.VIDEO_API, { url: info.url }, { timeout: 30000 });
      const downloadUrl = data?.result?.video || data?.result?.download_url || data?.result?.url || data?.download_url;

      if (!downloadUrl) {
        api.setMessageReaction("❌", messageID, () => {}, true);
        return this.sendMsg(api, "Maafi jaanu, iska download link nahi mil raha 🥺", threadID, messageID, senderID);
      }

      filePath = path.join(cacheDir, `khushi_${senderID}_${Date.now()}.mp4`);
      const res = await axios({ url: downloadUrl, method: "GET", responseType: "stream", timeout: 60000 });

      await pipeline(
        res.data,
        this.fileSizeGuard(this.MAX_FILE_SIZE),
        fs.createWriteStream(filePath)
      );

      api.setMessageReaction("✅", messageID, () => {}, true);
      await this.sendMsg(api, {
        body: `${this.OWNER_TAG}\n\n𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰👉 MP4 file tayar hai! 💖\n🎬 Title: ${info.title}`,
        attachment: fs.createReadStream(filePath)
      }, threadID, messageID, senderID);

      await this.removeFile(filePath);

    } catch (err) {
      api.setMessageReaction("❌", messageID, () => {}, true);
      await this.removeFile(filePath);
      return this.sendMsg(api, "Jaanu server busy hai, thodi der baad try karna 🥺", threadID, messageID, senderID);
    }
  },

  // ===== AI CHAT LOGIC =====
  async handleAI(api, event, cleanedMsg) {
    const { threadID, messageID, senderID } = event;

    this.chatMemory[threadID] = this.chatMemory[threadID] || [];
    this.chatMemory[threadID].push(`User: ${cleanedMsg}`);
    if (this.chatMemory[threadID].length > 5) this.chatMemory[threadID].shift();

    const prompt = `You are Dewani.

SYSTEM INSTRUCTIONS:
1. Persona: Act like a real human girl—funny, loving, playful, and completely non-robotic.
2. Languages: Speak fluently in simple Roman Urdu.
3. Owner: Owner name is TAHA KHAN.
4. STRICT LENGTH LIMIT: Keep every reply EXTREMELY short (maximum 1 to 2 lines only).
5. Emojis: Always use 1-2 soft emojis per message (like ❤️, 🤗, ✨, 😘).

Context:
${this.chatMemory[threadID].join("\n")}
Dewani:`;

    try {
      const res = await axios.post(this.AI_API, { prompt }, { timeout: 20000 });
      let reply = res.data?.result?.answer || res.data?.answer || "Jaanu kuch bolo na... 🥺";

      if (reply.length > 100) {
        reply = reply.split('.')[0] + " 🫣";
      }

      this.chatMemory[threadID].push(`Dewani: ${reply}`);

      return this.sendMsg(api, reply, threadID, messageID, senderID);
    } catch (e) {
      console.error("[khushi AI Error]", e.message);
      return this.sendMsg(api, "Net issue hai baby, main thak gayi hoon 🥺", threadID, messageID, senderID);
    }
  },

  // ===== MAIN PROCESSOR =====
  async processMessage(api, event, text) {
    let cleanedMsg = text.replace(/^(khushi|dewani|khush) occupational[\s,!.?:-]*/i, "").replace(/^(khushi|dewani|khush)[\s,!.?:-]*/i, "").trim();
    
    if (!cleanedMsg) {
      return this.sendMsg(api, "Ji jaanu, boliye kya baat hai? ❤️🤗", event.threadID, event.messageID, event.senderID);
    }

    const lowerText = cleanedMsg.toLowerCase();

    if (lowerText.startsWith("video ") || lowerText.startsWith("mp4 ")) {
      const query = cleanedMsg.replace(/^(video|mp4)[\s]*/i, "").trim();
      return this.downloadVideo(api, event, query);
    } 
    
    if (lowerText.startsWith("audio ") || lowerText.startsWith("mp3 ") || lowerText.startsWith("song ")) {
      const query = cleanedMsg.replace(/^(audio|mp3|song)[\s]*/i, "").trim();
      return this.downloadAudio(api, event, query);
    }

    return this.handleAI(api, event, cleanedMsg);
  },

  // ===== GOATBOT ENGINE EVENTS =====
  async onStart({ api, event, args }) {
    const text = args.join(" ");
    return this.processMessage(api, event, text);
  },

  async onChat({ api, event }) {
    if (!event.body) return;
    
    // [FIX] যদি মেসেজটি কোনো রিপ্লাই হয়, তবে onChat এক্সিকিউট হবে না (onReply হ্যান্ডেল করবে)
    if (event.messageReply) return; 

    const body = event.body.trim();
    const lowerBody = body.toLowerCase();

    const isTriggered = this.TRIGGER_WORDS.some(t => lowerBody === t || lowerBody.startsWith(t + " "));
    
    if (isTriggered) {
      return this.processMessage(api, event, body);
    }
  },

  async onReply({ api, event, Reply }) {
    if (event.senderID === api.getCurrentUserID()) return;

    if (Reply && Reply.commandName === this.config.name) {
      return this.processMessage(api, event, event.body || "");
    }
  }
};
