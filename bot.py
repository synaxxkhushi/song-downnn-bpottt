import logging
import os
import requests
from telegram import Update
from telegram.ext import ApplicationBuilder, CommandHandler, MessageHandler, filters, ContextTypes

BOT_TOKEN = os.getenv("BOT_TOKEN")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_song_download_link(song_name):
    api_url = f'https://songdownloaderapi.onrender.com/?query={song_name}'
    try:
        response = requests.get(api_url)
        data = response.json()
        if 'title' in data and 'download_url' in data:
            return f"🎵 *{data['title']}*\n\n🔗 [Download]({data['download_url']})"
        else:
            return "❌ Could not find the song."
    except Exception as e:
        logger.error(f"Error calling API: {e}")
        return "⚠️ Error occurred while fetching song."

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "👋 Welcome to the Song Downloader Bot!\n"
        "Send me the name of any song and I'll get you the download link 🎧"
    )

async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    song_name = update.message.text.strip()
    reply = get_song_download_link(song_name)
    await update.message.reply_markdown(reply)

async def main():
    app = ApplicationBuilder().token(BOT_TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))
    await app.run_polling()

if __name__ == '__main__':
    import asyncio
    asyncio.run(main())
