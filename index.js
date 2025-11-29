const express = require('express');
const twilio = require('twilio');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

const leadStore = [];

const sendSMS = async (to, body) => await twilioClient.messages.create({ from: process.env.TWILIO_PHONE, to, body });

const getAIResponse = async (history) => {
  // Mock AI response for MVP - replace with actual OpenAI call when key is valid
  return "Thanks for reaching out! What's your address so we can check roof options?";
};

const bookCalendar = async (date) => {
  // Placeholder: Google Calendar integration skipped for now
  return `Appointment booked for ${new Date(date).toLocaleDateString()} at 10:00 AM (placeholder)`;
};

app.post('/lead', async (req, res) => {
  const { phone, name, message } = req.body;
  const lead = { phone, name, history: [{ role: 'user', content: message }], needsHuman: false };
  leadStore.push(lead);
  const aiMsg = await getAIResponse(lead.history);
  lead.history.push({ role: 'assistant', content: aiMsg });
  if (aiMsg.includes('ESCALATE')) lead.needsHuman = true;
  await sendSMS(phone, aiMsg.replace('ESCALATE', 'Let me connect you with our team.'));
  res.json({ status: 'ok', leadId: leadStore.length - 1 });
});

app.post('/sms', async (req, res) => {
  const { From, Body } = req.body;
  const lead = leadStore.find(l => l.phone === From);
  if (!lead) return res.send('<Response></Response>');
  lead.history.push({ role: 'user', content: Body });
  const aiMsg = await getAIResponse(lead.history);
  lead.history.push({ role: 'assistant', content: aiMsg });
  if (aiMsg.includes('ESCALATE')) { lead.needsHuman = true; await sendSMS(From, 'Let me connect you with our team.'); }
  else if (aiMsg.startsWith('BOOK|')) {
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    const slot = await bookCalendar(tomorrow);
    const msg = `✅ ${slot}!`;
    await sendSMS(From, msg);
    await sendSMS(process.env.OWNER_PHONE, `New booking: ${lead.name} at ${slot}`);
  } else await sendSMS(From, aiMsg);
  res.send('<Response></Response>');
});

app.listen(process.env.PORT || 3000, () => console.log('🚀 PrimusInsights running'));
