
const config = require('../config');
const { cmd, commands } = require('../lib/command');

cmd({
    pattern: "menu",
    alias: ["help", "commands"],
    use: '.menu',
    desc: "Show bot menu with all commands.",
    category: "main",
    react: "📋",
    filename: __filename
},
async (conn, mek, m, { from, quoted, sender, reply }) => {
    try {
        let menu = `
╭━━━〔 🤖 𝐁𝐎𝐓 𝐌𝐄𝐍𝐔 〕━━━✦
┃
┃ 👋 𝐇𝐞𝐥𝐥𝐨! 𝐈'𝐦 𝐲𝐨𝐮𝐫 𝐖𝐡𝐚𝐭𝐬𝐀𝐩𝐩 𝐁𝐨𝐭
┃
┃ 📱 𝐏𝐑𝐄𝐅𝐈𝐗: ${config.PREFIX}
┃ 🔧 𝐌𝐎𝐃𝐄: ${config.MODE}
┃
╰━━━━━━━━━━━━━━━━━━━━━━━━━━✦

╭━━━〔 📋 𝐂𝐎𝐌𝐌𝐀𝐍𝐃𝐒 〕━━━✦
┃
`;

        const categories = {};
        commands.forEach(cmd => {
            if (!categories[cmd.category]) {
                categories[cmd.category] = [];
            }
            categories[cmd.category].push(cmd);
        });

        Object.keys(categories).forEach(category => {
            menu += `┃ 📁 ${category.toUpperCase()}\n`;
            categories[category].forEach(cmd => {
                menu += `┃ ├ ${config.PREFIX}${cmd.pattern}`;
                if (cmd.desc) menu += ` - ${cmd.desc}`;
                menu += `\n`;
            });
            menu += `┃\n`;
        });

        menu += `╰━━━━━━━━━━━━━━━━━━━━━━━━━━✦

🔗 Bot created with ❤️`;

        await conn.sendMessage(from, {
            text: menu,
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
        console.error("Error in menu command:", e);
        reply(`An error occurred: ${e.message}`);
    }
});
