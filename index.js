import express from "express";
import twilio from "twilio";

const app = express();
app.use(express.json());

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// 🔥 SAFE MOCK AI (no external API calls)
async function getAIResponse(message) {
  return "Thanks for reaching out! What type of roofing issue are you dealing with?";
}

// In-memory leads
let leads = [];

// --- SAFE LEAD ENDPOINT (no authentication required) ---
app.post("/lead", async (req, res) => {
  try {
    const { phone, name, message } = req.body || {};

    console.log("🔥 Incoming lead:", req.body);

    if (!phone) {
      return res.status(400).json({ error: "Missing phone" });
    }

    // Mock AI response (no OpenAI used)
    const aiReply =
      `Thanks ${name || "there"}! We received your message: "${message}". ` +
      `A roofing specialist will reach out shortly.`;

    // Send SMS via Twilio
    await client.messages.create({
      body: aiReply,
      from: process.env.TWILIO_PHONE,
      to: phone,
    });

    return res.json({ status: "ok", leadId: 0 });
  } catch (err) {
    console.error("❌ Lead error:", err);
    return res.status(500).json({ error: "Server error", details: err.message });
  }
});

// Incoming SMS webhook
app.post("/sms", async (req, res) => {
  try {
    const from = req.body.From;
    const body = req.body.Body;

    const aiMessage = await getAIResponse(body);

    await client.messages.create({
      body: aiMessage,
      from: process.env.TWILIO_PHONE,
      to: from
    });

    res.send("<Response></Response>");
  } catch (err) {
    console.error("Error in /sms:", err.message);
    res.status(200).send("<Response></Response>");
  }
});

app.listen(process.env.PORT || 10000, () => {
  console.log("🚀 PrimusInsights running");
});
