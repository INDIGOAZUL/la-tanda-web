const { Telegraf } = require('telegraf');
const express = require('express');
const axios = require('axios');

// Create Express app for webhook
const app = express();
app.use(express.json());

// Create Telegraf bot instance
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Webhook endpoint that receives from Telegram
app.post('/telegram-webhook', async (req, res) => {
  try {
    
    // Process the update through Telegraf
    await bot.handleUpdate(req.body);
    
    res.status(200).send('OK');
  } catch (error) {
    res.status(500).send('Error');
  }
});

// Telegraf middleware to enhance and forward to n8n
bot.use(async (ctx, next) => {
  try {
    // Create enhanced update with Telegraf parsing
    const enhancedUpdate = {
      // Original Telegram update
      originalUpdate: ctx.update,
      
      // Enhanced parsed data
      parsed: {
        chatId: ctx.chat?.id ? String(ctx.chat.id) : null,
        firstName: ctx.from?.first_name || 'Usuario',
        lastName: ctx.from?.last_name || '',
        username: ctx.from?.username || '',
        userId: ctx.from?.id ? String(ctx.from.id) : null,
        
        // Message data
        text: ctx.message?.text || ctx.callbackQuery?.data || '',
        command: null,
        args: [],
        
        // Message type
        isCommand: false,
        isPrivate: ctx.chat?.type === 'private',
        isGroup: ctx.chat?.type === 'group' || ctx.chat?.type === 'supergroup',
        
        // Timestamps
        timestamp: new Date().toISOString(),
        messageDate: ctx.message?.date ? new Date(ctx.message.date * 1000).toISOString() : null
      }
    };
    
    // Parse commands with Telegraf
    if (ctx.message?.text?.startsWith('/')) {
      const parts = ctx.message.text.split(' ');
      const commandPart = parts[0];
      
      // Handle @botname commands
      if (commandPart.includes('@')) {
        const [cmd, botName] = commandPart.split('@');
        if (botName === 'LaTanda_VerifyBot') {
          enhancedUpdate.parsed.command = cmd.toLowerCase();
        }
      } else {
        enhancedUpdate.parsed.command = commandPart.toLowerCase();
      }
      
      enhancedUpdate.parsed.args = parts.slice(1);
      enhancedUpdate.parsed.isCommand = true;
    }
    
    
    // Forward to n8n webhook
    await axios.post('https://n8n.latanda.online/webhook/telegram-webhook-7969251915', enhancedUpdate, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 5000
    });
    
    
  } catch (error) {
  }
  
  return next();
});

// Start Express server
const PORT = 3000;
app.listen(PORT, '127.0.0.1', () => {
});

// Handle shutdown
process.once('SIGINT', () => { try { bot.stop('SIGINT'); } catch(e) {} process.exit(0); });
process.once('SIGTERM', () => { try { bot.stop('SIGTERM'); } catch(e) {} process.exit(0); });
