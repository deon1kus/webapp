const crypto = require('crypto');

// Validate Telegram Web App data
async function validateTelegramData(event) {
  try {
    const authData = event.headers['x-telegram-auth'];
    if (!authData) {
      return { valid: false, error: 'No auth data' };
    }

    const data = new URLSearchParams(authData);
    const hash = data.get('hash');
    data.delete('hash');

    // Sort parameters alphabetically
    const sortedData = Array.from(data.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    // Create secret key
    const secretKey = crypto.createHmac('sha256', 'WebAppData')
      .update(process.env.TELEGRAM_BOT_TOKEN)
      .digest();

    // Calculate hash
    const calculatedHash = crypto.createHmac('sha256', secretKey)
      .update(sortedData)
      .digest('hex');

    return { valid: calculatedHash === hash };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

module.exports = { validateTelegramData };
