
const config = require('../config');
const { cmd, commands } = require('../lib/command');
const { runtime } = require('../lib/functions');

cmd({
    pattern: "alive",
    alias: ["status", "uptime"],
    use: '.alive',
    desc: "Check if bot is alive and show uptime.",
    category: "main",
    react: "🤖",
    filename: __filename
},
async (conn, mek, m, { from, quoted, sender, reply }) => {
    try {
        const uptime = runtime(process.uptime());
        
        const message = `
╭━━━〔 🤖 𝐁𝐎𝐓 𝐒𝐓𝐀𝐓𝐔𝐒 〕━━━✦
┃
┃ ✅ 𝐁𝐨𝐭 𝐢𝐬 𝐀𝐥𝐢𝐯𝐞!
┃
┃ ⏰ 𝐔𝐩𝐭𝐢𝐦𝐞: ${uptime}
┃ 🔧 𝐌𝐨𝐝𝐞: ${config.MODE}
┃ 📱 𝐏𝐫𝐞𝐟𝐢𝐱: ${config.PREFIX}
┃
╰━━━━━━━━━━━━━━━━━━━━━━━━━━✦`;

        await conn.sendMessage(from, {
            text: message,
            contextInfo: {
                mentionedJid: [sender],
                forwardingScore: 999,
                isForwarded: false,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '',
                    newsletterName: "WhatsApp Bot",
                    serverMessageId: 143
                }
            }
        }, { quoted: mek });

    } catch (e) {
        console.error("Error in alive command:", e);
        reply(`An error occurred: ${e.message}`);
    }
});
