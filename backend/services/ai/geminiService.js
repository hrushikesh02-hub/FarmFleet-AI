const { GoogleGenAI } = require("@google/genai");

// ======================================================
// Validate API Key
// ======================================================

if (!process.env.GEMINI_API_KEY) {
  console.warn("⚠️  GEMINI_API_KEY is missing in .env — AI endpoints will be unavailable.");
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
// Timeout Helper
// ======================================================

const AI_TIMEOUT_MS = 8000;

function withTimeout(promise, ms = AI_TIMEOUT_MS) {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      const err = new Error(`AI generation timed out after ${ms / 1000} seconds`);
      err.code = "AI_FAILOVER_TRIGGER";
      reject(err);
    }, ms);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timeoutId);
  });
}

// ======================================================
// Generate AI Content
// ======================================================

async function generateContent(prompt, timeoutMs = AI_TIMEOUT_MS) {
  console.log("\n========================================");
  console.log("🤖 FarmFleet AI");
  console.log("========================================");
  console.log(`Model           : ${MODEL}`);
  console.log(`Prompt Length   : ${prompt.length} characters`);
  console.log(`Timeout Limit   : ${timeoutMs / 1000} sec`);
  console.log("========================================\n");

  const startTime = Date.now();

  const apiTask = (async () => {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(
          `🚀 Sending request to Gemini (Attempt ${attempt}/${MAX_RETRIES})`
        );

        if (!process.env.GEMINI_API_KEY) {
          throw new Error("GEMINI_API_KEY is missing in environment.");
        }

        const response = await ai.models.generateContent({
          model: MODEL,
          contents: prompt,
        });

        let text = response.text || "";

        text = text
          .replace(/```json/gi, "")
          .replace(/```/g, "")
          .trim();

        return text;
      } catch (error) {
        console.error(
          `❌ Gemini Attempt ${attempt} Failed: ${error.message}`
        );

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

        throw error;
      }
    }
  })();

  try {
    const text = await withTimeout(apiTask, timeoutMs);
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log("\n========================================");
    console.log("✅ Gemini Response Received");
    console.log("========================================");
    console.log(`Response Length : ${text.length} characters`);
    console.log(`Generation Time : ${totalTime} sec`);
    console.log("========================================\n");

    return text;
  } catch (error) {
    console.error("\n========================================");
    console.error("⚠️  Gemini Service Triggered Failover Error");
    console.error(`Reason: ${error.message}`);
    console.error("========================================\n");

    const failoverError = new Error(`AI_FAILOVER_TRIGGER: ${error.message}`);
    failoverError.code = "AI_FAILOVER_TRIGGER";
    failoverError.originalError = error;
    throw failoverError;
  }
}

// ======================================================
// Export
// ======================================================

module.exports = {
  generateContent,
  AI_TIMEOUT_MS,
};