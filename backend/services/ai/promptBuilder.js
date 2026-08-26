// ======================================================
// Build Crop Itinerary Prompt
// ======================================================

function buildCropPrompt({
  crop,
  state,
  district,
  soilType,
  landArea,
  waterSource,
  budget,
  language = "en",
}) {
  const langNameMap = {
    en: "English",
    hi: "Hindi (हिन्दी)",
    mr: "Marathi (मराठी)",
    gu: "Gujarati",
    ta: "Tamil (தமிழ்)",
    te: "Telugu (తెలుగు)",
    kn: "Kannada (ಕನ್ನಡ)",
    pa: "Punjabi (ਪੰਜਾਬੀ)",
  };
  const targetLanguage = langNameMap[language] || "English";

  const budgetConstraint = budget && parseFloat(budget) > 0
    ? `Budget Constraint: ₹${budget}`
    : `Budget Constraint: Auto-calculate realistic minimum required budget, estimated total cost, expected gross income, and net profit per acre for ${crop} in ${district}, ${state} based on Indian market rates.`;

  return `
You are FarmFleet AI, an expert agricultural consultant for Indian farming.

Generate a complete, practical, and realistic crop cultivation itinerary based on the following farm details.

==================================================
FARM DETAILS
==================================================

Crop: ${crop}
State: ${state}
District: ${district}
Soil Type: ${soilType}
Land Area: ${landArea} Acres
Water Source: ${waterSource}
${budgetConstraint}
Preferred Output Language: ${targetLanguage}

==================================================
INSTRUCTIONS
==================================================

Generate recommendations suitable for:

• Indian agricultural practices
• Local climate
• Soil type
• Available water source
• Realistic per-acre budget and financial projections
• Sustainable farming

CRITICAL LANGUAGE INSTRUCTION:
Generate ALL text, values, titles, descriptions, recommendations, precautions, and tips in ${targetLanguage}.
However, you MUST keep ALL JSON keys EXACTLY in English as specified below (do NOT translate JSON key names).

Return ONLY valid JSON.

Do NOT return Markdown, explanations, notes, comments, or extra text.

Do NOT rename, remove, or add any JSON keys.

Every field must contain meaningful values in ${targetLanguage}.

Timeline objects must contain ONLY:

{
  "week":"",
  "title":"",
  "description":""
}

Pest & Disease objects:

{
  "problem":"",
  "solution":""
}

Equipment objects:

{
  "name":"",
  "purpose":"",
  "estimatedRent":""
}

Labour objects:

{
  "activity":"",
  "workers":"",
  "days":""
}

Fertilizer objects:

{
  "stage":"",
  "fertilizer":"",
  "quantity":"",
  "time":""
}

Irrigation objects:

{
  "stage":"",
  "frequency":"",
  "waterRequirement":""
}

Seed Recommendation:

{
  "variety":"",
  "seedQuantity":"",
  "estimatedCost":""
}

==================================================
RETURN JSON (Example structure with field types)
==================================================

{
  "crop": "${crop}",
  "location": {
    "state": "${state}",
    "district": "${district}"
  },
  "soilType": "${soilType}",
  "landArea": "${landArea}",
  "waterSource": "${waterSource}",
  "budget": "₹${budget || '45,000'}",
  "cropDuration": "4 - 5 Months",
  "bestSeason": "Kharif (June - October)",
  "expectedYield": "25 - 30 Quintals per Acre",
  "estimatedTotalCost": "₹40,000",
  "estimatedIncome": "₹95,000",
  "estimatedProfit": "₹55,000",
  "landPreparation": [
    "Plough the land twice using a tractor rotavator to achieve a fine tilth.",
    "Apply 5-8 tonnes of well-decomposed Farmyard Manure (FYM) per acre."
  ],
  "seedRecommendation": {
    "variety": "High-Yield Certified Hybrid Seed",
    "seedQuantity": "8-10 kg per Acre",
    "estimatedCost": "₹1,500 - ₹2,000 per Acre"
  },
  "timeline": [
    {
      "week": "1",
      "title": "Land Preparation & Soil Tillage",
      "description": "Deep ploughing, levelling, and mixing organic manure into the soil."
    },
    {
      "week": "2",
      "title": "Sowing & Initial Irrigation",
      "description": "Plant seeds at recommended row spacing and give light first irrigation."
    }
  ],
  "fertilizerSchedule": [
    {
      "stage": "Basal Application",
      "fertilizer": "DAP + MOP",
      "quantity": "50 kg DAP + 25 kg MOP per acre",
      "time": "At the time of sowing"
    }
  ],
  "irrigationSchedule": [
    {
      "stage": "Germination Stage",
      "frequency": "Every 5-7 days",
      "waterRequirement": "Light irrigation (2-3 inches)"
    }
  ],
  "weedManagement": [
    "Perform first manual weeding 20-25 days after sowing.",
    "Use recommended pre-emergence herbicide within 48 hours of sowing."
  ],
  "pestAndDiseaseManagement": [
    {
      "problem": "Stem Borer / Leaf Folder",
      "solution": "Spray Chlorantraniliprole 18.5% SC @ 60ml per acre in 200L water."
    }
  ],
  "equipmentRequired": [
    {
      "name": "Tractor with Rotavator",
      "purpose": "Land ploughing & soil pulverization",
      "estimatedRent": "₹1,200 / hour"
    }
  ],
  "labourRequirement": [
    {
      "activity": "Land Preparation & Manure Spreading",
      "workers": "4 workers",
      "days": "2 days"
    },
    {
      "activity": "Sowing & Seed Treatment",
      "workers": "5 workers",
      "days": "1 day"
    }
  ],
  "precautions": [
    "Avoid waterlogging during early seed germination stage.",
    "Always wear protective gloves when spraying pesticides."
  ],
  "tips": [
    "Maintain 45 cm distance between plant rows for optimal sunlight and growth.",
    "Monitor farm weekly for early signs of pest infestation."
  ]
}

Return ONLY the JSON object.
`;
}

// ======================================================
// Export
// ======================================================

module.exports = {
  buildCropPrompt,
};