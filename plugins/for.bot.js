const { cmd } = require('../lib/command');
const config = require('../config');

cmd({
 pattern: "bot",
 desc: "Bot replies with custom reply from config",
 category: "main",
 react: "🤖",
 filename: __filename
},
async (conn, m, msg, { reply }) => {
 try {
 if (!config.BOT_REPLY) {
 return await reply("⚠️ BOT_REPLY not set in config.");
 }
 await reply(config.BOT_REPLY);
 } catch (err) {
 console.error(err);
 await reply(`❌ Error: ${err.message}`);
 }
});