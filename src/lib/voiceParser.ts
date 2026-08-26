/**
 * Agricultural Entity Extractor for FarmFleet AI Voice Assistant.
 * Parses natural farmer speech in English, Hinglish, Marathi, Hindi phonetic terms.
 *
 * FIXES:
 * - RegExp `\b` word boundary now uses correct double-escape `\\b`
 * - Massively expanded CROP_MAP with common speech variants, typos, phonetic spellings
 * - Crops sorted by keyword length (longest first) to prevent partial matches
 * - All maps use word-boundary regex for precision
 * - Added "grow X", "plant X", "X crop", "X farming", "X ki kheti" intent patterns
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

// ─── CROP MAP ─────────────────────────────────────────────────────────────────
// Key = any spoken word/phrase (lowercase), Value = canonical crop name
// NOTE: Entries are sorted longest-first inside matchCrop() to avoid partial hits

const CROP_MAP: Record<string, string> = {
  // Wheat
  wheat: "Wheat",
  gehu: "Wheat",
  gehun: "Wheat",
  gahu: "Wheat",           // Marathi
  "gehun ki": "Wheat",
  "wheat crop": "Wheat",
  "wheat farming": "Wheat",

  // Sugarcane
  sugarcane: "Sugarcane",
  "sugar cane": "Sugarcane",
  ganna: "Sugarcane",
  ganne: "Sugarcane",
  ub: "Sugarcane",         // short Marathi "ubs"
  ubs: "Sugarcane",
  "us ki": "Sugarcane",
  oos: "Sugarcane",        // Marathi phonetic

  // Cotton
  cotton: "Cotton",
  kapas: "Cotton",
  kapaas: "Cotton",
  karpas: "Cotton",
  "bt cotton": "Cotton",

  // Rice / Paddy
  rice: "Rice",
  paddy: "Rice",
  chawal: "Rice",
  dhan: "Rice",
  "bhat": "Rice",          // Marathi for cooked rice, sometimes used
  "tandul": "Rice",        // Marathi for raw rice

  // Maize / Corn
  maize: "Maize",
  corn: "Maize",
  makka: "Maize",
  maka: "Maize",
  "makka makki": "Maize",
  makki: "Maize",
  "corn crop": "Maize",

  // Soybean
  soybean: "Soybean",
  soyabean: "Soybean",
  soya: "Soybean",
  soi: "Soybean",
  "soy bean": "Soybean",
  soyabin: "Soybean",       // common mispronunciation
  "soybeans": "Soybean",

  // Groundnut / Peanut
  groundnut: "Groundnut",
  peanut: "Groundnut",
  mungfali: "Groundnut",
  shengdana: "Groundnut",
  "ground nut": "Groundnut",

  // Tomato
  tomato: "Tomato",
  tamatar: "Tomato",
  tamater: "Tomato",
  tomatoes: "Tomato",
  "tamatar ki": "Tomato",

  // Onion
  onion: "Onion",
  pyaz: "Onion",
  kanda: "Onion",
  onions: "Onion",
  "pyaz ki": "Onion",

  // Potato
  potato: "Potato",
  aloo: "Potato",
  batata: "Potato",
  potatoes: "Potato",
  "aloo ki": "Potato",

  // Banana
  banana: "Banana",
  kela: "Banana",
  keli: "Banana",          // Marathi plural
  bananas: "Banana",

  // Mango
  mango: "Mango",
  aam: "Mango",
  amba: "Mango",           // Marathi
  mangoes: "Mango",

  // Turmeric
  turmeric: "Turmeric",
  haldi: "Turmeric",
  halad: "Turmeric",       // Marathi

  // Chilli / Pepper
  chilli: "Chilli",
  chili: "Chilli",
  mirchi: "Chilli",
  "red chilli": "Chilli",
  "green chilli": "Chilli",
  pepper: "Chilli",

  // Jowar / Sorghum
  jowar: "Jowar",
  sorghum: "Jowar",
  jwari: "Jowar",         // Marathi

  // Bajra / Pearl Millet
  bajra: "Bajra",
  "pearl millet": "Bajra",
  bajri: "Bajra",         // Marathi

  // Gram / Chickpea
  chickpea: "Chickpea",
  gram: "Gram",
  chana: "Gram",
  harbhara: "Gram",       // Marathi
  "bengal gram": "Gram",
  "chick pea": "Chickpea",

  // Tur Dal / Pigeon Pea
  tur: "Tur Dal",
  "tur dal": "Tur Dal",
  arhar: "Tur Dal",
  "pigeon pea": "Tur Dal",

  // Cucumber / Kakdi
  cucumber: "Cucumber",
  kakdi: "Cucumber",

  // Watermelon
  watermelon: "Watermelon",
  kalingad: "Watermelon",  // Marathi
  tarbuz: "Watermelon",

  // Grapes
  grapes: "Grapes",
  grape: "Grapes",
  draksh: "Grapes",        // Marathi
  angur: "Grapes",

  // Pomegranate
  pomegranate: "Pomegranate",
  dalimb: "Pomegranate",   // Marathi
  anar: "Pomegranate",
};

const SOIL_MAP: Record<string, string> = {
  "black soil": "Black Soil",
  black: "Black Soil",
  kali: "Black Soil",
  kaali: "Black Soil",
  "red soil": "Red Soil",
  red: "Red Soil",
  lal: "Red Soil",
  "alluvial soil": "Alluvial Soil",
  alluvial: "Alluvial Soil",
  "laterite soil": "Laterite Soil",
  laterite: "Laterite Soil",
  "clay soil": "Clay Soil",
  clay: "Clay Soil",
  chikni: "Clay Soil",
  "sandy soil": "Sandy Soil",
  sandy: "Sandy Soil",
  retili: "Sandy Soil",
  "loamy soil": "Loamy Soil",
  loamy: "Loamy Soil",
  loam: "Loamy Soil",
};

const WATER_MAP: Record<string, string> = {
  borewell: "Borewell",
  "bore well": "Borewell",
  bore: "Borewell",
  tubewell: "Borewell",
  "tube well": "Borewell",
  canal: "Canal",
  nehar: "Canal",
  nahar: "Canal",
  river: "River",
  nadi: "River",
  "drip irrigation": "Drip Irrigation",
  drip: "Drip Irrigation",
  sprinkler: "Sprinkler",
  rainfed: "Rainfed",
  "rain fed": "Rainfed",
  baarish: "Rainfed",
  rain: "Rainfed",
  well: "Well",
  vihar: "Well",
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

// Mapping common agricultural villages/talukas to their respective district & state
const VILLAGE_TO_DISTRICT_MAP: Record<string, { district: string; state: string }> = {
  // Ahmednagar
  karanji: { district: "Ahmednagar", state: "Maharashtra" },
  sangamner: { district: "Ahmednagar", state: "Maharashtra" },
  kopergaon: { district: "Ahmednagar", state: "Maharashtra" },
  kopargaon: { district: "Ahmednagar", state: "Maharashtra" },
  shrirampur: { district: "Ahmednagar", state: "Maharashtra" },
  rahata: { district: "Ahmednagar", state: "Maharashtra" },
  shirdi: { district: "Ahmednagar", state: "Maharashtra" },
  akole: { district: "Ahmednagar", state: "Maharashtra" },
  parner: { district: "Ahmednagar", state: "Maharashtra" },
  pathardi: { district: "Ahmednagar", state: "Maharashtra" },
  shevgaon: { district: "Ahmednagar", state: "Maharashtra" },
  shrigonda: { district: "Ahmednagar", state: "Maharashtra" },
  karjat: { district: "Ahmednagar", state: "Maharashtra" },
  jamkhed: { district: "Ahmednagar", state: "Maharashtra" },
  rahuri: { district: "Ahmednagar", state: "Maharashtra" },
  newasa: { district: "Ahmednagar", state: "Maharashtra" },
  nevasa: { district: "Ahmednagar", state: "Maharashtra" },

  // Pune
  hadapsar: { district: "Pune", state: "Maharashtra" },
  baramati: { district: "Pune", state: "Maharashtra" },
  indapur: { district: "Pune", state: "Maharashtra" },
  daund: { district: "Pune", state: "Maharashtra" },
  shirur: { district: "Pune", state: "Maharashtra" },
  junnar: { district: "Pune", state: "Maharashtra" },
  khed: { district: "Pune", state: "Maharashtra" },
  ambegaon: { district: "Pune", state: "Maharashtra" },
  maval: { district: "Pune", state: "Maharashtra" },
  mulshi: { district: "Pune", state: "Maharashtra" },
  velhe: { district: "Pune", state: "Maharashtra" },
  bhor: { district: "Pune", state: "Maharashtra" },
  purandar: { district: "Pune", state: "Maharashtra" },
  haveli: { district: "Pune", state: "Maharashtra" },
  chakan: { district: "Pune", state: "Maharashtra" },
  manchar: { district: "Pune", state: "Maharashtra" },
  lonavala: { district: "Pune", state: "Maharashtra" },

  // Nashik
  niphad: { district: "Nashik", state: "Maharashtra" },
  sinnar: { district: "Nashik", state: "Maharashtra" },
  yeola: { district: "Nashik", state: "Maharashtra" },
  malegaon: { district: "Nashik", state: "Maharashtra" },
  satana: { district: "Nashik", state: "Maharashtra" },
  kalwan: { district: "Nashik", state: "Maharashtra" },
  chandwad: { district: "Nashik", state: "Maharashtra" },
  igatpuri: { district: "Nashik", state: "Maharashtra" },
  trimbak: { district: "Nashik", state: "Maharashtra" },
  trimbakeshwar: { district: "Nashik", state: "Maharashtra" },
  dindori: { district: "Nashik", state: "Maharashtra" },
  deola: { district: "Nashik", state: "Maharashtra" },
  lasalgaon: { district: "Nashik", state: "Maharashtra" },
  pimpalgaon: { district: "Nashik", state: "Maharashtra" },

  // Solapur
  pandharpur: { district: "Solapur", state: "Maharashtra" },
  barshi: { district: "Solapur", state: "Maharashtra" },
  karmala: { district: "Solapur", state: "Maharashtra" },
  madha: { district: "Solapur", state: "Maharashtra" },
  mohol: { district: "Solapur", state: "Maharashtra" },
  sangole: { district: "Solapur", state: "Maharashtra" },
  sangola: { district: "Solapur", state: "Maharashtra" },
  mangalwedha: { district: "Solapur", state: "Maharashtra" },
  mangalvedhe: { district: "Solapur", state: "Maharashtra" },
  malshiras: { district: "Solapur", state: "Maharashtra" },
  akkalkot: { district: "Solapur", state: "Maharashtra" },
  natepute: { district: "Solapur", state: "Maharashtra" },

  // Kolhapur
  karveer: { district: "Kolhapur", state: "Maharashtra" },
  kagal: { district: "Kolhapur", state: "Maharashtra" },
  hatkanangle: { district: "Kolhapur", state: "Maharashtra" },
  shirol: { district: "Kolhapur", state: "Maharashtra" },
  radhanagari: { district: "Kolhapur", state: "Maharashtra" },
  panhala: { district: "Kolhapur", state: "Maharashtra" },
  shahuwadi: { district: "Kolhapur", state: "Maharashtra" },
  gadhinglaj: { district: "Kolhapur", state: "Maharashtra" },
  ichalkaranji: { district: "Kolhapur", state: "Maharashtra" },

  // Satara
  karad: { district: "Satara", state: "Maharashtra" },
  wai: { district: "Satara", state: "Maharashtra" },
  phaltan: { district: "Satara", state: "Maharashtra" },
  koregaon: { district: "Satara", state: "Maharashtra" },
  khatav: { district: "Satara", state: "Maharashtra" },
  patan: { district: "Satara", state: "Maharashtra" },
  mahabaleshwar: { district: "Satara", state: "Maharashtra" },
  dahiwadi: { district: "Satara", state: "Maharashtra" },

  // Sangli
  miraj: { district: "Sangli", state: "Maharashtra" },
  tasgaon: { district: "Sangli", state: "Maharashtra" },
  islampur: { district: "Sangli", state: "Maharashtra" },
  walwa: { district: "Sangli", state: "Maharashtra" },
  khanapur: { district: "Sangli", state: "Maharashtra" },
  vita: { district: "Sangli", state: "Maharashtra" },
  jat: { district: "Sangli", state: "Maharashtra" },
  kavathemahankal: { district: "Sangli", state: "Maharashtra" },

  // Chhatrapati Sambhajinagar / Aurangabad
  paithan: { district: "Chhatrapati Sambhajinagar", state: "Maharashtra" },
  gangapur: { district: "Chhatrapati Sambhajinagar", state: "Maharashtra" },
  vaijapur: { district: "Chhatrapati Sambhajinagar", state: "Maharashtra" },
  sillod: { district: "Chhatrapati Sambhajinagar", state: "Maharashtra" },
  phulambri: { district: "Chhatrapati Sambhajinagar", state: "Maharashtra" },
  kannad: { district: "Chhatrapati Sambhajinagar", state: "Maharashtra" },

  // Jalgaon
  bhusawal: { district: "Jalgaon", state: "Maharashtra" },
  chalisgaon: { district: "Jalgaon", state: "Maharashtra" },
  chopda: { district: "Jalgaon", state: "Maharashtra" },
  yawal: { district: "Jalgaon", state: "Maharashtra" },
  raver: { district: "Jalgaon", state: "Maharashtra" },
  pachora: { district: "Jalgaon", state: "Maharashtra" },

  // Nagpur
  saoner: { district: "Nagpur", state: "Maharashtra" },
  ramtek: { district: "Nagpur", state: "Maharashtra" },
  katol: { district: "Nagpur", state: "Maharashtra" },
  narkhed: { district: "Nagpur", state: "Maharashtra" },
  umred: { district: "Nagpur", state: "Maharashtra" },
  hingna: { district: "Nagpur", state: "Maharashtra" },
};

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

// ─── INTENT PATTERNS ──────────────────────────────────────────────────────────
// Match phrases like "I want to grow wheat", "plant sugarcane", "wheat farming", etc.
// Returns the raw crop word found after the intent keyword, then we look it up in CROP_MAP
const INTENT_PATTERNS = [
  /(?:grow|plant|cultivate|ugao|lagao|bona|piku)\s+([a-z\s]+?)(?:\s+in|\s+at|\s+on|\s+with|\s+crop|$)/i,
  /([a-z\s]+?)\s+(?:crop|farming|kheti|sheti|cultivation|ugvana|lagvana)/i,
  /(?:i want|mujhe|mala|i need|i am growing|i grow)\s+(?:to\s+grow\s+)?([a-z\s]+?)(?:\s+in|\s+at|\s+on|$)/i,
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────

/** Escape special regex chars in a string */
function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Try to match a crop from text, returning canonical name or undefined */
function matchCrop(lower: string): string | undefined {
  // Sort entries: longest key first to avoid partial matches (e.g. "tur dal" before "tur")
  const entries = Object.entries(CROP_MAP).sort((a, b) => b[0].length - a[0].length);

  for (const [key, val] of entries) {
    // Use word boundary for single-word keys, substring for multi-word keys
    const pattern = key.includes(" ")
      ? new RegExp(escapeRegex(key), "i")
      : new RegExp(`\\b${escapeRegex(key)}\\b`, "i");
    if (pattern.test(lower)) {
      return val;
    }
  }

  // Try intent patterns to extract crop word, then look up
  for (const intentRe of INTENT_PATTERNS) {
    const m = lower.match(intentRe);
    if (m && m[1]) {
      const candidate = m[1].trim().toLowerCase();
      // check each word of candidate against crop map
      for (const word of candidate.split(/\s+/)) {
        if (word in CROP_MAP) return CROP_MAP[word];
      }
      // check full candidate phrase
      if (candidate in CROP_MAP) return CROP_MAP[candidate];
    }
  }

  return undefined;
}

/** Match a map entry using word boundaries */
function matchMap(lower: string, map: Record<string, string>): string | undefined {
  const entries = Object.entries(map).sort((a, b) => b[0].length - a[0].length);
  for (const [key, val] of entries) {
    const pattern = key.includes(" ")
      ? new RegExp(escapeRegex(key), "i")
      : new RegExp(`\\b${escapeRegex(key)}\\b`, "i");
    if (pattern.test(lower)) return val;
  }
  return undefined;
}

// ─── MAIN PARSER ──────────────────────────────────────────────────────────────

export function parseFarmerVoice(text: string): ParsedFarmerVoice {
  const lower = text.toLowerCase().trim();
  const matchedEntities: { key: string; label: string; value: string }[] = [];

  let crop: string | undefined;
  let state: string | undefined = "Maharashtra";
  let district: string | undefined;
  let soilType: string | undefined;
  let landArea: number | undefined;
  let waterSource: string | undefined;
  let budget: number | undefined;

  // ── 1. Crop ────────────────────────────────────────────────────────────────
  crop = matchCrop(lower);
  if (crop) {
    matchedEntities.push({ key: "crop", label: "Crop", value: crop });
  }

  // ── 2. District & Village Detection ────────────────────────────────────────
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

  // Check village mapping if district not directly specified
  if (!district) {
    for (const [vName, info] of Object.entries(VILLAGE_TO_DISTRICT_MAP)) {
      const vPattern = new RegExp(`\\b${escapeRegex(vName)}\\b`, "i");
      if (vPattern.test(lower)) {
        district = info.district;
        state = info.state;
        const formattedVillage = vName.charAt(0).toUpperCase() + vName.slice(1);
        matchedEntities.push({ key: "village", label: "Village", value: formattedVillage });
        matchedEntities.push({ key: "district", label: "District", value: district });
        matchedEntities.push({ key: "state", label: "State", value: state });
        break;
      }
    }
  }

  // ── 3. Soil Type ───────────────────────────────────────────────────────────
  soilType = matchMap(lower, SOIL_MAP);
  if (soilType) {
    matchedEntities.push({ key: "soilType", label: "Soil Type", value: soilType });
  }

  // ── 4. Water Source ────────────────────────────────────────────────────────
  waterSource = matchMap(lower, WATER_MAP);
  if (waterSource) {
    matchedEntities.push({ key: "waterSource", label: "Water Source", value: waterSource });
  }

  // ── 5. Land Area ───────────────────────────────────────────────────────────
  const areaMatch =
    lower.match(/(\d+(?:\.\d+)?)\s*(?:acre|acres|ekad|ekar|hec|hectare|bigha|guntha)/i) ||
    lower.match(/land\s*(?:of|is|area)?\s*(\d+(?:\.\d+)?)/i) ||
    lower.match(/(\d+(?:\.\d+)?)\s*(?:ekad|acres)/i);

  if (areaMatch) {
    const val = parseFloat(areaMatch[1]);
    if (!isNaN(val) && val > 0 && val <= 1000) {
      landArea = val;
      matchedEntities.push({ key: "landArea", label: "Land Area", value: `${val} Acres` });
    }
  } else {
    const standaloneNum = lower.match(/\b([1-9]|[12][0-9]|30)\b\s*(?:acre|acres|land)/i);
    if (standaloneNum) {
      landArea = parseFloat(standaloneNum[1]);
      matchedEntities.push({ key: "landArea", label: "Land Area", value: `${landArea} Acres` });
    }
  }

  // ── 6. Budget ──────────────────────────────────────────────────────────────
  if (lower.includes("lakh") || lower.includes("lac")) {
    const m = lower.match(/(\d+(?:\.\d+)?)\s*(?:lakh|lac|lakhs)/i);
    if (m) {
      budget = Math.round(parseFloat(m[1]) * 100000);
      matchedEntities.push({ key: "budget", label: "Budget", value: `₹${budget.toLocaleString("en-IN")}` });
    }
  } else if (lower.includes("thousand") || lower.includes("hazar")) {
    const m = lower.match(/(\d+(?:\.\d+)?)\s*(?:thousand|hazar)/i);
    if (m) {
      budget = Math.round(parseFloat(m[1]) * 1000);
      matchedEntities.push({ key: "budget", label: "Budget", value: `₹${budget.toLocaleString("en-IN")}` });
    }
  } else if (/\d+k\b/i.test(lower)) {
    const m = lower.match(/(\d+(?:\.\d+)?)k\b/i);
    if (m) {
      budget = Math.round(parseFloat(m[1]) * 1000);
      matchedEntities.push({ key: "budget", label: "Budget", value: `₹${budget.toLocaleString("en-IN")}` });
    }
  } else {
    const m = lower.match(/(?:budget|rs\.?|rupees?|inr|cost)?\s*(\d{5,7})\b/i);
    if (m) {
      budget = parseInt(m[1], 10);
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
