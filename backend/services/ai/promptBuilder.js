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
}) {
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
Budget: ₹${budget}

==================================================
INSTRUCTIONS
==================================================

Generate recommendations suitable for:

• Indian agricultural practices
• Local climate
• Soil type
• Available water source
• Budget
• Sustainable farming

Return ONLY valid JSON.

Do NOT return Markdown, explanations, notes, comments, or extra text.

Do NOT rename, remove, or add any JSON keys.

Every field must contain meaningful values.

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
RETURN JSON
==================================================

{
  "crop": "",
  "location": {
    "state": "",
    "district": ""
  },
  "soilType": "",
  "landArea": "",
  "waterSource": "",
  "budget": "",
  "cropDuration": "",
  "bestSeason": "",
  "expectedYield": "",
  "estimatedTotalCost": "",
  "estimatedIncome": "",
  "estimatedProfit": "",
  "landPreparation": [
    ""
  ],
  "seedRecommendation": {
    "variety": "",
    "seedQuantity": "",
    "estimatedCost": ""
  },
  "timeline": [
    {
      "week": "",
      "title": "",
      "description": ""
    }
  ],
  "fertilizerSchedule": [
    {
      "stage": "",
      "fertilizer": "",
      "quantity": "",
      "time": ""
    }
  ],
  "irrigationSchedule": [
    {
      "stage": "",
      "frequency": "",
      "waterRequirement": ""
    }
  ],
  "weedManagement": [
    ""
  ],
  "pestAndDiseaseManagement": [
    {
      "problem": "",
      "solution": ""
    }
  ],
  "equipmentRequired": [
    {
      "name": "",
      "purpose": "",
      "estimatedRent": ""
    }
  ],
  "labourRequirement": [
    {
      "activity": "",
      "workers": "",
      "days": ""
    }
  ],
  "precautions": [
    ""
  ],
  "tips": [
    ""
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