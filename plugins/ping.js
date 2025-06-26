const config = require('../config');
const { cmd } = require('../lib/command');

cmd({
    pattern: "ping",
    alias: ["speed", "pong"],
    use: '.ping',
    desc: "Check bot's response time.",
    category: "main",
    react: "👀",
    filename: __filename
},
async (conn, mek, msg, { from, quoted, sender, reply }) => {
    try {
        const start = Date.now();

        // Random emoji lists
        const reactionEmojis = ['⛅🌦️🌤️', '💘💝💖', '👻⛄👀', '🪁🪃🎳', '🎀🎁🎈', '🙊🙉🙈', '👻💀☠️', '🤍🩷🩶', '☁️🌨️🌧️', '🌦️🌥️⛅', '🌜🌚🌝', '🥀🌹💐', '☃️🪺🪹', '🍂🍄🌾', '🍁🌴🍀', '🐼🐹🐰', '👻⛄☃️', '⚡✨🌟'];
        const textEmojis = ['👀', '⛈️', '💖'];

        const reactionEmoji = reactionEmojis[Math.floor(Math.random() * reactionEmojis.length)];
        let textEmoji = textEmojis[Math.floor(Math.random() * textEmojis.length)];

        // Make sure text and reaction emojis are different
        while (textEmoji === reactionEmoji) {
            textEmoji = textEmojis[Math.floor(Math.random() * textEmojis.length)];
        }

        // Send reaction emoji to message
        await conn.sendMessage(from, {
            react: { text: textEmoji, key: mek.key }
        });

        const end = Date.now();
        const responseTime = (end - start) / 1000;

        const text = `◈${reactionEmoji}
*╰┈➤ 𝐏O͒N͒𝐆 ${responseTime.toFixed(2)} 𝐌s*`;

        await conn.sendMessage(from, {
            text,
            contextInfo: {
                mentionedJid: [sender],
                forwardingScore: 999,
                isForwarded: false,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '',
                    newsletterName: '',
                    serverMessageId: 143
                }
            }
        }, { quoted: mek });

    } catch (e) {
        console.error("❌ Error in ping command:", e);
        reply(`⚠️ An error occurred: ${e.message}`);
    }
});




cmd({
    pattern: "p",
    desc: "Check bot response",
    category: "main",
    filename: __filename
},
async (conn, mek, msg) => {
    const start = Date.now();
    await msg.reply("👀");
    const end = Date.now();
    await msg.reply(`🏓 Pong! ${((end - start) / 1000).toFixed(2)}s`);
});