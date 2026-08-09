// ======================================================
// Helper Functions
// ======================================================

const ensureArray = (value) => {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
};

const ensureString = (value) => {
  if (value === undefined || value === null) return "";
  return String(value).trim();
};

// ======================================================
// Parse Gemini JSON Response
// ======================================================

function parseGeminiResponse(response) {
  try {
    if (!response) {
      throw new Error("Gemini returned an empty response.");
    }

    // ==========================================
    // Remove Markdown
    // ==========================================

    let cleaned = response.trim();

    cleaned = cleaned.replace(/```json/gi, "");
    cleaned = cleaned.replace(/```/g, "");
    cleaned = cleaned.trim();

    // ==========================================
    // Parse JSON
    // ==========================================

    const parsed = JSON.parse(cleaned);

    // ==========================================
    // Basic Validation
    // ==========================================

    const requiredFields = [
      "crop",
      "location",
      "timeline",
      "equipmentRequired",
      "labourRequirement",
    ];

    for (const field of requiredFields) {
      if (!(field in parsed)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // ==========================================
    // Arrays
    // ==========================================

    parsed.timeline = ensureArray(parsed.timeline);
    parsed.landPreparation = ensureArray(parsed.landPreparation);
    parsed.fertilizerSchedule = ensureArray(parsed.fertilizerSchedule);
    parsed.irrigationSchedule = ensureArray(parsed.irrigationSchedule);
    parsed.weedManagement = ensureArray(parsed.weedManagement);
    parsed.pestAndDiseaseManagement = ensureArray(
      parsed.pestAndDiseaseManagement
    );
    parsed.equipmentRequired = ensureArray(parsed.equipmentRequired);
    parsed.labourRequirement = ensureArray(parsed.labourRequirement);
    parsed.precautions = ensureArray(parsed.precautions);
    parsed.tips = ensureArray(parsed.tips);

    // ==========================================
    // Timeline Normalization
    // ==========================================

    parsed.timeline = parsed.timeline.map((item) => ({
      week: ensureString(item.week),
      title: ensureString(item.title || item.activity),
      description: ensureString(item.description),
    }));

    // ==========================================
    // Equipment
    // ==========================================

    parsed.equipmentRequired = parsed.equipmentRequired.map((item) => ({
      name: ensureString(item.name || item.equipment || item.toolName) || "Tractor",
      purpose: ensureString(item.purpose || item.use || item.description) || "Field Operations",
      estimatedRent: ensureString(
        item.estimatedRent || item.estimatedRentalCost || item.rentCost || item.cost
      ) || "₹1,200 / hour",
    }));

    // ==========================================
    // Labour
    // ==========================================

    parsed.labourRequirement = parsed.labourRequirement.map((item) => ({
      activity: ensureString(item.activity || item.title || item.task) || "Field Activity",
      workers: ensureString(item.workers || item.workersRequired || item.workerCount || item.laborers) || "2 workers",
      days: ensureString(item.days || item.estimatedDays || item.durationDays || item.duration) || "2 days",
    }));

    // ==========================================
    // Pest & Disease Normalization
    // ==========================================

    parsed.pestAndDiseaseManagement =
      parsed.pestAndDiseaseManagement.map((item) => {
        // Already correct object
        if (typeof item === "object") {
          return {
            problem: ensureString(item.problem),
            solution: ensureString(item.solution),
          };
        }

        // Gemini returned string
        if (typeof item === "string") {
          const problemMatch = item.match(/Problem:(.*?);/i);
          const solutionMatch = item.match(/Solution:(.*)/i);

          return {
            problem: problemMatch
              ? problemMatch[1].trim()
              : item,
            solution: solutionMatch
              ? solutionMatch[1].trim()
              : "",
          };
        }

        return {
          problem: "",
          solution: "",
        };
      });

    // ==========================================
    // Fertilizer
    // ==========================================

    parsed.fertilizerSchedule =
      parsed.fertilizerSchedule.map((item) => ({
        stage: ensureString(item.stage),
        fertilizer: ensureString(item.fertilizer),
        quantity: ensureString(item.quantity),
        time: ensureString(item.time),
      }));

    // ==========================================
    // Irrigation
    // ==========================================

    parsed.irrigationSchedule =
      parsed.irrigationSchedule.map((item) => ({
        stage: ensureString(item.stage),
        frequency: ensureString(item.frequency),
        waterRequirement: ensureString(item.waterRequirement),
      }));

    // ==========================================
    // Seed Recommendation
    // ==========================================

    parsed.seedRecommendation = {
      variety: ensureString(parsed.seedRecommendation?.variety),
      seedQuantity: ensureString(parsed.seedRecommendation?.seedQuantity),
      estimatedCost: ensureString(parsed.seedRecommendation?.estimatedCost),
    };

    console.log("\n======================================");
    console.log("✅ Gemini JSON Parsed Successfully");
    console.log("======================================");

    return parsed;
  } catch (error) {
    console.error("\n======================================");
    console.error("❌ Response Parser Error");
    console.error("======================================");
    console.error(error);

    throw new Error("Invalid JSON received from Gemini.");
  }
}

// ======================================================
// Export
// ======================================================

module.exports = {
  parseGeminiResponse,
};