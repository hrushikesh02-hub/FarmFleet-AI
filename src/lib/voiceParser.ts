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
  village?: string;
  soilType?: string;
  landArea?: number;
  waterSource?: string;
  rawText: string;
  matchedEntities: { key: string; label: string; value: string }[];
}

// ─── CROP MAP (Devanagari, Marathi, Phonetic, English) ─────────────────────────
const CROP_MAP: Record<string, string> = {
  // Grains & Cereals
  wheat: "Wheat",
  gehu: "Wheat",
  gehun: "Wheat",
  gahu: "Wheat",
  गहू: "Wheat",
  गेहूं: "Wheat",
  "gahu pik": "Wheat",
  "wheat crop": "Wheat",

  rice: "Rice",
  paddy: "Rice",
  chawal: "Rice",
  dhan: "Rice",
  bhat: "Rice",
  tandul: "Rice",
  तांदूळ: "Rice",
  भात: "Rice",
  चावल: "Rice",

  jowar: "Jowar",
  sorghum: "Jowar",
  jwari: "Jowar",
  ज्वारी: "Jowar",
  ज्वार: "Jowar",

  bajra: "Bajra",
  bajri: "Bajra",
  बाजरी: "Bajra",
  बाजरा: "Bajra",
  "pearl millet": "Bajra",

  maize: "Maize",
  corn: "Maize",
  makka: "Maize",
  maka: "Maize",
  makki: "Maize",
  मका: "Maize",
  मक्का: "Maize",

  ragi: "Ragi",
  nachni: "Ragi",
  नाचणी: "Ragi",

  // Pulses / Dal / Legumes
  tur: "Tur Dal",
  "tur dal": "Tur Dal",
  arhar: "Tur Dal",
  तूर: "Tur Dal",
  तूरडाळ: "Tur Dal",

  chana: "Gram",
  gram: "Gram",
  harbhara: "Gram",
  chickpea: "Gram",
  हरभरा: "Gram",
  चना: "Gram",

  moong: "Moong",
  mung: "Moong",
  मूग: "Moong",
  मूंगा: "Moong",

  urad: "Urad",
  udid: "Urad",
  उडीद: "Urad",

  matki: "Matki",
  मटकी: "Matki",

  masoor: "Masoor",
  मसूर: "Masoor",

  soybean: "Soybean",
  soyabean: "Soybean",
  soya: "Soybean",
  soyabin: "Soybean",
  सोयाबीन: "Soybean",

  groundnut: "Groundnut",
  peanut: "Groundnut",
  mungfali: "Groundnut",
  shengdana: "Groundnut",
  bhuimug: "Groundnut",
  भुईमूग: "Groundnut",
  शेंगदाणा: "Groundnut",

  // Vegetables
  onion: "Onion",
  pyaz: "Onion",
  kanda: "Onion",
  कांदा: "Onion",
  प्याज़: "Onion",

  potato: "Potato",
  aloo: "Potato",
  batata: "Potato",
  बटाटा: "Potato",
  आलू: "Potato",

  tomato: "Tomato",
  tamatar: "Tomato",
  tomatoes: "Tomato",
  टमाट: "Tomato",
  टोमॅटो: "Tomato",
  टमाटर: "Tomato",

  brinjal: "Brinjal",
  eggplant: "Brinjal",
  vangi: "Brinjal",
  baingan: "Brinjal",
  वांगी: "Brinjal",
  बैंगन: "Brinjal",

  okra: "Okra",
  ladyfinger: "Okra",
  bhendi: "Okra",
  bhindi: "Okra",
  भेंडी: "Okra",
  भिंडी: "Okra",

  gavar: "Cluster Bean",
  "cluster bean": "Cluster Bean",
  गवार: "Cluster Bean",

  cauliflower: "Cauliflower",
  flower: "Cauliflower",
  phoolkobi: "Cauliflower",
  फ्लॉवर: "Cauliflower",
  फूलगोभी: "Cauliflower",

  cabbage: "Cabbage",
  kobi: "Cabbage",
  pattakobi: "Cabbage",
  कोबी: "Cabbage",
  पत्तागोभी: "Cabbage",

  capsicum: "Capsicum",
  "dhobli mirchi": "Capsicum",
  "simla mirchi": "Capsicum",
  "ढोबळी मिरची": "Capsicum",
  "शिमला मिर्च": "Capsicum",

  chilli: "Chilli",
  chili: "Chilli",
  mirchi: "Chilli",
  मिरची: "Chilli",

  cucumber: "Cucumber",
  kakdi: "Cucumber",
  काकडी: "Cucumber",
  खीरा: "Cucumber",

  "bottle gourd": "Bottle Gourd",
  dudhi: "Bottle Gourd",
  lauki: "Bottle Gourd",
  दुधी: "Bottle Gourd",
  लौकी: "Bottle Gourd",

  "bitter gourd": "Bitter Gourd",
  karela: "Bitter Gourd",
  karle: "Bitter Gourd",
  कारले: "Bitter Gourd",
  करेला: "Bitter Gourd",

  dodka: "Ridge Gourd",
  दोडका: "Ridge Gourd",

  pumpkin: "Pumpkin",
  bhopla: "Pumpkin",
  kaddoo: "Pumpkin",
  भोपळा: "Pumpkin",
  कद्दू: "Pumpkin",

  drumstick: "Drumstick",
  shevga: "Drumstick",
  शेवगा: "Drumstick",

  fenugreek: "Fenugreek",
  methi: "Fenugreek",
  मेथी: "Fenugreek",

  spinach: "Spinach",
  palak: "Spinach",
  पालक: "Spinach",

  coriander: "Coriander",
  kothimbir: "Coriander",
  dhania: "Coriander",
  कोथिंबीर: "Coriander",
  धनिया: "Coriander",

  radish: "Radish",
  mula: "Radish",
  मुळा: "Radish",

  carrot: "Carrot",
  gajar: "Carrot",
  गाजर: "Carrot",

  beetroot: "Beetroot",
  beet: "Beetroot",
  बीट: "Beetroot",

  // Fruits
  mango: "Mango",
  aam: "Mango",
  amba: "Mango",
  आंबा: "Mango",
  आम: "Mango",

  banana: "Banana",
  kela: "Banana",
  keli: "Banana",
  केळी: "Banana",
  केला: "Banana",

  grapes: "Grapes",
  grape: "Grapes",
  draksh: "Grapes",
  draksha: "Grapes",
  angur: "Grapes",
  द्राक्षे: "Grapes",
  अंगूर: "Grapes",

  pomegranate: "Pomegranate",
  dalimb: "Pomegranate",
  anar: "Pomegranate",
  डाळिंब: "Pomegranate",
  अनार: "Pomegranate",

  guava: "Guava",
  peru: "Guava",
  amrood: "Guava",
  पेरू: "Guava",
  अमरूद: "Guava",

  papaya: "Papaya",
  popai: "Papaya",
  पपई: "Papaya",
  पपीता: "Papaya",

  "custard apple": "Custard Apple",
  sitaphal: "Custard Apple",
  सीताफळ: "Custard Apple",

  chiku: "Sapota",
  chikoo: "Sapota",
  चीकू: "Sapota",

  orange: "Orange",
  santra: "Orange",
  संतरी: "Orange",
  संतरा: "Orange",

  mosambi: "Sweet Lime",
  "sweet lime": "Sweet Lime",
  मोसंबी: "Sweet Lime",

  lemon: "Lemon",
  limbu: "Lemon",
  nimbu: "Lemon",
  लिंबू: "Lemon",
  नींबू: "Lemon",

  watermelon: "Watermelon",
  kalingad: "Watermelon",
  tarbuz: "Watermelon",
  कलिंगड: "Watermelon",
  तरबूज: "Watermelon",

  muskmelon: "Muskmelon",
  kharbuj: "Muskmelon",
  खरबूज: "Muskmelon",

  pineapple: "Pineapple",
  ananas: "Pineapple",
  अननस: "Pineapple",

  coconut: "Coconut",
  naral: "Coconut",
  nariyal: "Coconut",
  नाारळ: "Coconut",
  नारियल: "Coconut",

  strawberry: "Strawberry",
  स्ट्रॉबेरी: "Strawberry",

  "dragon fruit": "Dragon Fruit",
  "ड्रॅगन फ्रुट": "Dragon Fruit",

  jackfruit: "Jackfruit",
  phanas: "Jackfruit",
  फणस: "Jackfruit",

  amla: "Amla",
  आवळा: "Amla",

  // Cash Crops & Spices
  cotton: "Cotton",
  kapas: "Cotton",
  kapaas: "Cotton",
  karpas: "Cotton",
  kapus: "Cotton",
  कापूस: "Cotton",
  कपास: "Cotton",

  sugarcane: "Sugarcane",
  ganna: "Sugarcane",
  ganne: "Sugarcane",
  us: "Sugarcane",
  ubs: "Sugarcane",
  oos: "Sugarcane",
  ऊस: "Sugarcane",
  गन्ना: "Sugarcane",

  turmeric: "Turmeric",
  haldi: "Turmeric",
  halad: "Turmeric",
  हळद: "Turmeric",
  हल्दी: "Turmeric",

  ginger: "Ginger",
  ale: "Ginger",
  adrak: "Ginger",
  आले: "Ginger",
  अद्रक: "Ginger",

  garlic: "Garlic",
  lasan: "Garlic",
  lahsun: "Garlic",
  लसूण: "Garlic",
  लहसुन: "Garlic",

  tobacco: "Tobacco",
  tambaku: "Tobacco",
  तंबाखू: "Tobacco",

  arecanut: "Arecanut",
  supari: "Arecanut",
  सुपारी: "Arecanut",

  // Floriculture (Flowers)
  marigold: "Marigold",
  zendu: "Marigold",
  झेंडू: "Marigold",

  rose: "Rose",
  gulab: "Rose",
  गुलाब: "Rose",

  chrysanthemum: "Chrysanthemum",
  shevanti: "Chrysanthemum",
  शेवंती: "Chrysanthemum",

  jasmine: "Jasmine",
  mogra: "Jasmine",
  मोगरा: "Jasmine",
};

const SOIL_MAP: Record<string, string> = {
  "black soil": "Black Soil",
  black: "Black Soil",
  kali: "Black Soil",
  kaali: "Black Soil",
  काळी: "Black Soil",
  "red soil": "Red Soil",
  red: "Red Soil",
  lal: "Red Soil",
  लाल: "Red Soil",
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
  बोअरवेल: "Borewell",
  canal: "Canal",
  nehar: "Canal",
  nahar: "Canal",
  कालवा: "Canal",
  river: "River",
  nadi: "River",
  नदी: "River",
  "drip irrigation": "Drip Irrigation",
  drip: "Drip Irrigation",
  ठिबक: "Drip Irrigation",
  sprinkler: "Sprinkler",
  तुषार: "Sprinkler",
  rainfed: "Rainfed",
  "rain fed": "Rainfed",
  baarish: "Rainfed",
  rain: "Rainfed",
  पाऊस: "Rainfed",
  well: "Well",
  vihar: "Well",
  विहीर: "Well",
};

const MAHARASHTRA_DISTRICTS: Record<string, string> = {
  ahmednagar: "Ahmednagar",
  ahmadnagar: "Ahmednagar",
  नगर: "Ahmednagar",
  अहमदनगर: "Ahmednagar",
  pune: "Pune",
  poona: "Pune",
  पुणे: "Pune",
  nashik: "Nashik",
  nasik: "Nashik",
  नाशिक: "Nashik",
  solapur: "Solapur",
  sholapur: "Solapur",
  सोलापूर: "Solapur",
  nagpur: "Nagpur",
  नागपूर: "Nagpur",
  satara: "Satara",
  सातारा: "Satara",
  kolhapur: "Kolhapur",
  कोल्हापूर: "Kolhapur",
  aurangabad: "Chhatrapati Sambhajinagar",
  "chhatrapati sambhajinagar": "Chhatrapati Sambhajinagar",
  "sambhajinagar": "Chhatrapati Sambhajinagar",
  औरंगाबाद: "Chhatrapati Sambhajinagar",
  संभाजीनगर: "Chhatrapati Sambhajinagar",
  jalgaon: "Jalgaon",
  जळगाव: "Jalgaon",
  amravati: "Amravati",
  अमरावती: "Amravati",
  nanded: "Nanded",
  नांदेड: "Nanded",
  sangli: "Sangli",
  सांगली: "Sangli",
  latur: "Latur",
  लातूर: "Latur",
  akola: "Akola",
  अकोला: "Akola",
  dhule: "Dhule",
  धुळे: "Dhule",
  buldhana: "Buldhana",
  buldana: "Buldhana",
  बुलढाणा: "Buldhana",
  beed: "Beed",
  bid: "Beed",
  बीड: "Beed",
  parbhani: "Parbhani",
  परभणी: "Parbhani",
  yavatmal: "Yavatmal",
  यवतमाळ: "Yavatmal",
  osmanabad: "Dharashiv",
  dharashiv: "Dharashiv",
  उस्मानाबाद: "Dharashiv",
  धाराशिव: "Dharashiv",
  wardha: "Wardha",
  वर्धा: "Wardha",
  chandrapur: "Chandrapur",
  चंद्रपूर: "Chandrapur",
  bhandara: "Bhandara",
  भंडारा: "Bhandara",
  gondia: "Gondia",
  गोंदिया: "Gondia",
  gadchiroli: "Gadchiroli",
  गडचिरोली: "Gadchiroli",
  hingoli: "Hingoli",
  हिंगोली: "Hingoli",
  washim: "Washim",
  वाशिम: "Washim",
  ratnagiri: "Ratnagiri",
  रत्नागिरी: "Ratnagiri",
  sindhudurg: "Sindhudurg",
  सिंधुदुर्ग: "Sindhudurg",
  raigad: "Raigad",
  रायगड: "Raigad",
  thane: "Thane",
  ठाणे: "Thane",
  palghar: "Palghar",
  पालघर: "Palghar",
};

// Comprehensive Marathi Towns/Villages/Talukas mapped to District & State
const VILLAGE_TO_DISTRICT_MAP: Record<string, { district: string; state: string }> = {
  // Ahmednagar District
  kopargaon: { district: "Ahmednagar", state: "Maharashtra" },
  kopergaon: { district: "Ahmednagar", state: "Maharashtra" },
  kopargav: { district: "Ahmednagar", state: "Maharashtra" },
  कोपरगाव: { district: "Ahmednagar", state: "Maharashtra" },
  sangamner: { district: "Ahmednagar", state: "Maharashtra" },
  संगमनेर: { district: "Ahmednagar", state: "Maharashtra" },
  shrirampur: { district: "Ahmednagar", state: "Maharashtra" },
  श्रीरामपूर: { district: "Ahmednagar", state: "Maharashtra" },
  rahata: { district: "Ahmednagar", state: "Maharashtra" },
  राहता: { district: "Ahmednagar", state: "Maharashtra" },
  shirdi: { district: "Ahmednagar", state: "Maharashtra" },
  शिर्डी: { district: "Ahmednagar", state: "Maharashtra" },
  karanji: { district: "Ahmednagar", state: "Maharashtra" },
  करंजी: { district: "Ahmednagar", state: "Maharashtra" },
  akole: { district: "Ahmednagar", state: "Maharashtra" },
  अकोले: { district: "Ahmednagar", state: "Maharashtra" },
  parner: { district: "Ahmednagar", state: "Maharashtra" },
  पारनेर: { district: "Ahmednagar", state: "Maharashtra" },
  pathardi: { district: "Ahmednagar", state: "Maharashtra" },
  पाथर्डी: { district: "Ahmednagar", state: "Maharashtra" },
  shevgaon: { district: "Ahmednagar", state: "Maharashtra" },
  शेवगाव: { district: "Ahmednagar", state: "Maharashtra" },
  shrigonda: { district: "Ahmednagar", state: "Maharashtra" },
  श्रीगोंदा: { district: "Ahmednagar", state: "Maharashtra" },
  karjat: { district: "Ahmednagar", state: "Maharashtra" },
  कर्जत: { district: "Ahmednagar", state: "Maharashtra" },
  jamkhed: { district: "Ahmednagar", state: "Maharashtra" },
  जामखेड: { district: "Ahmednagar", state: "Maharashtra" },
  rahuri: { district: "Ahmednagar", state: "Maharashtra" },
  राहुरी: { district: "Ahmednagar", state: "Maharashtra" },
  newasa: { district: "Ahmednagar", state: "Maharashtra" },
  nevasa: { district: "Ahmednagar", state: "Maharashtra" },
  नेवासा: { district: "Ahmednagar", state: "Maharashtra" },

  // Nashik District
  yeola: { district: "Nashik", state: "Maharashtra" },
  yewla: { district: "Nashik", state: "Maharashtra" },
  येवला: { district: "Nashik", state: "Maharashtra" },
  manmad: { district: "Nashik", state: "Maharashtra" },
  मनमाड: { district: "Nashik", state: "Maharashtra" },
  niphad: { district: "Nashik", state: "Maharashtra" },
  निफाड: { district: "Nashik", state: "Maharashtra" },
  sinnar: { district: "Nashik", state: "Maharashtra" },
  सिन्नर: { district: "Nashik", state: "Maharashtra" },
  malegaon: { district: "Nashik", state: "Maharashtra" },
  मालेगाव: { district: "Nashik", state: "Maharashtra" },
  satana: { district: "Nashik", state: "Maharashtra" },
  सटाणा: { district: "Nashik", state: "Maharashtra" },
  kalwan: { district: "Nashik", state: "Maharashtra" },
  कलवण: { district: "Nashik", state: "Maharashtra" },
  chandwad: { district: "Nashik", state: "Maharashtra" },
  चांदवड: { district: "Nashik", state: "Maharashtra" },
  igatpuri: { district: "Nashik", state: "Maharashtra" },
  इगतपुरी: { district: "Nashik", state: "Maharashtra" },
  trimbak: { district: "Nashik", state: "Maharashtra" },
  trimbakeshwar: { district: "Nashik", state: "Maharashtra" },
  त्र्यंबकेश्वर: { district: "Nashik", state: "Maharashtra" },
  dindori: { district: "Nashik", state: "Maharashtra" },
  दिंडोरी: { district: "Nashik", state: "Maharashtra" },
  deola: { district: "Nashik", state: "Maharashtra" },
  देवळा: { district: "Nashik", state: "Maharashtra" },
  lasalgaon: { district: "Nashik", state: "Maharashtra" },
  लासलगाव: { district: "Nashik", state: "Maharashtra" },
  pimpalgaon: { district: "Nashik", state: "Maharashtra" },
  पिंपळगाव: { district: "Nashik", state: "Maharashtra" },

  // Chhatrapati Sambhajinagar / Aurangabad
  vaijapur: { district: "Chhatrapati Sambhajinagar", state: "Maharashtra" },
  waijapur: { district: "Chhatrapati Sambhajinagar", state: "Maharashtra" },
  वैजापूर: { district: "Chhatrapati Sambhajinagar", state: "Maharashtra" },
  paithan: { district: "Chhatrapati Sambhajinagar", state: "Maharashtra" },
  पैठण: { district: "Chhatrapati Sambhajinagar", state: "Maharashtra" },
  gangapur: { district: "Chhatrapati Sambhajinagar", state: "Maharashtra" },
  गंगापूर: { district: "Chhatrapati Sambhajinagar", state: "Maharashtra" },
  sillod: { district: "Chhatrapati Sambhajinagar", state: "Maharashtra" },
  सिल्लोड: { district: "Chhatrapati Sambhajinagar", state: "Maharashtra" },
  kannad: { district: "Chhatrapati Sambhajinagar", state: "Maharashtra" },
  कन्नड: { district: "Chhatrapati Sambhajinagar", state: "Maharashtra" },
  phulambri: { district: "Chhatrapati Sambhajinagar", state: "Maharashtra" },
  फुलंब्री: { district: "Chhatrapati Sambhajinagar", state: "Maharashtra" },

  // Pune District
  hadapsar: { district: "Pune", state: "Maharashtra" },
  हडपसर: { district: "Pune", state: "Maharashtra" },
  baramati: { district: "Pune", state: "Maharashtra" },
  बारामती: { district: "Pune", state: "Maharashtra" },
  indapur: { district: "Pune", state: "Maharashtra" },
  इंदापूर: { district: "Pune", state: "Maharashtra" },
  daund: { district: "Pune", state: "Maharashtra" },
  दौंड: { district: "Pune", state: "Maharashtra" },
  shirur: { district: "Pune", state: "Maharashtra" },
  शिरूर: { district: "Pune", state: "Maharashtra" },
  junnar: { district: "Pune", state: "Maharashtra" },
  जुन्नर: { district: "Pune", state: "Maharashtra" },
  khed: { district: "Pune", state: "Maharashtra" },
  खेड: { district: "Pune", state: "Maharashtra" },
  ambegaon: { district: "Pune", state: "Maharashtra" },
  आंबेगाव: { district: "Pune", state: "Maharashtra" },
  maval: { district: "Pune", state: "Maharashtra" },
  मावळ: { district: "Pune", state: "Maharashtra" },
  mulshi: { district: "Pune", state: "Maharashtra" },
  मुळशी: { district: "Pune", state: "Maharashtra" },
  bhor: { district: "Pune", state: "Maharashtra" },
  भोर: { district: "Pune", state: "Maharashtra" },
  purandar: { district: "Pune", state: "Maharashtra" },
  पुरंदर: { district: "Pune", state: "Maharashtra" },
  chakan: { district: "Pune", state: "Maharashtra" },
  चाकण: { district: "Pune", state: "Maharashtra" },
  manchar: { district: "Pune", state: "Maharashtra" },
  मंचर: { district: "Pune", state: "Maharashtra" },

  // Solapur District
  pandharpur: { district: "Solapur", state: "Maharashtra" },
  पंढरपूर: { district: "Solapur", state: "Maharashtra" },
  barshi: { district: "Solapur", state: "Maharashtra" },
  बार्शी: { district: "Solapur", state: "Maharashtra" },
  karmala: { district: "Solapur", state: "Maharashtra" },
  करमाळा: { district: "Solapur", state: "Maharashtra" },
  madha: { district: "Solapur", state: "Maharashtra" },
  माढा: { district: "Solapur", state: "Maharashtra" },
  mohol: { district: "Solapur", state: "Maharashtra" },
  मोहूळ: { district: "Solapur", state: "Maharashtra" },
  sangole: { district: "Solapur", state: "Maharashtra" },
  sangola: { district: "Solapur", state: "Maharashtra" },
  सांगोला: { district: "Solapur", state: "Maharashtra" },
  mangalwedha: { district: "Solapur", state: "Maharashtra" },
  मंगळवेढा: { district: "Solapur", state: "Maharashtra" },
  malshiras: { district: "Solapur", state: "Maharashtra" },
  माळशिरस: { district: "Solapur", state: "Maharashtra" },
  akkalkot: { district: "Solapur", state: "Maharashtra" },
  अक्कलकोट: { district: "Solapur", state: "Maharashtra" },

  // Kolhapur District
  karveer: { district: "Kolhapur", state: "Maharashtra" },
  करवीर: { district: "Kolhapur", state: "Maharashtra" },
  kagal: { district: "Kolhapur", state: "Maharashtra" },
  कागल: { district: "Kolhapur", state: "Maharashtra" },
  hatkanangle: { district: "Kolhapur", state: "Maharashtra" },
  हातकणंगले: { district: "Kolhapur", state: "Maharashtra" },
  shirol: { district: "Kolhapur", state: "Maharashtra" },
  शिरोळ: { district: "Kolhapur", state: "Maharashtra" },
  radhanagari: { district: "Kolhapur", state: "Maharashtra" },
  राधानगरी: { district: "Kolhapur", state: "Maharashtra" },
  panhala: { district: "Kolhapur", state: "Maharashtra" },
  पन्हाळा: { district: "Kolhapur", state: "Maharashtra" },
  gadhinglaj: { district: "Kolhapur", state: "Maharashtra" },
  गडहिंग्लज: { district: "Kolhapur", state: "Maharashtra" },
  ichalkaranji: { district: "Kolhapur", state: "Maharashtra" },
  इचलकरंजी: { district: "Kolhapur", state: "Maharashtra" },

  // Satara District
  karad: { district: "Satara", state: "Maharashtra" },
  कराड: { district: "Satara", state: "Maharashtra" },
  wai: { district: "Satara", state: "Maharashtra" },
  वाई: { district: "Satara", state: "Maharashtra" },
  phaltan: { district: "Satara", state: "Maharashtra" },
  फलटण: { district: "Satara", state: "Maharashtra" },
  koregaon: { district: "Satara", state: "Maharashtra" },
  कोरेगाव: { district: "Satara", state: "Maharashtra" },
  khatav: { district: "Satara", state: "Maharashtra" },
  खटाव: { district: "Satara", state: "Maharashtra" },
  patan: { district: "Satara", state: "Maharashtra" },
  पाटण: { district: "Satara", state: "Maharashtra" },
  mahabaleshwar: { district: "Satara", state: "Maharashtra" },
  महाबळेश्वर: { district: "Satara", state: "Maharashtra" },

  // Sangli District
  miraj: { district: "Sangli", state: "Maharashtra" },
  मिरज: { district: "Sangli", state: "Maharashtra" },
  tasgaon: { district: "Sangli", state: "Maharashtra" },
  तासगाव: { district: "Sangli", state: "Maharashtra" },
  islampur: { district: "Sangli", state: "Maharashtra" },
  इस्लामपूर: { district: "Sangli", state: "Maharashtra" },
  walwa: { district: "Sangli", state: "Maharashtra" },
  वाळवा: { district: "Sangli", state: "Maharashtra" },

  // Jalgaon District
  bhusawal: { district: "Jalgaon", state: "Maharashtra" },
  भुसावळ: { district: "Jalgaon", state: "Maharashtra" },
  chalisgaon: { district: "Jalgaon", state: "Maharashtra" },
  चाळीसगाव: { district: "Jalgaon", state: "Maharashtra" },
  chopda: { district: "Jalgaon", state: "Maharashtra" },
  चोपडा: { district: "Jalgaon", state: "Maharashtra" },

  // Nagpur District
  saoner: { district: "Nagpur", state: "Maharashtra" },
  सावनेर: { district: "Nagpur", state: "Maharashtra" },
  ramtek: { district: "Nagpur", state: "Maharashtra" },
  रामटेक: { district: "Nagpur", state: "Maharashtra" },
  katol: { district: "Nagpur", state: "Maharashtra" },
  काटोल: { district: "Nagpur", state: "Maharashtra" },
};

const OTHER_INDIAN_DISTRICTS: Record<string, string> = {
  ludhiana: "Punjab",
  amritsar: "Punjab",
  karnal: "Haryana",
  hisar: "Haryana",
  jaipur: "Rajasthan",
  jodhpur: "Rajasthan",
  indore: "Madhya Pradesh",
  bhopal: "Madhya Pradesh",
  surat: "Gujarat",
  rajkot: "Gujarat",
  ahmedabad: "Gujarat",
  lucknow: "Uttar Pradesh",
  kanpur: "Uttar Pradesh",
  patna: "Bihar",
  coimbatore: "Tamil Nadu",
  mysore: "Karnataka",
};

const INTENT_PATTERNS = [
  /(?:grow|plant|cultivate|ugao|lagao|bona|piku|pikawava|pikayche)\s+([a-z\u0900-\u097F\s]+?)(?:\s+in|\s+at|\s+on|\s+with|\s+crop|\s+madhye|\s+yethe|$)/i,
  /([a-z\u0900-\u097F\s]+?)\s+(?:crop|farming|kheti|sheti|cultivation|ugvana|lagvana|che pik|sathi)/i,
  /(?:i want|mujhe|mala|i need|i am growing|i grow|aplyala)\s+(?:to\s+grow\s+)?([a-z\u0900-\u097F\s]+?)(?:\s+in|\s+at|\s+on|\s+madhye|$)/i,
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Strip common Marathi/Hindi location suffixes like -at, -la, -madhye, -yethil, -gavat */
function normalizeLocationString(text: string): string {
  let cleaned = text;
  // Remove suffixes attached to words (e.g. kopargaonmadhye -> kopargaon, yeolayat -> yeola, वैजापूरमध्ये -> वैजापूर)
  cleaned = cleaned.replace(/(?:madhye|yethil|gavatun|gavacha|madhil|yethe|pasun|gavachi|gavala|at|la|मध्ये|येथील|येथे|गावात|गावाचा|गावातून)\b/gi, " ");
  return cleaned;
}

function matchCrop(lower: string): string | undefined {
  const entries = Object.entries(CROP_MAP).sort((a, b) => b[0].length - a[0].length);

  for (const [key, val] of entries) {
    const isNonAscii = /[^\x00-\x7F]/.test(key);
    const pattern = (key.includes(" ") || isNonAscii)
      ? new RegExp(escapeRegex(key), "i")
      : new RegExp(`\\b${escapeRegex(key)}\\b`, "i");
    if (pattern.test(lower)) {
      return val;
    }
  }

  for (const intentRe of INTENT_PATTERNS) {
    const m = lower.match(intentRe);
    if (m && m[1]) {
      const candidate = m[1].trim().toLowerCase();
      for (const word of candidate.split(/\s+/)) {
        if (word in CROP_MAP) return CROP_MAP[word];
      }
      if (candidate in CROP_MAP) return CROP_MAP[candidate];
    }
  }

  return undefined;
}

function matchMap(lower: string, map: Record<string, string>): string | undefined {
  const entries = Object.entries(map).sort((a, b) => b[0].length - a[0].length);
  for (const [key, val] of entries) {
    const isNonAscii = /[^\x00-\x7F]/.test(key);
    const pattern = (key.includes(" ") || isNonAscii)
      ? new RegExp(escapeRegex(key), "i")
      : new RegExp(`\\b${escapeRegex(key)}\\b`, "i");
    if (pattern.test(lower)) return val;
  }
  return undefined;
}

// ─── MAIN PARSER ──────────────────────────────────────────────────────────────

export function parseFarmerVoice(text: string): ParsedFarmerVoice {
  const rawLower = text.toLowerCase().trim();
  const normalizedLower = normalizeLocationString(rawLower);

  const matchedEntities: { key: string; label: string; value: string }[] = [];

  let crop: string | undefined;
  let state: string | undefined = "Maharashtra";
  let district: string | undefined;
  let village: string | undefined;
  let soilType: string | undefined;
  let landArea: number | undefined;
  let waterSource: string | undefined;

  // ── 1. Crop ────────────────────────────────────────────────────────────────
  crop = matchCrop(rawLower);
  if (crop) {
    matchedEntities.push({ key: "crop", label: "Crop", value: crop });
  }

  // ── 2. District & Village Detection ────────────────────────────────────────
  for (const [dKey, dName] of Object.entries(MAHARASHTRA_DISTRICTS)) {
    if (normalizedLower.includes(dKey)) {
      district = dName;
      state = "Maharashtra";
      matchedEntities.push({ key: "district", label: "District", value: dName });
      matchedEntities.push({ key: "state", label: "State", value: "Maharashtra" });
      break;
    }
  }

  if (!district) {
    for (const [dName, dState] of Object.entries(OTHER_INDIAN_DISTRICTS)) {
      if (normalizedLower.includes(dName)) {
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
    for (const [vKey, info] of Object.entries(VILLAGE_TO_DISTRICT_MAP)) {
      const vPattern = new RegExp(`\\b${escapeRegex(vKey)}\\b`, "i");
      if (vPattern.test(normalizedLower) || normalizedLower.includes(vKey)) {
        district = info.district;
        state = info.state;
        village = vKey.charAt(0).toUpperCase() + vKey.slice(1);
        matchedEntities.push({ key: "village", label: "Village / Town", value: village });
        matchedEntities.push({ key: "district", label: "District", value: district });
        matchedEntities.push({ key: "state", label: "State", value: state });
        break;
      }
    }
  }

  // ── 3. Soil Type ───────────────────────────────────────────────────────────
  soilType = matchMap(rawLower, SOIL_MAP);
  if (soilType) {
    matchedEntities.push({ key: "soilType", label: "Soil Type", value: soilType });
  }

  // ── 4. Water Source ────────────────────────────────────────────────────────
  waterSource = matchMap(rawLower, WATER_MAP);
  if (waterSource) {
    matchedEntities.push({ key: "waterSource", label: "Water Source", value: waterSource });
  }

  // ── 5. Land Area ───────────────────────────────────────────────────────────
  const areaMatch =
    rawLower.match(/(\d+(?:\.\d+)?)\s*(?:acre|acres|ekad|ekar|hec|hectare|bigha|guntha|एकर|एकड)/i) ||
    rawLower.match(/land\s*(?:of|is|area)?\s*(\d+(?:\.\d+)?)/i) ||
    rawLower.match(/(\d+(?:\.\d+)?)\s*(?:ekad|acres)/i);

  if (areaMatch) {
    const val = parseFloat(areaMatch[1]);
    if (!isNaN(val) && val > 0 && val <= 1000) {
      landArea = val;
      matchedEntities.push({ key: "landArea", label: "Land Area", value: `${val} Acres` });
    }
  } else {
    const standaloneNum = rawLower.match(/\b([1-9]|[12][0-9]|30)\b\s*(?:acre|acres|land|ekad|ekar)/i);
    if (standaloneNum) {
      landArea = parseFloat(standaloneNum[1]);
      matchedEntities.push({ key: "landArea", label: "Land Area", value: `${landArea} Acres` });
    }
  }

  return {
    crop,
    state,
    district,
    village,
    soilType,
    landArea,
    waterSource,
    rawText: text,
    matchedEntities,
  };
}
