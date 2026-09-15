module.exports = {
  config: {
    name: "antiout",
    version: "1.0.0",
    author: "TAHA KHAN",
    category: "events",
    description: "Group se nikalne wale members ko auto re-add karta hai"
  },

  onEvent: async function ({ api, event, threadsData, usersData }) {
    // Check if event is log:unsubscribe
    if (event.logMessageType !== "log:unsubscribe") return;

    const { threadID, logMessageData, author } = event;
    const leftUserID = logMessageData?.leftParticipantFbId;
    const botID = api.getCurrentUserID();

    // Agar leftUserID na ho ya bot khud nikla ho toh skip karo
    if (!leftUserID || String(leftUserID) === String(botID)) return;

    // Check if Antiout is disabled for this thread
    const threadData = await threadsData.get(threadID);
    if (threadData?.data?.antiout === false) return;

    // Agar user ne khud group chhoda hai (Self-separation)
    if (String(author) === String(leftUserID)) {
      const userName = (await usersData.getName(leftUserID)) || "Member";

      api.addUserToGroup(leftUserID, threadID, (err) => {
        if (err) {
          api.sendMessage(`Isse Dubara Add Nhi Kar Paya 🥺 ${userName} Group Mai :(`, threadID);
        } else {
          api.sendMessage(`Bhag Ke Jaane Ka Nhi, ${userName} Baby, Dekho Phir Se Add Kardiya Aapko`, threadID);
        }
      });
    }
  }
};
