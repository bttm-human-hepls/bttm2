const axios = require('axios');

// Environment Variables (Vercel Dashboard এ সেট করুন)
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID;

module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    // Validation
    const { transactionData, txId, userEmail } = req.body || {};
    if (!transactionData || !txId) {
        return res.status(400).json({ success: false, error: 'Missing transactionData or txId' });
    }
    
    // Amount & charge calculation (safe)
    const amount = typeof transactionData.amount === 'number' ? transactionData.amount : Number(transactionData.amount) || 0;
    let charge = 0;
    if (amount >= 50) {
        charge = Math.max(5, Math.floor(amount / 1000) * 5);
    }
    const date = new Date().toLocaleString('bn-BD', { timeZone: 'Asia/Dhaka' });
    
    const message = `╔══════════════════════════════════╗
║     ⚡ B.T.T.M NEW TRANSACTION ⚡     ║
╚══════════════════════════════════════╝

🆔 ID: ${txId}
📅 Date: ${date}
👤 Sender: ${transactionData.fullName || 'N/A'}
📱 Sender No: ${transactionData.senderNumber || 'N/A'}
💰 Amount: ৳${amount.toFixed(2)}
${charge > 0 ? `💸 Service Charge: ৳${charge.toFixed(2)}\n📊 Net Amount: ৳${(amount - charge).toFixed(2)}` : ''}
📱 Receiver: ${transactionData.receiverNumber || 'N/A'}
🔖 TrxID: ${transactionData.trxId || 'N/A'}
📧 User: ${userEmail || 'N/A'}
📊 Status: ⏳ PENDING

────────────────────────────────────
✅ Approve | ❌ Reject | 📋 Details
────────────────────────────────────`;
    
    try {
        if (!BOT_TOKEN || !ADMIN_CHAT_ID) {
            throw new Error('Missing TELEGRAM_BOT_TOKEN or TELEGRAM_ADMIN_CHAT_ID');
        }
        
        await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            chat_id: ADMIN_CHAT_ID,
            text: message,
            parse_mode: 'HTML'
        });
        
        return res.status(200).json({ success: true, message: 'Notification sent' });
    } catch (error) {
        console.error('Telegram error:', error.response?.data || error.message);
        return res.status(500).json({ 
            success: false, 
            error: error.response?.data?.description || error.message 
        });
    }
};