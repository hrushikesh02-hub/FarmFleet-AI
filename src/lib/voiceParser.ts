/**
 * Agricultural Entity Extractor for FarmFleet AI Voice Assistant.
 * Parses natural farmer speech in English, Hinglish, Marathi, Hindi phonetic terms.
 */

export interface ParsedFarmerVoice {
  crop?: string;
  state?: string;
  district?: string;
  soilType?: string;
  landArea?: number;
  waterSource?: string;
  budget?: number;
  rawText: string;
  matchedEntities: { key: string; label: string; value: string }[];
}

const CROP_MAP: Record<string, string> = {
  wheat: "Wheat",
  gehu: "Wheat",
  gehun: "Wheat",
  sugarcane: "Sugarcane",
  ganna: "Sugarcane",
  cotton: "Cotton",
  kapas: "Cotton",
  rice: "Rice",
  chawal: "Rice",
  dhan: "Rice",
  maize: "Maize",
  makka: "Maize",
  soybean: "Soybean",
  soyabean: "Soybean",
  groundnut: "Groundnut",
  mungfali: "Groundnut",
  shengdana: "Groundnut",
  tomato: "Tomato",
  tamatar: "Tomato",
  onion: "Onion",
  pyaz: "Onion",
  kanda: "Onion",
  potato: "Potato",
  aloo: "Potato",
  batata: "Potato",
  banana: "Banana",
  kela: "Banana",
  mango: "Mango",
  aam: "Mango",
};

const SOIL_MAP: Record<string, string> = {
  black: "Black Soil",
  kali: "Black Soil",
  "black soil": "Black Soil",
  red: "Red Soil",
  lal: "Red Soil",
  "red soil": "Red Soil",
  alluvial: "Alluvial Soil",
  "alluvial soil": "Alluvial Soil",
  laterite: "Laterite Soil",
  "laterite soil": "Laterite Soil",
  clay: "Clay Soil",
  chikni: "Clay Soil",
  "clay soil": "Clay Soil",
  sandy: "Sandy Soil",
  retili: "Sandy Soil",
  "sandy soil": "Sandy Soil",
};

const WATER_MAP: Record<string, string> = {
  borewell: "Borewell",
  bore: "Borewell",
  tubewell: "Borewell",
  canal: "Canal",
  nehar: "Canal",
  river: "River",
  nadi: "River",
  rainfed: "Rainfed",
  baarish: "Rainfed",
  rain: "Rainfed",
  drip: "Drip Irrigation",
  "drip irrigation": "Drip Irrigation",
  sprinkler: "Sprinkler",
};

const MAHARASHTRA_DISTRICTS = [
  "Ahmednagar",
  "Pune",
  "Nashik",
  "Solapur",
  "Nagpur",
  "Satara",
  "Kolhapur",
  "Aurangabad",
  "Chhatrapati Sambhajinagar",
  "Jalgaon",
  "Amravati",
  "Nanded",
  "Sangli",
  "Latur",
  "Akola",
  "Dhule",
  "Buldhana",
  "Beed",
  "Parbhani",
  "Yavatmal",
  "Osmanabad",
  "Dharashiv",
  "Wardha",
  "Chandrapur",
  "Bhandara",
  "Gondia",
  "Gadchiroli",
  "Hingoli",
  "Washim",
  "Ratnagiri",
  "Sindhudurg",
  "Raigad",
  "Thane",
  "Palghar",
];

const OTHER_INDIAN_DISTRICTS: Record<string, string> = {
  ludhiana: "Punjab",
  amritsar: "Punjab",
  patiala: "Punjab",
  karnal: "Haryana",
  hisar: "Haryana",
  rohtak: "Haryana",
  jaipur: "Rajasthan",
  jodhpur: "Rajasthan",
  udaipur: "Rajasthan",
  indore: "Madhya Pradesh",
  bhopal: "Madhya Pradesh",
  ujjain: "Madhya Pradesh",
  surat: "Gujarat",
  rajkot: "Gujarat",
  ahmedabad: "Gujarat",
  lucknow: "Uttar Pradesh",
  kanpur: "Uttar Pradesh",
  varanasi: "Uttar Pradesh",
  patna: "Bihar",
  coimbatore: "Tamil Nadu",
  madurai: "Tamil Nadu",
  mysore: "Karnataka",
  belagavi: "Karnataka",
};

export function parseFarmerVoice(text: string): ParsedFarmerVoice {
  const lower = text.toLowerCase();
  const matchedEntities: { key: string; label: string; value: string }[] = [];

  let crop: string | undefined;
  let state: string | undefined = "Maharashtra"; // sensible default for western India agricultural hub
  let district: string | undefined;
  let soilType: string | undefined;
  let landArea: number | undefined;
  let waterSource: string | undefined;
  let budget: number | undefined;

  // 1. Crop Match
  for (const [key, val] of Object.entries(CROP_MAP)) {
    const regex = new RegExp(`\b${key}\b`, "i");
    if (regex.test(lower)) {
      crop = val;
      matchedEntities.push({ key: "crop", label: "Crop", value: val });
      break;
    }
  }

  // 2. District Match
  for (const d of MAHARASHTRA_DISTRICTS) {
    if (lower.includes(d.toLowerCase())) {
      district = d;
      state = "Maharashtra";
      matchedEntities.push({ key: "district", label: "District", value: d });
      matchedEntities.push({ key: "state", label: "State", value: "Maharashtra" });
      break;
    }
  }

  if (!district) {
    for (const [dName, dState] of Object.entries(OTHER_INDIAN_DISTRICTS)) {
      if (lower.includes(dName)) {
        district = dName.charAt(0).toUpperCase() + dName.slice(1);
        state = dState;
        matchedEntities.push({ key: "district", label: "District", value: district });
        matchedEntities.push({ key: "state", label: "State", value: state });
        break;
      }
    }
  }

  // 3. Soil Type Match
  for (const [key, val] of Object.entries(SOIL_MAP)) {
    if (lower.includes(key)) {
      soilType = val;
      matchedEntities.push({ key: "soilType", label: "Soil Type", value: val });
      break;
    }
  }

  // 4. Water Source Match
  for (const [key, val] of Object.entries(WATER_MAP)) {
    if (lower.includes(key)) {
      waterSource = val;
      matchedEntities.push({ key: "waterSource", label: "Water Source", value: val });
      break;
    }
  }

  // 5. Land Area Match (e.g., "3 acres", "4.5 acre", "2 hec", "5 bigha", "10 ekad")
  const areaMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:acre|acres|ekad|ekar|hec|hectare|bigha|guntha)/i) ||
    lower.match(/land\s*(?:of|is)?\s*(\d+(?:\.\d+)?)/i) ||
    lower.match(/(\d+(?:\.\d+)?)\s*(?:ekad|acres)/i);

  if (areaMatch) {
    const val = parseFloat(areaMatch[1]);
    if (!isNaN(val) && val > 0 && val <= 1000) {
      landArea = val;
      matchedEntities.push({ key: "landArea", label: "Land Area", value: `${val} Acres` });
    }
  } else {
    // Check for standalone numbers before acre keywords
    const standaloneNum = lower.match(/\b([1-9]|1[0-9]|20)\b\s*(?:acre|acres|land)/i);
    if (standaloneNum) {
      const val = parseFloat(standaloneNum[1]);
      landArea = val;
      matchedEntities.push({ key: "landArea", label: "Land Area", value: `${val} Acres` });
    }
  }

  // 6. Budget Match (e.g. "50000", "50 thousand", "1.5 lakh", "1 lakh", "60k", "budget 80000")
  if (lower.includes("lakh") || lower.includes("lac")) {
    const lakhMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:lakh|lac|lakhs)/i);
    if (lakhMatch) {
      budget = Math.round(parseFloat(lakhMatch[1]) * 100000);
      matchedEntities.push({ key: "budget", label: "Budget", value: `₹${budget.toLocaleString("en-IN")}` });
    }
  } else if (lower.includes("thousand") || lower.includes("hazar") || lower.includes("k")) {
    const thousandMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:thousand|hazar|k)/i);
    if (thousandMatch) {
      budget = Math.round(parseFloat(thousandMatch[1]) * 1000);
      matchedEntities.push({ key: "budget", label: "Budget", value: `₹${budget.toLocaleString("en-IN")}` });
    }
  } else {
    const directBudget = lower.match(/(?:budget|rs|rupees|inr|cost)?\s*(\d{5,7})\b/i);
    if (directBudget) {
      budget = parseInt(directBudget[1], 10);
      matchedEntities.push({ key: "budget", label: "Budget", value: `₹${budget.toLocaleString("en-IN")}` });
    }
  }

  return {
    crop,
    state,
    district,
    soilType,
    landArea,
    waterSource,
    budget,
    rawText: text,
    matchedEntities,
  };
}
