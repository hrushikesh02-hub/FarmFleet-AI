/**
 * Fallback Engine for FarmFleet AI
 * Provides instant (< 5ms latency) local generation of 100% valid, realistic, 
 * agricultural crop itineraries for Indian farming in 8 languages (en, hi, mr, gu, ta, te, kn, pa)
 * when external LLMs are offline or timing out.
 */

const { getLocale, LOCALES } = require("./locales");

// ======================================================
// Helper: Map Input String to Recognized Crop (Multilingual)
// ======================================================

function getNormalizedCropKey(rawCropStr) {
  if (!rawCropStr || typeof rawCropStr !== "string") return "wheat";
  const c = rawCropStr.toLowerCase().trim();

  // Wheat (English, Hindi, Marathi, Gujarati, Tamil, Telugu, Kannada, Punjabi)
  if (
    c.includes("wheat") || c.includes("gehu") || c.includes("gehun") || c.includes("gahu") ||
    c.includes("godhumai") || c.includes("godhumalu") || c.includes("godhi") || c.includes("kanak") ||
    c.includes("गेहूं") || c.includes("गहू") || c.includes("ઘઉં") || c.includes("கோதுமை") ||
    c.includes("గోధుమలు") || c.includes("ಗೋಧಿ") || c.includes("ਕਣਕ")
  ) return "wheat";

  // Sugarcane
  if (
    c.includes("sugarcane") || c.includes("sugar") || c.includes("ganna") || c.includes("us") ||
    c.includes("oos") || c.includes("sherdi") || c.includes("karumbu") || c.includes("cheraku") ||
    c.includes("kabbu") || c.includes("गन्ना") || c.includes("ऊस") || c.includes("શેરડી") ||
    c.includes("கரும்பு") || c.includes("చెరకు") || c.includes("ಕಬ್ಬು") || c.includes("ਗੰਨਾ")
  ) return "sugarcane";

  // Cotton
  if (
    c.includes("cotton") || c.includes("kapas") || c.includes("kapus") || c.includes("paruthi") ||
    c.includes("patti") || c.includes("hatti") || c.includes("kapah") || c.includes("narma") ||
    c.includes("कपास") || c.includes("कापूस") || c.includes("કપાસ") || c.includes("பருத்தி") ||
    c.includes("పత్తి") || c.includes("ಹತ್ತಿ") || c.includes("ਕਪਾਹ") || c.includes("ਨਰਮਾ")
  ) return "cotton";

  // Rice / Paddy
  if (
    c.includes("rice") || c.includes("paddy") || c.includes("dhan") || c.includes("chawal") ||
    c.includes("bhat") || c.includes("dangar") || c.includes("nel") || c.includes("arisi") ||
    c.includes("vari") || c.includes("bhatta") || c.includes("akki") || c.includes("jhona") ||
    c.includes("धान") || c.includes("चावल") || c.includes("भात") || c.includes("ડાંગર") ||
    c.includes("ચોખા") || c.includes("நெல்") || c.includes("அரிசி") || c.includes("వరి") ||
    c.includes("ಧాన్యం") || c.includes("ಭತ್ತ") || c.includes("ಅಕ್ಕಿ") || c.includes("ਝੋਨਾ")
  ) return "rice";

  // Maize / Corn
  if (
    c.includes("maize") || c.includes("corn") || c.includes("makka") || c.includes("maka") ||
    c.includes("makai") || c.includes("makkacholam") || c.includes("mokkajonna") ||
    c.includes("mekke") || c.includes("jola") || c.includes("makki") || c.includes("मक्का") ||
    c.includes("मका") || c.includes("મકાઈ") || c.includes("மக்காச்சோளம்") ||
    c.includes("మొక్కజొన్న") || c.includes("ಮೆಕ್ಕೆಜೋಳ") || c.includes("ਮੱਕੀ")
  ) return "maize";

  // Soybean
  if (
    c.includes("soybean") || c.includes("soyabean") || c.includes("soya") ||
    c.includes("सोयाबीन") || c.includes("સોયાબીન") || c.includes("சோயாபீன்") ||
    c.includes("సోయాబీన్") || c.includes("ಸೋಯಾಬೀನ್") || c.includes("ਸੋਇਆਬੀਨ")
  ) return "soybean";

  // Groundnut / Peanut
  if (
    c.includes("groundnut") || c.includes("peanut") || c.includes("mungfali") || c.includes("moongfali") ||
    c.includes("bhuimug") || c.includes("shengdana") || c.includes("magfali") || c.includes("nilakkadalai") ||
    c.includes("verkadalai") || c.includes("verusanaga") || c.includes("nelagadale") || c.includes("shenga") ||
    c.includes("मूंगफली") || c.includes("भुईमूग") || c.includes("મગફળી") || c.includes("நிலக்கடலை") ||
    c.includes("வேர்க்கடலை") || c.includes("వేరుశనగ") || c.includes("ನೆಲಗಡಲೆ") || c.includes("ಶೇಂಗಾ") ||
    c.includes("ਮੂੰਗਫਲੀ")
  ) return "groundnut";

  // Tomato
  if (
    c.includes("tomato") || c.includes("tamatar") || c.includes("tameta") || c.includes("thakkali") ||
    c.includes("tamota") || c.includes("tamata") || c.includes("टमाटर") || c.includes("टोमॅटो") ||
    c.includes("ટામેટા") || c.includes("தக்காளி") || c.includes("టమోటా") || c.includes("ಟೊಮೆಟೊ") ||
    c.includes("ਟਮਾਟਰ")
  ) return "tomato";

  // Onion
  if (
    c.includes("onion") || c.includes("pyaz") || c.includes("kanda") || c.includes("dungri") ||
    c.includes("dungli") || c.includes("vengayam") || c.includes("ullipaya") || c.includes("eerulli") ||
    c.includes("ganda") || c.includes("pyaaz") || c.includes("प्याज") || c.includes("कांदा") ||
    c.includes("ડુંગળી") || c.includes("வெங்காயம்") || c.includes("ఉల్లిపాయ") || c.includes("ಈರುಳ್ಳಿ") ||
    c.includes("ਪਿਆਜ਼") || c.includes("ਗੰਢਾ")
  ) return "onion";

  // Potato
  if (
    c.includes("potato") || c.includes("aloo") || c.includes("alu") || c.includes("batata") ||
    c.includes("bataka") || c.includes("urulaikilangu") || c.includes("urulai") ||
    c.includes("bangaladumpa") || c.includes("alugadde") || c.includes("aalu") || c.includes("आलू") ||
    c.includes("बटाटा") || c.includes("બટાકા") || c.includes("உருளைக்கிழங்கு") ||
    c.includes("బంగాళాదుంప") || c.includes("ಆಲೂಗಡ್ಡೆ") || c.includes("ಬಟಾಟೆ") || c.includes("ಬಟಾಟಾ") || c.includes("ਆਲੂ")
  ) return "potato";

  return "wheat"; // Default fallback crop if unmapped
}

// ======================================================
// Generate Fallback Itinerary (< 5ms latency)
// ======================================================

function generateFallbackItinerary({
  crop,
  state,
  district,
  soilType,
  landArea,
  waterSource,
  budget,
  language = "en"
}) {
  const startTime = Date.now();

  const numArea = parseFloat(landArea) > 0 ? parseFloat(landArea) : 1;
  const numBudget = parseFloat(budget) > 0 ? parseFloat(budget) : Math.max(40000, Math.round(numArea * 25000));

  const cropKey = getNormalizedCropKey(crop);

  // Retrieve the requested locale knowledge base (or default to English)
  const locale = getLocale(language);
  const template = (locale.crops && locale.crops[cropKey]) || LOCALES.en.crops[cropKey] || LOCALES.en.crops.wheat;
  const formatting = locale.formatting || LOCALES.en.formatting;

  // Economics computation ($Cost = Budget$, $Income = Budget * 2$, $Profit = Income - Cost$)
  const totalCostVal = Math.round(numBudget);
  const incomeVal = Math.round(numBudget * 2);
  const profitVal = Math.round(incomeVal - totalCostVal);

  const formattedCost = `₹${totalCostVal.toLocaleString("en-IN")}`;
  const formattedIncome = `₹${incomeVal.toLocaleString("en-IN")}`;
  const formattedProfit = `₹${profitVal.toLocaleString("en-IN")}`;

  // Scale yield based on land area
  const totalYieldMin = Math.round(template.yieldPerAcre * numArea * 0.9);
  const totalYieldMax = Math.round(template.yieldPerAcre * numArea * 1.1);
  const yieldUnit = template.yieldUnit || (cropKey === "sugarcane" ? formatting.units.tonnes : formatting.units.quintals);
  const expectedYieldStr = formatting.yieldFormat(totalYieldMin, totalYieldMax, yieldUnit, numArea);

  // Scale seed quantity & cost
  const seedQtyVal = Math.round(template.seed.baseSeedQtyKgPerAcre * numArea * 10) / 10;
  const seedCostVal = Math.round(template.seed.costPerAcre * numArea);
  const seedQtyUnit = template.seed.seedQtyUnit || formatting.units.kg;

  const seedRec = {
    variety: template.seed.variety,
    seedQuantity: `${seedQtyVal} ${seedQtyUnit}`,
    estimatedCost: `₹${seedCostVal.toLocaleString("en-IN")}`
  };

  const itineraryPayload = {
    crop: template.cropName || crop,
    location: {
      state: state || formatting.defaults.state,
      district: district || formatting.defaults.district
    },
    soilType: soilType || formatting.defaults.soilType,
    landArea: String(numArea),
    waterSource: waterSource || formatting.defaults.waterSource,
    budget: `₹${numBudget.toLocaleString("en-IN")}`,

    cropDuration: template.cropDuration,
    bestSeason: template.bestSeason,
    expectedYield: expectedYieldStr,

    estimatedTotalCost: formattedCost,
    estimatedIncome: formattedIncome,
    estimatedProfit: formattedProfit,

    landPreparation: template.landPrep,
    seedRecommendation: seedRec,
    timeline: template.timeline,
    fertilizerSchedule: template.fertilizer,
    irrigationSchedule: template.irrigation,
    weedManagement: template.weed,
    pestAndDiseaseManagement: template.pest,
    equipmentRequired: template.equipment,
    labourRequirement: template.labour,
    precautions: template.precautions,
    tips: template.tips
  };

  const latencyMs = Date.now() - startTime;
  console.log(`⚡ Instant Fallback Engine Generated Itinerary in ${latencyMs}ms for crop: "${itineraryPayload.crop}" [Lang: ${language.toUpperCase()}]`);

  return itineraryPayload;
}

// ======================================================
// Exports
// ======================================================

module.exports = {
  generateFallbackItinerary,
  getNormalizedCropKey,
  LOCALES
};
