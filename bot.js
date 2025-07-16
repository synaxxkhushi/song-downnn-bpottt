const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

const token = process.env.BOT_TOKEN || 'YOUR_TELEGRAM_BOT_TOKEN';
const ADMIN_ID = 'YOUR_TELEGRAM_USER_ID'; // Replace with your Telegram numeric user ID

const bot = new TelegramBot(token, { polling: true });
const startTime = Date.now();

const userDB = new Set(); // In-memory user tracking for broadcast

// Handle commands and messages
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text?.trim();

    if (!text) return;

    userDB.add(chatId); // Track user for broadcast

    // /help command
    if (text === '/help') {
        return bot.sendMessage(chatId, `
🤖 *Song Downloader Bot Help*

Available Commands:
/search [song name] – Search for a song
/status – Check bot status
/help – Show this message

*Admin Only:*
/broadcast [message] – Send a message to all users
        `, { parse_mode: 'Markdown' });
    }

    // /status command
    if (text === '/status') {
        const uptime = Math.floor((Date.now() - startTime) / 1000);
        return bot.sendMessage(chatId, `✅ Bot is online.\nUptime: ${uptime} seconds`);
    }

    // /search [song name]
    if (text.startsWith('/search ')) {
        const songName = text.replace('/search ', '').trim();
        if (!songName) return bot.sendMessage(chatId, '❗ Please provide a song name.');

        try {
            const apiUrl = `https://songdownloaderapi.onrender.com/songname=${encodeURIComponent(songName)}`;
            const response = await axios.get(apiUrl);

            if (response.data && response.data.download_link) {
                return bot.sendMessage(chatId, `🎵 *${response.data.title || songName}*\n\n⬇️ [Download Link](${response.data.download_link})`, {
                    parse_mode: 'Markdown',
                    disable_web_page_preview: false,
                });
            } else {
                return bot.sendMessage(chatId, '❌ Song not found.');
            }
        } catch (error) {
            console.error(error);
            return bot.sendMessage(chatId, '⚠️ Error fetching song.');
        }
    }

    // /broadcast [message] — Admin only
    if (text.startsWith('/broadcast ') && String(chatId) === ADMIN_ID) {
        const message = text.replace('/broadcast ', '').trim();
        if (!message) return bot.sendMessage(chatId, '❗ Please provide a message to broadcast.');

        let count = 0;
        for (let userId of userDB) {
            try {
                await bot.sendMessage(userId, `📢 *Broadcast:*\n${message}`, { parse_mode: 'Markdown' });
                count++;
            } catch (err) {
                console.warn(`Failed to message ${userId}`);
            }
        }
        return bot.sendMessage(chatId, `✅ Broadcast sent to ${count} users.`);
    }

    // Default fallback message
    return bot.sendMessage(chatId, '❓ Unknown command. Type /help for options.');
});
