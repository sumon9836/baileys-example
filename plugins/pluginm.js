const fs = require('fs');
const path = require('path');
const { cmd } = require('../lib/command');

cmd({
    pattern: "plugin",
    desc: "Add a plugin file via text",
    category: "main",
    react: "🧠",
    filename: __filename
},
async (conn, m, msg, {
    text, args, q, reply
}) => {
    try {
        if (!q) return  reply(`📌 Send plugin code like:\n.plugin <plugin code>`);

        // Match the plugin pattern name
        const match = q.match(/pattern:\s*["'`]([^"'`]+)["'`]/i);
        if (!match) return await reply(`❌ Pattern not found in plugin code!`);

        const pattern = match[1].trim();
        const fileName = `${pattern}.js`;
        const savePath = path.join(__dirname, '..', 'plugins', fileName);

        // Check if already exists
        if (fs.existsSync(savePath)) {
            return await reply(`⚠️ Plugin *${fileName}* already exists!`);
        }

        // Save plugin file
        fs.writeFileSync(savePath, q);
        await reply(`✅ Plugin *${pattern}* saved successfully as *plugins/${fileName}*\n♻️ Restarting bot to apply...`);

        // Auto restart bot (PM2 will auto-restart)
        setTimeout(() => {
            process.exit(1);
        }, 1000);

    } catch (err) {
        console.error(err);
        return await reply(`❌ Error: ${err.message}`);
    }
});



cmd({
  pattern: "unplugin",
  desc: "Delete a plugin and restart bot",
  category: "main",
  react: "🗑️",
  filename: __filename
},
async (conn, m, msg, { args, q, reply }) => {
  try {
    if (!q) return await reply("❌ Please specify the plugin name to delete.\nExample: `.unplugin ping2`");

    const pluginName = q.trim().replace(/\.js$/i, '');
    const filePath = path.join(__dirname, '..', 'plugins', `${pluginName}.js`);

    if (!fs.existsSync(filePath)) {
      return await reply(`❌ Plugin *${pluginName}* not found in /plugins`);
    }

    fs.unlinkSync(filePath);
    await reply(`✅ Plugin *${pluginName}* deleted from /plugins\n♻️ Restarting bot to apply changes...`);

    // Exit and let PM2 or similar restart the bot
    setTimeout(() => {
      process.exit(1);
    }, 1000);

  } catch (err) {
    console.error(err);
    return await reply(`❌ Error deleting plugin: ${err.message}`);
  }
});