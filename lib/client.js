
const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    jidNormalizedUser,
    isJidBroadcast,
    getContentType,
    proto,
    generateWAMessageContent,
    generateWAMessage,
    AnyMessageContent,
    prepareWAMessageMedia,
    areJidsSameUser,
    downloadContentFromMessage,
    MessageRetryMap,
    generateForwardMessageContent,
    generateWAMessageFromContent,
    generateMessageID,
    makeInMemoryStore,
    jidDecode,
    fetchLatestBaileysVersion,
    Browsers
} = require('@whiskeysockets/baileys');

const { getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, runtime, sleep, fetchJson } = require('./functions');
const { AntiDelDB, initializeAntiDeleteSettings, setAnti, getAnti, getAllAntiDeleteSettings, saveContact, loadMessage, getName, getChatSummary, saveGroupMetadata, getGroupMetadata, saveMessageCount, getInactiveGroupMembers, getGroupMembersMessageCount, saveMessage } = require('../data');
const fs = require('fs');
const P = require('pino');
const config = require('../config');
const qrcode = require('qrcode-terminal');
const util = require('util');
const { sms, downloadMediaMessage, AntiDelete } = require('./index');
const FileType = require('file-type');
const axios = require('axios');
const { File } = require('megajs');
const os = require('os');
const path = require('path');
const { cmd, commands } = require('./command');

const prefix = config.PREFIX;
const mode = config.MODE;
const ownerNumber = ['917003816486'];
const online = config.ALWAYS_ONLINE;

const tempDir = path.join(os.tmpdir(), 'cache-temp');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
}

const clearTempDir = () => {
    fs.readdir(tempDir, (err, files) => {
        if (err) throw err;
        for (const file of files) {
            fs.unlink(path.join(tempDir, file), err => {
                if (err) throw err;
            });
        }
    });
};

setInterval(clearTempDir, 5 * 60 * 1000);

const express = require("express");
const app = express();
const port = process.env.PORT || 9090;

// Helper function to get file size
const getSizeMedia = (data) => {
    return data.length;
};

async function connectToWA() {
    console.log("Connecting to WhatsApp ⏳️...");

    // Create sessions directory if it doesn't exist
    const sessionsDir = path.join(__dirname, '..', 'sessions');
    if (!fs.existsSync(sessionsDir)) {
        fs.mkdirSync(sessionsDir, { recursive: true });
    }

    if (!fs.existsSync(path.join(sessionsDir, 'creds.json'))) {
        if (!config.SESSION_ID) {
            console.log('Please add your session to SESSION_ID env !!');
            return;
        }
        const sessdata = config.SESSION_ID.replace("KAISEN~", '');
        try {
            const filer = File.fromURL(`https://mega.nz/file/${sessdata}`);
            filer.download((err, data) => {
                if (err) throw err;
                fs.writeFileSync(path.join(sessionsDir, 'creds.json'), data);
                console.log("Session downloaded ✅");
            });
        } catch (error) {
            console.log('Error downloading session:', error.message);
        }
    }

    const { state, saveCreds } = await useMultiFileAuthState(sessionsDir);
    var { version } = await fetchLatestBaileysVersion();

    const conn = makeWASocket({
        logger: P({ level: 'silent' }),
        printQRInTerminal: false,
        browser: Browsers.macOS("Firefox"),
        syncFullHistory: true,
        auth: state,
        version
    });

    conn.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            if (lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut) {
                connectToWA();
            }
        } else if (connection === 'open') {
            console.log('🧬 Installing Plugins');
            console.log('Bot connected to whatsapp ✅');

            const pluginsPath = path.join(__dirname, '..', 'plugins');
            if (fs.existsSync(pluginsPath)) {
                fs.readdirSync(pluginsPath).forEach((plugin) => {
                    if (path.extname(plugin).toLowerCase() === ".js") {
                        try {
                            require(path.join(pluginsPath, plugin));
                        } catch (error) {
                            console.error(`Error loading plugin ${plugin}:`, error.message);
                        }
                    }
                });
            }
            console.log('Plugins installed successful ✅');

            let up = `
*╭━━━〔🍓𝗕𝗢𝗧 𝗦𝗧𝗔𝗧𝗨𝗦〕━━━✦*
*┃👻 𝐏𝐑𝐄𝐅𝐈𝐗        : ${prefix}*
*┃🔮 𝐌𝐎𝐃𝐄        : ${mode}*
 ╰━━━━━━━━━━━━━━━━━━╯
`;
        }
    });

    conn.ev.on('creds.update', saveCreds);

    conn.ev.on('messages.update', async updates => {
        for (const update of updates) {
            if (update.update.message === null) {
                console.log("Delete Detected:", JSON.stringify(update, null, 2));
                await AntiDelete(conn, updates);
            }
        }
    });

conn.ev.on('messages.upsert', async (mek) => {
    mek = mek.messages[0];
    if (!mek.message) return;

    mek.message = (getContentType(mek.message) === 'ephemeralMessage')
        ? mek.message.ephemeralMessage.message
        : mek.message;

    if (config.READ_MESSAGE === 'true') {
        await conn.readMessages([mek.key]);
        console.log(`✅ Marked message from ${mek.key.remoteJid} as read.`);
    }

    if (mek.message.viewOnceMessageV2) {
        mek.message = (getContentType(mek.message) === 'ephemeralMessage')
            ? mek.message.ephemeralMessage.message
            : mek.message;
    }

    if (mek.key?.remoteJid === 'status@broadcast' && config.AUTO_STATUS_SEEN === "true") {
        await conn.readMessages([mek.key]);
    }

    if (mek.key?.remoteJid === 'status@broadcast' && config.AUTO_STATUS_REACT === "true") {
        if (config.AUTO_STATUS_REPLY === "true") {
            const user = mek.key.participant;
            const text = config.AUTO_STATUS_MSG || '💜';
            await conn.sendMessage(user, {
                text,
                react: { text: '💜', key: mek.key }
            }, { quoted: mek });
        }
    }

    await saveMessage(mek);

    const type = getContentType(mek.message);
    const from = mek.key.remoteJid;
    const content = JSON.stringify(mek.message);
    const quoted = type === 'extendedTextMessage' && mek.message.extendedTextMessage.contextInfo
        ? mek.message.extendedTextMessage.contextInfo.quotedMessage || []
        : [];

    const body = (type === 'conversation')
        ? mek.message.conversation
        : (type === 'extendedTextMessage')
            ? mek.message.extendedTextMessage.text
            : (type === 'imageMessage' && mek.message.imageMessage.caption)
                ? mek.message.imageMessage.caption
                : (type === 'videoMessage' && mek.message.videoMessage.caption)
                    ? mek.message.videoMessage.caption
                    : '';

    const prefix = '.'; // ✅ Customize this if needed
    const isCmd = body.startsWith(prefix);
    const command = isCmd ? body.slice(prefix.length).trim().split(' ')[0].toLowerCase() : '';
    const args = body.trim().split(/ +/).slice(1);
    const q = args.join(' ');
    const text = q;

    const isGroup = from.endsWith('@g.us');
    const sender = mek.key.fromMe
        ? (conn.user.id.split(':')[0] + '@s.whatsapp.net')
        : (mek.key.participant || mek.key.remoteJid);
    const senderNumber = sender.split('@')[0];
    const botNumber = conn.user.id.split(':')[0];
    const pushname = mek.pushName || 'No Name';
    const isMe = botNumber.includes(senderNumber);
    const isOwner = config.ownerNumber.includes(senderNumber) || isMe;
    const botNumber2 = await jidNormalizedUser(conn.user.id);
    const groupMetadata = isGroup ? await conn.groupMetadata(from).catch(() => {}) : '';
    const groupName = isGroup ? groupMetadata?.subject : '';
    const participants = isGroup ? groupMetadata?.participants : [];
    const groupAdmins = isGroup ? getGroupAdmins(participants) : [];
    const isBotAdmins = isGroup ? groupAdmins.includes(botNumber2) : false;
    const isAdmins = isGroup ? groupAdmins.includes(sender) : false;

    const reply = (teks) => conn.sendMessage(from, { text: teks }, { quoted: mek });

    // ✅ ✅ ✅ COMMAND EXECUTION LOGIC
 if (isCmd) {
    for (let cmd of commands) {
        if (cmd.pattern === command || (cmd.alias && cmd.alias.includes(command))) {
            try {
                // Create `msg` object (optional if needed)
                const msg = {
                    body,
                    sender,
                    from,
                    pushname,
                    groupName,
                    participants,
                    groupAdmins,
                    isGroup,
                    isAdmins,
                    isBotAdmins,
                    isOwner,
                    isMe,
                    type,
                    content,
                    quoted,
                    args,
                    q,
                    text,
                    command,
                    reply
                };

                // Check how many arguments the command function expects
                const argLength = cmd.function.length;

                if (argLength === 3) {
                    // Command defined as: async (conn, mek, context)
                    await cmd.function(conn, mek, msg);
                } else if (argLength === 4) {
                    // Command defined as: async (conn, mek, msg, context)
                    await cmd.function(conn, mek, msg, msg); // msg is passed as both
                } else {
                    // Default/fallback
                    await cmd.function(conn, mek, msg);
                }

            } catch (e) {
                console.error(`❌ Error running command '${command}':`, e);
                reply("⚠️ Command error.\n\n" + e.message);
            }
            break; // matched and executed
        }
    }
 }
        /*if (!isReact && config.AUTO_REACT === 'true') {
            const reactions = [
                '🌼', '❤️', '💐', '🔥', '🏵️', '❄️', '🧊', '🐳', '💥', '🥀', '❤‍🔥', '🥹', '😩', '🫣', 
                '🤭', '👻', '👾', '🫶', '😻', '🙌', '🫂', '🫀', '👩‍🦰', '🧑‍🦰', '👩‍⚕️', '🧑‍⚕️', '🧕', 
                '👩‍🏫', '👨‍💻', '👰‍♀', '🦹🏻‍♀️', '🧟‍♀️', '🧟', '🧞‍♀️', '🧞', '🙅‍♀️', '💁‍♂️', '💁‍♀️', '🙆‍♀️'
            ];
            const randomReaction = reactions[Math.floor(Math.random() * reactions.length)];
            m.react(randomReaction);
        }*/

    /*    if (!isReact && config.CUSTOM_REACT === 'true') {
            const reactions = (config.CUSTOM_REACT_EMOJIS || '🥲,😂,👍🏻,🙂,😔').split(',');
            const randomReaction = reactions[Math.floor(Math.random() * reactions.length)];
            m.react(randomReaction);
        }*/

        if (!isOwner && config.MODE === "private") return;
        if (!isOwner && isGroup && config.MODE === "inbox") return;
        if (!isOwner && !isGroup && config.MODE === "groups") return;

        const events = require('./command');
        const cmdName = isCmd ? body.slice(1).trim().split(" ")[0].toLowerCase() : false;

        if (isCmd) {
            const cmd = events.commands.find((cmd) => cmd.pattern === (cmdName)) || 
                      events.commands.find((cmd) => cmd.alias && cmd.alias.includes(cmdName));

            if (cmd) {
                if (cmd.react) conn.sendMessage(from, { react: { text: cmd.react, key: mek.key } });

                try {
                    cmd.function(conn, mek, m, {
                        from, quoted, body, isCmd, command, args, q, text, isGroup, sender, 
                        senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, 
                        groupMetadata, groupName, participants, groupAdmins, isBotAdmins, 
                        isAdmins, reply
                    });
                } catch (e) {
                    console.error("[PLUGIN ERROR] " + e);
                }
            }
        }

        events.commands.map(async (command) => {
            if (body && command.on === "body") {
                command.function(conn, mek, m, {
                    from, quoted, body, isCmd, command, args, q, text, isGroup, sender, 
                    senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, 
                    groupMetadata, groupName, participants, groupAdmins, isBotAdmins, 
                    isAdmins, reply
                });
            } else if (mek.q && command.on === "text") {
                command.function(conn, mek, m, {
                    from, quoted, body, isCmd, command, args, q, text, isGroup, sender, 
                    senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, 
                    groupMetadata, groupName, participants, groupAdmins, isBotAdmins, 
                    isAdmins, reply
                });
            } else if ((command.on === "image" || command.on === "photo") && mek.type === "imageMessage") {
                command.function(conn, mek, m, {
                    from, quoted, body, isCmd, command, args, q, text, isGroup, sender, 
                    senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, 
                    groupMetadata, groupName, participants, groupAdmins, isBotAdmins, 
                    isAdmins, reply
                });
            } else if (command.on === "sticker" && mek.type === "stickerMessage") {
                command.function(conn, mek, m, {
                    from, quoted, body, isCmd, command, args, q, text, isGroup, sender, 
                    senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, 
                    groupMetadata, groupName, participants, groupAdmins, isBotAdmins, 
                    isAdmins, reply
                });
            }
        });
});

    conn.decodeJid = jid => {
        if (!jid) return jid;
        if (/:\d+@/gi.test(jid)) {
            let decode = jidDecode(jid) || {};
            return (
                (decode.user &&
                    decode.server &&
                    decode.user + '@' + decode.server) ||
                jid
            );
        } else return jid;
    };

    conn.copyNForward = async(jid, message, forceForward = false, options = {}) => {
        let vtype
        if (options.readViewOnce) {
            message.message = message.message && message.message.ephemeralMessage && message.message.ephemeralMessage.message ? message.message.ephemeralMessage.message : (message.message || undefined)
            vtype = Object.keys(message.message.viewOnceMessage.message)[0]
            delete(message.message && message.message.ignore ? message.message.ignore : (message.message || undefined))
            delete message.message.viewOnceMessage.message[vtype].viewOnce
            message.message = {
                ...message.message.viewOnceMessage.message
            }
        }
        let mtype = Object.keys(message.message)[0]
        let content = await generateForwardMessageContent(message, forceForward)
        let ctype = Object.keys(content)[0]
        let context = {}
        if (mtype != "conversation") context = message.message[mtype].contextInfo
        content[ctype].contextInfo = {
            ...context,
            ...content[ctype].contextInfo
        }
        const waMessage = await generateWAMessageFromContent(jid, content, options ? {
            ...content[ctype],
            ...options,
            ...(options.contextInfo ? {
                contextInfo: {
                    ...content[ctype].contextInfo,
                    ...options.contextInfo
                }
            } : {})
        } : {})
        await conn.relayMessage(jid, waMessage.message, { messageId: waMessage.key.id })
        return waMessage
    }

    conn.downloadAndSaveMediaMessage = async(message, filename, attachExtension = true) => {
        let quoted = message.msg ? message.msg : message
        let mime = (message.msg || message).mimetype || ''
        let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0]
        const stream = await downloadContentFromMessage(quoted, messageType)
        let buffer = Buffer.from([])
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk])
        }
        let type = await FileType.fromBuffer(buffer)
        let trueFileName = attachExtension ? (filename + '.' + type.ext) : filename
        await fs.writeFileSync(trueFileName, buffer)
        return trueFileName
    }

    conn.downloadMediaMessage = async(message) => {
        let mime = (message.msg || message).mimetype || ''
        let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0]
        const stream = await downloadContentFromMessage(message, messageType)
        let buffer = Buffer.from([])
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk])
        }
        return buffer
    }

    conn.sendFileUrl = async (jid, url, caption, quoted, options = {}) => {
        let mime = '';
        let res = await axios.head(url)
        mime = res.headers['content-type']
        if (mime.split("/")[1] === "gif") {
            return conn.sendMessage(jid, { video: await getBuffer(url), caption: caption, gifPlayback: true, ...options }, { quoted: quoted, ...options })
        }
        let type = mime.split("/")[0] + "Message"
        if (mime === "application/pdf") {
            return conn.sendMessage(jid, { document: await getBuffer(url), mimetype: 'application/pdf', caption: caption, ...options }, { quoted: quoted, ...options })
        }
        if (mime.split("/")[0] === "image") {
            return conn.sendMessage(jid, { image: await getBuffer(url), caption: caption, ...options }, { quoted: quoted, ...options })
        }
        if (mime.split("/")[0] === "video") {
            return conn.sendMessage(jid, { video: await getBuffer(url), caption: caption, mimetype: 'video/mp4', ...options }, { quoted: quoted, ...options })
        }
        if (mime.split("/")[0] === "audio") {
            return conn.sendMessage(jid, { audio: await getBuffer(url), caption: caption, mimetype: 'audio/mpeg', ...options }, { quoted: quoted, ...options })
        }
    }

    conn.cMod = (jid, copy, text = '', sender = conn.user.id, options = {}) => {
        let mtype = Object.keys(copy.message)[0]
        let isEphemeral = mtype === 'ephemeralMessage'
        if (isEphemeral) {
            mtype = Object.keys(copy.message.ephemeralMessage.message)[0]
        }
        let msg = isEphemeral ? copy.message.ephemeralMessage.message : copy.message
        let content = msg[mtype]
        if (typeof content === 'string') msg[mtype] = text || content
        else if (content.caption) content.caption = text || content.caption
        else if (content.text) content.text = text || content.text
        if (typeof content !== 'string') msg[mtype] = {
            ...content,
            ...options
        }
        if (copy.key.participant) sender = copy.key.participant = sender || copy.key.participant
        else if (copy.key.participant) sender = copy.key.participant = sender || copy.key.participant
        if (copy.key.remoteJid.includes('@s.whatsapp.net')) sender = sender || copy.key.remoteJid
        else if (copy.key.remoteJid.includes('@broadcast')) sender = sender || copy.key.remoteJid
        copy.key.remoteJid = jid
        copy.key.fromMe = sender === conn.user.id

        return proto.WebMessageInfo.fromObject(copy)
    }

    conn.getFile = async(PATH, save) => {
        let res
        let data = Buffer.isBuffer(PATH) ? PATH : /^data:.*?\/.*?;base64,/i.test(PATH) ? Buffer.from(PATH.split `,` [1], 'base64') : /^https?:\/\//.test(PATH) ? await (res = await getBuffer(PATH)) : fs.existsSync(PATH) ? (filename = PATH, fs.readFileSync(PATH)) : typeof PATH === 'string' ? PATH : Buffer.alloc(0)
        
        let type = await FileType.fromBuffer(data) || {
            mime: 'application/octet-stream',
            ext: '.bin'
        }
        let filename = path.join(__filename, __dirname + new Date * 1 + '.' + type.ext)
        if (data && save) fs.promises.writeFile(filename, data)
        return {
            res,
            filename,
            size: getSizeMedia(data),
            ...type,
            data
        }
    }

    conn.sendFile = async(jid, PATH, fileName, quoted = {}, options = {}) => {
        let types = await conn.getFile(PATH, true)
        let { filename, size, ext, mime, data } = types
        let type = '',
            mimetype = mime,
            pathFile = filename
        if (options.asDocument) type = 'document'
        if (options.asSticker || /webp/.test(mime)) {
            let { writeExif } = require('./exif.js')
            let media = { mimetype: mime, data }
            pathFile = await writeExif(media, { packname: config.packname, author: config.packname, categories: options.categories ? options.categories : [] })
            await fs.promises.unlink(filename)
            type = 'sticker'
            mimetype = 'image/webp'
        } else if (/image/.test(mime)) type = 'image'
        else if (/video/.test(mime)) type = 'video'
        else if (/audio/.test(mime)) type = 'audio'
        else type = 'document'
        await conn.sendMessage(jid, {
            [type]: { url: pathFile },
            mimetype,
            fileName,
            ...options
        }, { quoted, ...options })
        return fs.promises.unlink(pathFile)
    }

    conn.parseMention = async(text) => {
        return [...text.matchAll(/@([0-9]{5,16}|0)/g)].map(v => v[1] + '@s.whatsapp.net')
    }

    conn.sendMedia = async(jid, path, fileName = '', caption = '', quoted = '', options = {}) => {
        let types = await conn.getFile(path, true)
        let { mime, ext, res, data, filename } = types
        if (res && res.status !== 200 || data.length <= 65536) {
            try { 
                const fileData = data.toString();
                const jsonData = JSON.parse(fileData);
                throw { json: jsonData };
            } catch (e) { 
                if (e.json) throw e.json;
            }
        }
        let type = '',
            mimetype = mime,
            pathFile = filename
        if (options.asDocument) type = 'document'
        if (options.asSticker || /webp/.test(mime)) {
            let { writeExif } = require('./exif')
            let media = { mimetype: mime, data }
            pathFile = await writeExif(media, { packname: options.packname ? options.packname : config.packname, author: options.author ? options.author : config.author, categories: options.categories ? options.categories : [] })
            await fs.promises.unlink(filename)
            type = 'sticker'
            mimetype = 'image/webp'
        } else if (/image/.test(mime)) type = 'image'
        else if (/video/.test(mime)) type = 'video'
        else if (/audio/.test(mime)) type = 'audio'
        else type = 'document'
        await conn.sendMessage(jid, {
            [type]: { url: pathFile },
            caption,
            mimetype,
            fileName,
            ...options
        }, { quoted, ...options })
        return fs.promises.unlink(pathFile)
    }

    conn.sendVideoAsSticker = async (jid, buff, options = {}) => {
        let buffer;
        if (options && (options.packname || options.author)) {
            buffer = await writeExifVid(buff, options);
        } else {
            buffer = await videoToWebp(buff);
        }
        await conn.sendMessage(
            jid,
            { sticker: { url: buffer }, ...options },
            options
        );
    };

    conn.sendImageAsSticker = async (jid, buff, options = {}) => {
        let buffer;
        if (options && (options.packname || options.author)) {
            buffer = await writeExifImg(buff, options);
        } else {
            buffer = await imageToWebp(buff);
        }
        await conn.sendMessage(
            jid,
            { sticker: { url: buffer }, ...options },
            options
        );
    };

    conn.sendTextWithMentions = async(jid, text, quoted, options = {}) => conn.sendMessage(jid, { text: text, contextInfo: { mentionedJid: [...text.matchAll(/@(\d{0,16})/g)].map(v => v[1] + '@s.whatsapp.net') }, ...options }, { quoted })

    conn.sendImage = async(jid, path, caption = '', quoted = '', options) => {
        let buffer = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split `,` [1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0)
        return await conn.sendMessage(jid, { image: buffer, caption: caption, ...options }, { quoted })
    }

    conn.sendText = (jid, text, quoted = '', options) => conn.sendMessage(jid, { text: text, ...options }, { quoted })

    conn.sendButtonText = (jid, buttons = [], text, footer, quoted = '', options = {}) => {
        let buttonMessage = {
            text,
            footer,
            buttons,
            headerType: 2,
            ...options
        }
        conn.sendMessage(jid, buttonMessage, { quoted, ...options })
    }

    conn.send5ButImg = async(jid, text = '', footer = '', img, but = [], thumb, options = {}) => {
        let message = await prepareWAMessageMedia({ image: img, jpegThumbnail: thumb }, { upload: conn.waUploadToServer })
        var template = generateWAMessageFromContent(jid, proto.Message.fromObject({
            templateMessage: {
                hydratedTemplate: {
                    imageMessage: message.imageMessage,
                    "hydratedContentText": text,
                    "hydratedFooterText": footer,
                    "hydratedButtons": but
                }
            }
        }), options)
        conn.relayMessage(jid, template.message, { messageId: template.key.id })
    }

    conn.getName = (jid, withoutContact = false) => {
        id = conn.decodeJid(jid);
        withoutContact = conn.withoutContact || withoutContact;
        let v;

        if (id.endsWith('@g.us'))
            return new Promise(async resolve => {
                v = store.contacts[id] || {};
                if (!(v.name.notify || v.subject))
                    v = conn.groupMetadata(id) || {};
                resolve(
                    v.name ||
                        v.subject ||
                        PhoneNumber(
                            '+' + id.replace('@s.whatsapp.net', ''),
                        ).getNumber('international'),
                );
            });
        else
            v =
                id === '0@s.whatsapp.net'
                    ? {
                            id,
                            name: 'WhatsApp',
                      }
                    : id === conn.decodeJid(conn.user.id)
                    ? conn.user
                    : store.contacts[id] || {};

        return (
            (withoutContact ? '' : v.name) ||
            v.subject ||
            v.verifiedName ||
            PhoneNumber(
                '+' + jid.replace('@s.whatsapp.net', ''),
            ).getNumber('international')
        );
    };

    conn.sendContact = async (jid, kon, quoted = '', opts = {}) => {
        let list = [];
        for (let i of kon) {
            list.push({
                displayName: await conn.getName(i + '@s.whatsapp.net'),
                vcard: `BEGIN:VCARD\nVERSION:3.0\nN:${await conn.getName(
                    i + '@s.whatsapp.net',
                )}\nFN:${
                    global.OwnerName
                }\nitem1.TEL;waid=${i}:${i}\nitem1.X-ABLabel:Click here to chat\nitem2.EMAIL;type=INTERNET:${
                    global.email
                }\nitem2.X-ABLabel:GitHub\nitem3.URL:https://github.com/${
                    global.github
                }/khan-xmd\nitem3.X-ABLabel:GitHub\nitem4.ADR:;;${
                    global.location
                };;;;\nitem4.X-ABLabel:Region\nEND:VCARD`,
            });
        }
        conn.sendMessage(
            jid,
            {
                contacts: {
                    displayName: `${list.length} Contact`,
                    contacts: list,
                },
                ...opts,
            },
            { quoted },
        );
    };

    conn.setStatus = status => {
        conn.query({
            tag: 'iq',
            attrs: {
                to: '@s.whatsapp.net',
                type: 'set',
                xmlns: 'status',
            },
            content: [
                {
                    tag: 'status',
                    attrs: {},
                    content: Buffer.from(status, 'utf-8'),
                },
            ],
        });
        return status;
    };

    conn.serializeM = mek => sms(conn, mek, store);
}   

module.exports = {
    connectToWA
};
