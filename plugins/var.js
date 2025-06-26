const fs = require('fs');
const path = require('path');
const { cmd } = require('../lib/command');

cmd({
  pattern: "setvar",
  desc: "Set or update variables in .env file",
  category: "owner",
  react: "⚙️",
  filename: __filename
},
async (conn, m, msg, { q, reply }) => {
  try {
    if (!q || !q.includes(" ")) {
      return await reply("❌ Use format: .setvar KEY value\n\nExample: .setvar MODE public");
    }

    const [key, ...rest] = q.trim().split(" ");
    const value = rest.join(" ");
    const envPath = path.join(__dirname, '..', '.env');

    let envContent = "";
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }

    const lines = envContent.split('\n');
    const keyIndex = lines.findIndex(line => line.startsWith(`${key}=`));

    if (keyIndex !== -1) {
      lines[keyIndex] = `${key}=${value}`;
    } else {
      lines.push(`${key}=${value}`);
    }

    fs.writeFileSync(envPath, lines.filter(Boolean).join('\n') + '\n');

    await reply(`✅ Environment variable *${key}* set to: ${value}\n♻️ Restarting bot to apply changes...`);

    // Force restart for changes to take effect
    setTimeout(() => {
      process.exit(1);
    }, 1000);

  } catch (err) {
    console.error(err);
    await reply(`❌ Error: ${err.message}`);
  }
});



cmd({
  pattern: "getvar",
  desc: "Show all variables from .env",
  category: "owner",
  react: "📄",
  filename: __filename
},
async (conn, m, msg, { reply }) => {
  try {
    const envPath = path.join(__dirname, '..', '.env');

    if (!fs.existsSync(envPath)) {
      return await reply("❌ .env file not found!");
    }

    const envContent = fs.readFileSync(envPath, 'utf8').trim();

    if (!envContent) {
      return await reply("📭 .env file is empty.");
    }

    const formatted = envContent
      .split('\n')
      .filter(line => line.trim() !== '')
      .map(line => `🔹 ${line}`)
      .join('\n');

    await reply(`📦 *Current .env Variables:*\n\n${formatted}`);

  } catch (err) {
    console.error(err);
    await reply(`❌ Error reading .env: ${err.message}`);
  }
});


cmd({
  pattern: "delvar",
  desc: "Delete a variable from .env",
  category: "owner",
  react: "🗑️",
  filename: __filename
},
async (conn, m, msg, { q, reply }) => {
  try {
    if (!q) return await reply("❌ Please provide the variable name to delete.\n\nExample: .delvar MODE");

    const keyToDelete = q.trim().replace(/\.js$/i, '');
    const envPath = path.join(__dirname, '..', '.env');

    if (!fs.existsSync(envPath)) {
      return await reply("❌ .env file not found.");
    }

    let envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');

    const filtered = lines.filter(line => !line.startsWith(`${keyToDelete}=`));

    if (lines.length === filtered.length) {
      return await reply(`⚠️ Key *${keyToDelete}* not found in .env.`);
    }

    fs.writeFileSync(envPath, filtered.filter(Boolean).join('\n') + '\n');

    await reply(`✅ Variable *${keyToDelete}* deleted from .env\n♻️ Restarting bot to apply changes...`);

    // Restart bot
    setTimeout(() => {
      process.exit(1);
    }, 1000);

  } catch (err) {
    console.error(err);
    await reply(`❌ Error deleting variable: ${err.message}`);
  }
});