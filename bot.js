const { Telegraf } = require('telegraf');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const BOT_TOKEN = '7679921112:AAFC59eo9mI47vmhgqJKsrs5OnOZgQGZGCY';
const ADMIN_CHAT_ID = 619742260; // رقم حسابك في تيليجرام (بدون +)
const SPREADSHEET_ID = '18KqSk1Pu6aH3_oxM9FP385OLFOY9MUKdKOcqaoRsgtU';

// إعداد Google Sheets API
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const CREDENTIALS_PATH = path.join(__dirname, 'credentials.json');

const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));
const { client_email, private_key } = credentials;

const jwtClient = new google.auth.JWT(client_email, null, private_key, SCOPES);
const sheets = google.sheets({ version: 'v4', auth: jwtClient });

const bot = new Telegraf(BOT_TOKEN);

bot.start((ctx) => {
  ctx.reply('مرحبًا! اضغط على زر "📋 تسجيل" لتسجيل بياناتك.', {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: '📋 تسجيل',
            web_app: {
              url: 'https://cammeral.github.io/AID/' // رابط نموذج التسجيل
            }
          }
        ]
      ]
    }
  });
});

bot.on('web_app_data', async (ctx) => {
  try {
    const rawData = ctx.message.web_app_data.data;
    const lines = rawData.split('\n').filter(l => l.includes(':'));
    const row = [];
    for (const line of lines) {
      const parts = line.split(':');
      row.push(parts.slice(1).join(':').trim());
    }

    // إضافة صف في Google Sheets
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Sheet1!A:D',
      valueInputOption: 'RAW',
      resource: {
        values: [row]
      }
    });

    // إرسال رسالة خاصة للأدمن
    await bot.telegram.sendMessage(ADMIN_CHAT_ID, `📨 تم تسجيل طالب جديد:\n\n${rawData}`, { parse_mode: 'HTML' });

    // رد للطالب
    await ctx.reply('✅ تم استلام تسجيلك بنجاح، شكراً لك!');
  } catch (error) {
    console.error('Error:', error);
    await ctx.reply('❌ حدث خطأ أثناء معالجة بياناتك، حاول لاحقاً.');
  }
});

bot.launch();
console.log('Bot is running...');
