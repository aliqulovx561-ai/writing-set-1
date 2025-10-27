// Telegram bot API handler for Vercel serverless function

export default async function handler(req, res) {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const testData = req.body;
    
    // Get Telegram bot token and chat ID from environment variables
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    
    if (!botToken || !chatId) {
      console.log('Telegram environment variables not configured');
      return res.status(200).json({ 
        success: true, 
        message: 'Test submitted successfully (Telegram not configured)' 
      });
    }

    // Format message for Telegram
    const message = formatTelegramMessage(testData);
    
    // Send message to Telegram
    const telegramResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
      })
    });

    const result = await telegramResponse.json();
    
    if (!telegramResponse.ok) {
      console.error('Telegram API error:', result);
      return res.status(200).json({ 
        success: true, 
        message: 'Test submitted (Telegram delivery failed)' 
      });
    }

    // Set CORS headers for response
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    res.status(200).json({ 
      success: true, 
      message: 'Answers sent to Telegram successfully' 
    });
    
  } catch (error) {
    console.error('Error in Telegram handler:', error);
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json({ 
      success: true, 
      message: 'Test submitted (server error)' 
    });
  }
}

function formatTelegramMessage(testData) {
  const timestamp = new Date(testData.timestamp).toLocaleString();
  
  let message = `<b>📝 IELTS WRITING TEST SUBMITTED</b>\n\n`;
  
  // Student Information
  message += `<b>👤 STUDENT INFORMATION</b>\n`;
  message += `• <b>Name:</b> ${testData.studentName}\n`;
  message += `• <b>Test:</b> ${testData.testName}\n`;
  message += `• <b>Timestamp:</b> ${timestamp}\n`;
  message += `• <b>Duration:</b> ${testData.duration}\n\n`;
  
  // Task 1 Details
  message += `<b>📋 TASK 1 - DIAGRAM DESCRIPTION</b>\n`;
  message += `<b>Question:</b>\n<i>${testData.task1.question || 'Not provided'}</i>\n\n`;
  message += `<b>📝 Student's Answer:</b>\n`;
  message += `<code>${escapeHtml(testData.task1.answer || 'No answer provided')}</code>\n\n`;
  message += `<b>📊 Task 1 Statistics:</b>\n`;
  message += `• ${testData.task1.wordCount}\n`;
  message += `• Actual Word Count: ${countWords(testData.task1.answer || '')}\n\n`;
  
  // Task 2 Details
  message += `<b>📝 TASK 2 - ESSAY WRITING</b>\n`;
  message += `<b>Question:</b>\n<i>${testData.task2.question || 'Not provided'}</i>\n\n`;
  message += `<b>📝 Student's Answer:</b>\n`;
  message += `<code>${escapeHtml(testData.task2.answer || 'No answer provided')}</code>\n\n`;
  message += `<b>📊 Task 2 Statistics:</b>\n`;
  message += `• ${testData.task2.wordCount}\n`;
  message += `• Actual Word Count: ${countWords(testData.task2.answer || '')}\n\n`;
  
  // Overall Statistics
  const task1Words = countWords(testData.task1.answer || '');
  const task2Words = countWords(testData.task2.answer || '');
  const totalWords = task1Words + task2Words;
  
  message += `<b>📈 OVERALL STATISTICS</b>\n`;
  message += `• Total Words Written: ${totalWords}\n`;
  message += `• Task 1 Words: ${task1Words} ${task1Words < 150 ? '❌' : '✅'}\n`;
  message += `• Task 2 Words: ${task2Words} ${task2Words < 250 ? '❌' : '✅'}\n\n`;
  
  message += `---\n`;
  message += `<i>✅ Test automatically submitted and recorded</i>\n`;
  message += `<i>🕒 System Time: ${new Date().toLocaleString()}</i>`;
  
  return message;
}

function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function countWords(text) {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}
