const { GoogleGenAI } = require("@google/genai");

// ======================================================
// Validate API Key
// ======================================================

if (!process.env.GEMINI_API_KEY) {
  throw new Error("❌ GEMINI_API_KEY is missing in .env file");
}

// ======================================================
// Gemini Configuration
// ======================================================

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const MODEL = "gemini-flash-latest";

const MAX_RETRIES = 3;

const RETRY_DELAY = 2500;

// ======================================================
// Delay Helper
// ======================================================

const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// ======================================================
// Generate AI Content
// ======================================================

async function generateContent(prompt) {
  console.log("\n========================================");
  console.log("🤖 FarmFleet AI");
  console.log("========================================");
  console.log(`Model           : ${MODEL}`);
  console.log(`Prompt Length   : ${prompt.length} characters`);
  console.log("========================================\n");

  const startTime = Date.now();

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(
        `🚀 Sending request to Gemini (Attempt ${attempt}/${MAX_RETRIES})`
      );

      const response = await ai.models.generateContent({
        model: MODEL,
        contents: prompt,
      });

      let text = response.text || "";

      text = text
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();

      const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);

      console.log("\n========================================");
      console.log("✅ Gemini Response Received");
      console.log("========================================");
      console.log(`Response Length : ${text.length} characters`);
      console.log(`Generation Time : ${totalTime} sec`);
      console.log("========================================\n");

      return text;
    } catch (error) {
      console.error(
        `❌ Gemini Attempt ${attempt} Failed`
      );

      console.error(error.message);

      // Retry for transient failures
      if (
        attempt < MAX_RETRIES &&
        (
          error.message.includes("fetch failed") ||
          error.message.includes("timeout") ||
          error.message.includes("503") ||
          error.message.includes("429")
        )
      ) {
        console.log(
          `⏳ Retrying in ${RETRY_DELAY / 1000} seconds...\n`
        );

        await sleep(RETRY_DELAY);

        continue;
      }

      console.error("\n========================================");
      console.error("❌ Gemini Service Error");
      console.error("========================================");

      throw new Error(
        "FarmFleet AI could not generate the crop itinerary. Please try again."
      );
    }
  }
}

// ======================================================
// Export
// ======================================================

module.exports = {
  generateContent,
};