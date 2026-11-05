import express from 'express';
import { Translate } from '@google-cloud/translate/build/src/v2/index.js';

const router = express.Router();

let translate;
try {
  // Initialize with API key from environment
  translate = new Translate({ key: process.env.GOOGLE_API_KEY });
} catch (error) {
  console.error("Failed to initialize Google Translate API:", error);
}

// POST /api/translate
router.post('/', async (req, res) => {
  const { text, target } = req.body;

  if (!text || !target) {
    return res.status(400).json({ error: "Missing 'text' or 'target' in request body" });
  }

  if (!translate) {
    return res.status(500).json({ error: "Google Translate API is not configured" });
  }

  try {
    const [translation] = await translate.translate(text, target);
    res.json({ translatedText: translation });
  } catch (error) {
    console.error("Google Translate API error:", error);
    res.status(500).json({ error: "Translation failed", details: error.message });
  }
});

export default router;
