
const axios = require('axios');
const fs = require('fs');

const getBuffer = async (url, options = {}) => {
    try {
        const response = await axios({
            method: 'get',
            url,
            responseType: 'arraybuffer',
            ...options
        });
        return Buffer.from(response.data, 'binary');
    } catch (error) {
        throw error;
    }
};

const getGroupAdmins = (participants) => {
    let admins = [];
    for (let i of participants) {
        if (i.admin === 'admin' || i.admin === 'superadmin') admins.push(i.id);
    }
    return admins;
};

const getRandom = (ext) => {
    return `${Math.floor(Math.random() * 10000)}${ext}`;
};

const h2k = (number) => {
    if (number >= 1000000) {
        return (number / 1000000).toFixed(1) + 'M';
    } else if (number >= 1000) {
        return (number / 1000).toFixed(1) + 'K';
    } else {
        return number.toString();
    }
};

const isUrl = (url) => {
    const urlRegex = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i;
    return urlRegex.test(url);
};

const Json = (string) => {
    return JSON.stringify(string, null, 2);
};

const runtime = (seconds) => {
    seconds = Number(seconds);
    var d = Math.floor(seconds / (3600 * 24));
    var h = Math.floor(seconds % (3600 * 24) / 3600);
    var m = Math.floor(seconds % 3600 / 60);
    var s = Math.floor(seconds % 60);
    var dDisplay = d > 0 ? d + (d == 1 ? " day, " : " days, ") : "";
    var hDisplay = h > 0 ? h + (h == 1 ? " hour, " : " hours, ") : "";
    var mDisplay = m > 0 ? m + (m == 1 ? " minute, " : " minutes, ") : "";
    var sDisplay = s > 0 ? s + (s == 1 ? " second" : " seconds") : "";
    return dDisplay + hDisplay + mDisplay + sDisplay;
};

const sleep = async (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

const fetchJson = async (url, options = {}) => {
    try {
        const response = await axios.get(url, options);
        return response.data;
    } catch (error) {
        throw error;
    }
};

module.exports = {
    getBuffer,
    getGroupAdmins,
    getRandom,
    h2k,
    isUrl,
    Json,
    runtime,
    sleep,
    fetchJson
};
