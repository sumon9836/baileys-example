
const fs = require('fs');
if (fs.existsSync('.env')) require('dotenv').config({ path: './.env' });



module.exports = {
    SESSION_ID: process.env.SESSION_ID || 'KAISEN~L8AmHKYb#RyvdVwEJ_CtIsEEM3CVGdheHmgMa1sqvqvbhmxN9NPY',
    PREFIX: process.env.PREFIX || '.',
    MODE: process.env.MODE || 'public', // public, private, inbox, groups
    ALWAYS_ONLINE: process.env.ALWAYS_ONLINE || 'true',
    READ_MESSAGE: process.env.READ_MESSAGE || 'true',
    AUTO_STATUS_SEEN: process.env.AUTO_STATUS_SEEN || 'true',
    AUTO_STATUS_REACT: process.env.AUTO_STATUS_REACT || 'false',
    AUTO_STATUS_REPLY: process.env.AUTO_STATUS_REPLY || 'false',
    AUTO_STATUS_MSG: process.env.AUTO_STATUS_MSG || '👀 Status seen by bot',
    AUTO_REACT: process.env.AUTO_REACT || 'false',
    CUSTOM_REACT: process.env.CUSTOM_REACT || 'false',
    CUSTOM_REACT_EMOJIS: process.env.CUSTOM_REACT_EMOJIS || '👍,❤️,😂,😮,😢,😡',
    packname: 'WhatsApp Bot',
    author: 'Bot Creator',
    BOT_REPLY: "*Hello! I am CRUSH-BOY bot. How can I help you?* 🤖",
    ownerNumber: '919876543210' // ❌ string, not array
};
