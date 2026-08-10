import axios from 'axios';

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

async function sendAlert(message: string) {
  console.log(`ALERT: ${message}`);
  
  if (DISCORD_WEBHOOK_URL) {
    try {
      await axios.post(DISCORD_WEBHOOK_URL, { content: message });
    } catch (e) {
      console.error('Failed to send Discord alert', e);
    }
  }

  if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
    try {
      await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
      });
    } catch (e) {
      console.error('Failed to send Telegram alert', e);
    }
  }
}

async function monitorUptime() {
  try {
    const response = await axios.get('https://latanda.online/chain/api/cosmos/slashing/v1beta1/params');
    console.log('Chain is healthy:', response.data.params);
  } catch (error) {
    await sendAlert('CRITICAL: La Tanda Chain API is unreachable!');
  }

  try {
    const validatorsRes = await axios.get('https://latanda.online/chain/api/cosmos/staking/v1beta1/validators');
    const validators = validatorsRes.data.validators;
    
    for (const v of validators) {
      if (v.jailed) {
        await sendAlert(`WARNING: Validator ${v.description.moniker} is JAILED!`);
      }
    }
  } catch (error) {
    console.error('Failed to fetch validators', error);
  }
}

console.log('Starting La Tanda Uptime Monitor...');
setInterval(monitorUptime, CHECK_INTERVAL);
monitorUptime();
