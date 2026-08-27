/**
 * English (en) Crop Knowledge Base for FarmFleet AI Fallback Engine
 */

const crops = {
  wheat: {
    cropName: "Wheat",
    cropDuration: "4 - 5 Months",
    bestSeason: "Rabi (November - March)",
    yieldPerAcre: 22,
    yieldUnit: "Quintals",
    landPrep: [
      "Plough the field 2-3 times with rotavator to pulverize the soil to fine tilth.",
      "Apply 4-5 tonnes per acre of well-decomposed Farmyard Manure (FYM) before final ploughing.",
      "Properly level the field using laser land leveller for uniform irrigation distribution."
    ],
    seed: {
      variety: "HD-2967 / PBW-550 / DBW-187 (Karan Vandana)",
      baseSeedQtyKgPerAcre: 40,
      seedQtyUnit: "kg",
      costPerAcre: 1800
    },
    timeline: [
      { week: "1", title: "Land Preparation & FYM Spreading", description: "Deep ploughing, levelling, and spreading organic manure." },
      { week: "2", title: "Sowing & Seed Treatment", description: "Treat seeds with Thiram @ 2.5g/kg and sow at 20 cm row spacing." },
      { week: "4", title: "Crown Root Initiation (CRI) & 1st Irrigation", description: "Provide critical first irrigation 21 days after sowing." },
      { week: "7", title: "Tillering Stage & Top-Dressing", description: "Apply 1st split dose of Urea (45 kg/acre) and perform manual weeding." },
      { week: "10", title: "Jointing & Booting Stage", description: "Maintain adequate soil moisture for stem elongation and earhead formation." },
      { week: "14", title: "Flowering & Grain Filling", description: "Provide light irrigation; inspect crop for Rust or Aphid infestation." },
      { week: "18", title: "Maturation & Harvest Preparation", description: "Stop irrigation 10-15 days prior to harvest when grains reach golden maturity." }
    ],
    fertilizer: [
      { stage: "Basal Application", fertilizer: "DAP + MOP + Zinc Sulphate", quantity: "50 kg DAP + 25 kg MOP + 10 kg Zinc per acre", time: "At sowing" },
      { stage: "First Top Dressing (CRI)", fertilizer: "Urea", quantity: "45 kg Urea per acre", time: "21-25 days after sowing" },
      { stage: "Second Top Dressing (Jointing)", fertilizer: "Urea", quantity: "45 kg Urea per acre", time: "45-50 days after sowing" }
    ],
    irrigation: [
      { stage: "CRI Stage (Critical)", frequency: "Single irrigation at Day 21", waterRequirement: "3-4 inches" },
      { stage: "Tillering & Jointing", frequency: "Every 15-20 days", waterRequirement: "Moderate irrigation" },
      { stage: "Flowering & Milk Stage", frequency: "Every 12-15 days", waterRequirement: "Light irrigation, avoid waterlogging" }
    ],
    weed: [
      "Apply Pendimethalin 30% EC @ 1L/acre within 3 days of sowing as pre-emergence.",
      "Spray Clodinafop-propargyl @ 60g/acre at 30-35 DAS for Phalaris minor grass weed control."
    ],
    pest: [
      { problem: "Yellow Rust / Brown Rust", solution: "Spray Propiconazole 25% EC @ 200 ml/acre in 200L water at first sign of yellow spots." },
      { problem: "Aphids / Termites", solution: "Spray Imidacloprid 17.8% SL @ 50 ml/acre or apply Chlorpyrifos for termite control." }
    ],
    equipment: [
      { name: "Tractor with Rotavator", purpose: "Soil tillage and field preparation", estimatedRent: "₹1,200 / hour" },
      { name: "Seed Drill Machine", purpose: "Line sowing of seeds at uniform depth", estimatedRent: "₹800 / acre" },
      { name: "Combine Harvester", purpose: "Harvesting and threshing at crop maturity", estimatedRent: "₹2,200 / hour" }
    ],
    labour: [
      { activity: "Land Preparation & FYM Application", workers: "3 workers", days: "2 days" },
      { activity: "Sowing & Fertilizer Broadcast", workers: "2 workers", days: "1 day" },
      { activity: "Weeding & Spray Operations", workers: "3 workers", days: "2 days" }
    ],
    precautions: [
      "Ensure CRI stage (Day 21) irrigation is never delayed as it determines root depth and tiller count.",
      "Avoid heavy irrigation during high wind conditions near maturity to prevent crop lodging.",
      "Check weather forecast before spraying fungicides for rust."
    ],
    tips: [
      "Adopt Ridge & Furrow sowing if soil drainage is poor.",
      "Use certified seeds treated with Trichoderma for organic root disease protection."
    ]
  },

  sugarcane: {
    cropName: "Sugarcane",
    cropDuration: "10 - 12 Months",
    bestSeason: "Spring / Autumn Planting",
    yieldPerAcre: 350,
    yieldUnit: "Tonnes",
    landPrep: [
      "Deep ploughing using moldboard plough followed by two harrowings to loosen soil to 30cm depth.",
      "Apply 8-10 tonnes of FYM or press mud per acre.",
      "Form ridges and furrows at 4 feet row spacing for optimal cane growth."
    ],
    seed: {
      variety: "Co 0238 / Co 86032 / CoM 0265 (Phule 0265)",
      baseSeedQtyKgPerAcre: 30000,
      seedQtyUnit: "setts",
      costPerAcre: 8500
    },
    timeline: [
      { week: "1", title: "Furrow Making & FYM Basal Application", description: "Deep furrow creation at 4ft spacing and organic compost mixing." },
      { week: "2", title: "Sett Treatment & Planting", description: "Treat 3-bud setts with Carbendazim @ 1g/L water and plant in furrows." },
      { week: "6", title: "Germination Completion & 1st Hoeing", description: "Fill gaps where setts failed to germinate and perform shallow hoeing." },
      { week: "12", title: "Tillering Phase & Fertilizer Application", description: "Apply split dose of Nitrogen and Potassium; earthing up operation." },
      { week: "20", title: "Grand Growth Phase & Drip Fertigation", description: "Ensure continuous moisture and fertigation through drip lines." },
      { week: "32", title: "Cane Elongation & Trash Mulching", description: "Detrash lower dry leaves and spread between rows to conserve moisture." },
      { week: "44", title: "Maturity & BRIX Sugar Check", description: "Check BRIX sugar reading before harvesting with cutter." }
    ],
    fertilizer: [
      { stage: "Basal Planting", fertilizer: "Single Super Phosphate (SSP) + MOP", quantity: "150 kg SSP + 50 kg MOP per acre", time: "In furrows before sett placement" },
      { stage: "30 Days (Tillering)", fertilizer: "Urea", quantity: "50 kg Urea per acre", time: "30 days after planting" },
      { stage: "60 Days (Grand Growth)", fertilizer: "Urea + 19:19:19 NPK", quantity: "50 kg Urea + 10 kg NPK via fertigation", time: "60 days after planting" },
      { stage: "120 Days (Earthing Up)", fertilizer: "Urea + Potash", quantity: "50 kg Urea + 25 kg Potash per acre", time: "During final earthing up" }
    ],
    irrigation: [
      { stage: "Establishment Stage (0-30 days)", frequency: "Every 7-10 days", waterRequirement: "Light furrow wetting" },
      { stage: "Tillering Phase (30-120 days)", frequency: "Every 10-12 days (or daily drip)", waterRequirement: "Moderate irrigation" },
      { stage: "Grand Growth Phase (120-250 days)", frequency: "Every 8-10 days", waterRequirement: "Heavy irrigation" }
    ],
    weed: [
      "Spray Atrazine 50% WP @ 1 kg/acre as pre-emergence herbicide 3 days after planting.",
      "Manual weeding at 45 and 90 days after planting before earthing up."
    ],
    pest: [
      { problem: "Early Shoot Borer", solution: "Apply Chlorantraniliprole 0.4% GR @ 7.5 kg/acre in soil at planting or spray Coragen." },
      { problem: "Woolly Aphid / Whitefly", solution: "Release Dipha aphidivora predators or spray Acephate 75% SP @ 2g/L water." }
    ],
    equipment: [
      { name: "Tractor with Ridger", purpose: "Forming deep furrows for sett placement", estimatedRent: "₹1,400 / hour" },
      { name: "Sugarcane Drip System", purpose: "Micro-irrigation and fertigation", estimatedRent: "₹5,000 / season setup" },
      { name: "Sugarcane Harvester / Cutters", purpose: "Cane cutting and leaf detrashing", estimatedRent: "₹350 / tonne" }
    ],
    labour: [
      { activity: "Sett Cutting, Treatment & Planting", workers: "8 workers", days: "2 days" },
      { activity: "Earthing Up & Leaf Detrashing", workers: "6 workers", days: "3 days" },
      { activity: "Cane Harvesting & Loading", workers: "10 workers", days: "4 days" }
    ],
    precautions: [
      "Treat setts with fungicide to prevent red rot infection in early stage.",
      "Stop heavy nitrogenous fertilization 3 months before harvest to ensure sugar accumulation."
    ],
    tips: [
      "Adopt drip irrigation to save 40% water and increase cane yield by 25%.",
      "Intercrop with short duration legumes (Moong / Chana) in first 60 days."
    ]
  },

  cotton: {
    cropName: "Cotton",
    cropDuration: "5 - 6 Months",
    bestSeason: "Kharif (June - November)",
    yieldPerAcre: 12,
    yieldUnit: "Quintals",
    landPrep: [
      "Deep summer ploughing to destroy hibernating pests and weed seeds.",
      "Apply 5 tonnes of well-composted FYM per acre.",
      "Prepare ridges and beds for dibbling Bt cotton seeds."
    ],
    seed: {
      variety: "RCH-650 BG II / Bollgard II Hybrid / Ajit-155",
      baseSeedQtyKgPerAcre: 1.5,
      seedQtyUnit: "kg",
      costPerAcre: 1700
    },
    timeline: [
      { week: "1", title: "Land Preparation & Ridge Formation", description: "Summer ploughing, FYM incorporation, and ridge making at 3.5ft distance." },
      { week: "2", title: "Dibbling Sowing & Gap Filling", description: "Dibble seeds at 2 cm depth with 90x60 cm spacing and light watering." },
      { week: "5", title: "First Thinning & Weeding", description: "Retain one healthy seedling per hill and perform inter-cultivation." },
      { week: "9", title: "Square Formation & Top Dressing", description: "Apply 2nd dose of Nitrogen and spray Boron for flower retention." },
      { week: "14", title: "Peak Flowering & Boll Development", description: "Monitor for Pink Bollworm using pheromone traps; maintain moisture." },
      { week: "18", title: "Boll Opening & 1st Picking", description: "Hand pick clean fully-burst white cotton bolls in dry morning hours." },
      { week: "22", title: "Final Picking & Stalk Removal", description: "Complete final picking and shred cotton stalks using tractor shredder." }
    ],
    fertilizer: [
      { stage: "Basal Application", fertilizer: "DAP + Potash + Neem Cake", quantity: "50 kg DAP + 30 kg Potash + 100 kg Neem Cake per acre", time: "At sowing" },
      { stage: "30 Days (Vegetative)", fertilizer: "Urea", quantity: "35 kg Urea per acre", time: "30 DAS" },
      { stage: "60 Days (Square stage)", fertilizer: "Urea + 13:0:45 KNO3", quantity: "35 kg Urea + 2 kg KNO3 spray per acre", time: "60 DAS" }
    ],
    irrigation: [
      { stage: "Germination to Square Stage", frequency: "Every 12-15 days", waterRequirement: "Light irrigation" },
      { stage: "Flowering & Boll Formation", frequency: "Every 8-10 days", waterRequirement: "Critical moisture required" }
    ],
    weed: [
      "Spray Quizalofop-p-ethyl 5% EC @ 400 ml/acre for grass weed control at 25 DAS.",
      "Inter-cultivation with bullock or tractor blade hoe twice at 30 and 50 DAS."
    ],
    pest: [
      { problem: "Pink Bollworm / American Bollworm", solution: "Install 5 Pheromone traps/acre; spray Emamectin Benzoate 5% SG @ 80g/acre." },
      { problem: "Sucking Pests (Jassids/Thrips/Whitefly)", solution: "Spray Flonicamid 50% WG @ 60g/acre or Diafenthiuron 50% WP @ 250g/acre." }
    ],
    equipment: [
      { name: "Tractor with Blade Hoe / Weeder", purpose: "Inter-cultivation between cotton rows", estimatedRent: "₹900 / acre" },
      { name: "Knapsack Power Sprayer", purpose: "Foliar spray of insecticides and nutrients", estimatedRent: "₹400 / day" }
    ],
    labour: [
      { activity: "Dibbling Sowing & Gap Filling", workers: "4 workers", days: "1 day" },
      { activity: "Weeding & Inter-cultivation", workers: "4 workers", days: "2 days" },
      { activity: "Cotton Picking (Multiple Passes)", workers: "6 workers", days: "5 days" }
    ],
    precautions: [
      "Do not spray broad-spectrum pyrethroids early in season to preserve beneficial predators.",
      "Pick cotton only after dew has evaporated to preserve lint quality and avoid staining."
    ],
    tips: [
      "Plant 2 rows of Non-Bt refugee seeds around perimeter to manage pest resistance.",
      "Spray 1% Magnesium Sulphate at 60 & 90 DAS to prevent leaf reddening."
    ]
  },

  rice: {
    cropName: "Rice / Paddy",
    cropDuration: "4 - 5 Months",
    bestSeason: "Kharif (June - October)",
    yieldPerAcre: 25,
    yieldUnit: "Quintals",
    landPrep: [
      "Puddling the field 2-3 times in standing water using tractor disc harrow.",
      "Level field meticulously with laser leveller for uniform 2-5 cm standing water.",
      "Incorporate 5 tonnes of FYM or green manure (Dhaincha) into puddle."
    ],
    seed: {
      variety: "MTU-1010 / Swarna Sub-1 / PR-126 / Pusa Basmati 1509",
      baseSeedQtyKgPerAcre: 15,
      seedQtyUnit: "kg",
      costPerAcre: 1200
    },
    timeline: [
      { week: "1", title: "Nursery Bed Preparation & Sowing", description: "Prepare raised nursery beds, treat seeds with Carbendazim, and sow." },
      { week: "3", title: "Field Puddling & Levelling", description: "Puddle main field in 5 cm water and incorporate basal fertilizers." },
      { week: "4", title: "Transplanting Seedlings", description: "Transplant 21-25 day old seedlings @ 2-3 seedlings per hill at 20x15 cm." },
      { week: "7", title: "Active Tillering & 1st Top Dressing", description: "Apply Urea (40 kg/acre) and Zinc Sulphate; maintain 2-3 cm water." },
      { week: "10", title: "Panicle Initiation Stage", description: "Top dress Nitrogen & Potash; monitor for Stem Borer or Blast disease." },
      { week: "14", title: "Milking & Grain Filling Phase", description: "Keep soil saturated; spray 0:0:50 for grain weight improvement." },
      { week: "17", title: "Field Drainage & Harvesting", description: "Drain out standing water 10 days before harvesting when 85% grains turn yellow." }
    ],
    fertilizer: [
      { stage: "Basal Puddling", fertilizer: "SSP + MOP + Zinc Sulphate", quantity: "100 kg SSP + 30 kg MOP + 10 kg Zinc per acre", time: "Before transplanting" },
      { stage: "Tillering Stage (21 DAT)", fertilizer: "Urea", quantity: "40 kg Urea per acre", time: "21 days after transplanting" },
      { stage: "Panicle Initiation (45 DAT)", fertilizer: "Urea + Potash", quantity: "40 kg Urea + 15 kg MOP per acre", time: "45 days after transplanting" }
    ],
    irrigation: [
      { stage: "Transplanting to Rooting", frequency: "Continuous shallow water", waterRequirement: "2-5 cm standing water" },
      { stage: "Tillering Phase", frequency: "Alternate wetting and drying (AWD)", waterRequirement: "Keep soil saturated" },
      { stage: "Flowering & Grain Filling", frequency: "Maintain thin water layer", waterRequirement: "2-3 cm standing water" }
    ],
    weed: [
      "Spray Pretilachlor 50% EC @ 600 ml/acre within 3 days of transplanting in standing water.",
      "Use Cono-weeder or manual weeding at 20 and 40 days after transplanting."
    ],
    pest: [
      { problem: "Yellow Stem Borer / Leaf Folder", solution: "Apply Cartap Hydrochloride 4% Granules @ 8 kg/acre or spray Chlorantraniliprole 18.5% SC @ 60ml/acre." },
      { problem: "Brown Plant Hopper (BPH) / Blast", solution: "Spray Pymetrozine 50% WG @ 120g/acre for BPH or Tricyclazole 75% WP @ 120g/acre for Blast." }
    ],
    equipment: [
      { name: "Puddler Tractor", purpose: "Wet land puddling and soil churn", estimatedRent: "₹1,300 / hour" },
      { name: "Paddy Transplanter (Optional)", purpose: "Mechanical transplanting in mat nursery", estimatedRent: "₹1,500 / acre" },
      { name: "Combine Harvester (Track type)", purpose: "Harvesting wet field paddy", estimatedRent: "₹2,500 / hour" }
    ],
    labour: [
      { activity: "Nursery Preparation & Pulling Seedlings", workers: "4 workers", days: "1 day" },
      { activity: "Manual Paddy Transplanting", workers: "8 workers", days: "1 day" },
      { activity: "Weeding & Fertilizer Application", workers: "4 workers", days: "2 days" }
    ],
    precautions: [
      "Do not keep deep standing water (> 5 cm) during early tillering as it inhibits tiller count.",
      "Drain water periodically (Alternate Wetting and Drying) to improve root aeration and reduce methane."
    ],
    tips: [
      "Apply Zinc Sulphate to basal soil to prevent Khaira disease.",
      "Grow Azolla or green manure Dhaincha prior to puddling to save 25% Nitrogen fertilizer."
    ]
  },

  maize: {
    cropName: "Maize",
    cropDuration: "3.5 - 4 Months",
    bestSeason: "Kharif / Rabi / Spring",
    yieldPerAcre: 28,
    yieldUnit: "Quintals",
    landPrep: [
      "Plough the land twice with disc harrow and level properly.",
      "Apply 5 tonnes FYM per acre during land preparation.",
      "Make ridges and furrows at 60 cm row distance."
    ],
    seed: {
      variety: "Pioneer P3396 / Dekalb 9108 / Bio-9681",
      baseSeedQtyKgPerAcre: 8,
      seedQtyUnit: "kg",
      costPerAcre: 2200
    },
    timeline: [
      { week: "1", title: "Land Prep & Seed Treatment", description: "Plough, apply FYM, treat seeds with Imidacloprid + Thiram." },
      { week: "2", title: "Sowing on Ridges", description: "Sow seeds 4-5 cm deep on side of ridges at 60x20 cm spacing." },
      { week: "4", title: "Knee-High Stage & 1st Top Dressing", description: "Apply Urea (40 kg/acre) and perform 1st earthing up." },
      { week: "7", title: "Tasseling Stage & Fall Armyworm Check", description: "Check whorls for Fall Armyworm larvae; maintain field moisture." },
      { week: "10", title: "Silking & Cob Formation", description: "Critical moisture stage; apply final Potash & Urea top dressing." },
      { week: "13", title: "Grain Maturity & Husking", description: "Grains turn hard and cob sheath dries from green to straw yellow." }
    ],
    fertilizer: [
      { stage: "Basal Dose", fertilizer: "DAP + Potash + Zinc", quantity: "50 kg DAP + 25 kg MOP + 10 kg Zinc per acre", time: "At sowing" },
      { stage: "Knee-High Stage (25-30 DAS)", fertilizer: "Urea", quantity: "45 kg Urea per acre", time: "25-30 DAS" },
      { stage: "Tasseling Stage (50-55 DAS)", fertilizer: "Urea", quantity: "35 kg Urea per acre", time: "50-55 DAS" }
    ],
    irrigation: [
      { stage: "Vegetative Phase", frequency: "Every 10-12 days", waterRequirement: "Moderate irrigation" },
      { stage: "Tasseling & Silking Stage", frequency: "Every 6-8 days", waterRequirement: "Critical uninterrupted moisture" }
    ],
    weed: [
      "Spray Atrazine 50% WP @ 500g/acre as pre-emergence within 2 days of sowing.",
      "Spray Tembotrion 34.4% SC @ 115 ml/acre with surfactant at 15-20 DAS for mixed weeds."
    ],
    pest: [
      { problem: "Fall Armyworm (FAW)", solution: "Apply Emamectin Benzoate 5% SG @ 80g/acre or Spinetoram 11.7% SC @ 100ml/acre directly into leaf whorls." },
      { problem: "Stem Borer", solution: "Apply Carbofuran 3G granules @ 5 kg/acre in central leaf whorl." }
    ],
    equipment: [
      { name: "Tractor with Ridger & Planter", purpose: "Ridge sowing and fertilizer placement", estimatedRent: "₹1,100 / hour" },
      { name: "Maize Thresher / Sheller", purpose: "Cob shelling and seed separation", estimatedRent: "₹1,000 / hour" }
    ],
    labour: [
      { activity: "Ridge Sowing & Seed Placement", workers: "3 workers", days: "1 day" },
      { activity: "Earthing Up & Whorl Application", workers: "3 workers", days: "2 days" },
      { activity: "Cob Harvesting & De-husking", workers: "5 workers", days: "3 days" }
    ],
    precautions: [
      "Maize is highly sensitive to waterlogging; ensure ridges allow quick field drainage.",
      "Check central whorls weekly from 15 DAS for Fall Armyworm pin-hole symptoms."
    ],
    tips: [
      "Maintain exact plant population of 30,000 plants per acre for highest cob yield.",
      "Spray 1% NPK 19:19:19 during early vegetative stage for rapid root growth."
    ]
  },

  soybean: {
    cropName: "Soybean",
    cropDuration: "3 - 3.5 Months",
    bestSeason: "Kharif (June - September)",
    yieldPerAcre: 10,
    yieldUnit: "Quintals",
    landPrep: [
      "Deep ploughing followed by 2 harrowings to prepare fine seed bed.",
      "Apply 3-4 tonnes FYM per acre along with Rhizobium inoculant."
    ],
    seed: {
      variety: "JS 335 / JS 9560 / JS 20-34 / NRC 37",
      baseSeedQtyKgPerAcre: 30,
      seedQtyUnit: "kg",
      costPerAcre: 2400
    },
    timeline: [
      { week: "1", title: "Land Prep & Seed Bio-Treatment", description: "Treat seeds with Rhizobium + PSB culture @ 10g/kg and sow at 45x5 cm." },
      { week: "3", title: "Germination & 1st Weeding", description: "Inspect plant stand; apply post-emergence weedicide at 15-20 DAS." },
      { week: "6", title: "Flowering Stage & NPK Spray", description: "Spray 19:19:19 NPK (1kg/acre); monitor for Stem Fly and Semilooper caterpillar." },
      { week: "9", title: "Pod Formation & Filling", description: "Ensure adequate soil moisture during pod filling; spray Boron." },
      { week: "12", title: "Pod Maturity & Harvest", description: "Harvest when 95% leaves turn yellow and drop and pods turn golden brown." }
    ],
    fertilizer: [
      { stage: "Basal Application", fertilizer: "DAP + Single Super Phosphate + Sulphur", quantity: "40 kg DAP + 50 kg SSP + 10 kg Bentonite Sulphur per acre", time: "At sowing" }
    ],
    irrigation: [
      { stage: "Rainfed / Supplementary", frequency: "Dependant on monsoon", waterRequirement: "Provide protective irrigation during dry spells at flowering & pod filling." }
    ],
    weed: [
      "Spray Imazethapyr 10% SL @ 400 ml/acre at 15-20 DAS when weeds are in 2-3 leaf stage."
    ],
    pest: [
      { problem: "Girdle Beetle / Stem Fly", solution: "Spray Chlorantraniliprole 18.5% SC @ 60 ml/acre or Thiamethoxam + Lambda-cyhalothrin." },
      { problem: "Tobacco Caterpillar / Spodoptera", solution: "Spray Novaluron 10% EC @ 300 ml/acre or Emamectin Benzoate." }
    ],
    equipment: [
      { name: "Tractor with Seed Drill", purpose: "Line sowing at 45 cm distance", estimatedRent: "₹850 / acre" },
      { name: "Multi-crop Thresher", purpose: "Pods threshing and seed cleaning", estimatedRent: "₹1,200 / hour" }
    ],
    labour: [
      { activity: "Seed Inoculation & Sowing", workers: "2 workers", days: "1 day" },
      { activity: "Weedicide & Insecticide Spraying", workers: "2 workers", days: "2 days" },
      { activity: "Crop Harvesting & Bundling", workers: "5 workers", days: "2 days" }
    ],
    precautions: [
      "Do not sow seeds deeper than 3-4 cm as deep sowing reduces germination percent.",
      "Soybean is a leguminous crop; avoid excess Nitrogen application."
    ],
    tips: [
      "Inoculate seed with Bradyrhizobium japonicum to fix up to 40 kg natural atmospheric Nitrogen.",
      "Sow across slope (contour farming) to prevent topsoil erosion during heavy rains."
    ]
  },

  groundnut: {
    cropName: "Groundnut",
    cropDuration: "3.5 - 4 Months",
    bestSeason: "Kharif / Summer",
    yieldPerAcre: 12,
    yieldUnit: "Quintals",
    landPrep: [
      "Plough land 2-3 times to loosen soil up to 20 cm for easy pod pegging.",
      "Apply 4 tonnes FYM per acre and level thoroughly."
    ],
    seed: {
      variety: "TAG 24 / JL 24 / TG 37A / Kadiri 6",
      baseSeedQtyKgPerAcre: 45,
      seedQtyUnit: "kg",
      costPerAcre: 4500
    },
    timeline: [
      { week: "1", title: "Land Prep & Seed Kernel Treatment", description: "Treat kernels with Trichoderma viride @ 10g/kg and sow at 30x10 cm." },
      { week: "3", title: "Vegetative Phase & Inter-cultivation", description: "Hoeing to loosen soil before peg initiation." },
      { week: "6", title: "Pegging Stage & Gypsum Application", description: "Apply 200 kg Gypsum/acre near root zone; DO NOT disturb soil after pegging." },
      { week: "10", title: "Pod Development Phase", description: "Maintain soil moisture for shell filling; inspect for Tikka leaf spot." },
      { week: "14", title: "Harvesting & Pod Drying", description: "Uproot plants when inner pod shell turns dark brown; dry pods in sun." }
    ],
    fertilizer: [
      { stage: "Basal Dose", fertilizer: "DAP + MOP + Gypsum", quantity: "35 kg DAP + 25 kg MOP + 100 kg Gypsum at sowing", time: "At sowing" },
      { stage: "Pegging Stage (40-45 DAS)", fertilizer: "Gypsum", quantity: "150 kg Gypsum per acre broadcast near root zone", time: "At 40 DAS" }
    ],
    irrigation: [
      { stage: "Flowering & Pegging (Critical)", frequency: "Every 8-10 days", waterRequirement: "Adequate moisture essential for peg penetration into soil" }
    ],
    weed: [
      "Spray Oxyfluorfen 23.5% EC @ 200 ml/acre as pre-emergence within 2 days of sowing."
    ],
    pest: [
      { problem: "Tikka Leaf Spot / Rust", solution: "Spray Mancozeb 75% WP @ 400g + Carbendazim @ 100g in 200L water." },
      { problem: "White Grub / Root Borer", solution: "Apply Phorate 10G or Imidacloprid seed treatment to protect roots." }
    ],
    equipment: [
      { name: "Tractor with Cultivator", purpose: "Fine tilth creation for pod growth", estimatedRent: "₹900 / hour" },
      { name: "Groundnut Digger & Thresher", purpose: "Uprooting plants and pod stripping", estimatedRent: "₹1,500 / hour" }
    ],
    labour: [
      { activity: "Kernel Shelling & Dibbling Sowing", workers: "4 workers", days: "1 day" },
      { activity: "Gypsum Application & Weeding", workers: "3 workers", days: "2 days" },
      { activity: "Uprooting Plants & Pod Stripping", workers: "6 workers", days: "3 days" }
    ],
    precautions: [
      "Never disturb soil after peg initiation (45 DAS) as hoeing breaks developing pods.",
      "Ensure proper sun-drying of pods to below 8% moisture to prevent Aflatoxin fungus."
    ],
    tips: [
      "Gypsum application at 40 DAS supplies essential Calcium for pod pod-filling and reduces pops (empty shells).",
      "Use sprinkler irrigation to prevent soil crusting."
    ]
  },

  tomato: {
    cropName: "Tomato",
    cropDuration: "4 - 5 Months",
    bestSeason: "Rabi / Kharif / Summer",
    yieldPerAcre: 200,
    yieldUnit: "Quintals",
    landPrep: [
      "Deep ploughing followed by 3 rotavator passes to create raised beds of 90 cm width.",
      "Apply 8-10 tonnes FYM + 100 kg Neem cake per acre into beds.",
      "Lay 25-micron silver-black mulching film and drip lateral lines."
    ],
    seed: {
      variety: "Abhinav (Syngenta) / US-1505 / Lakshmi / Heemsohna",
      baseSeedQtyKgPerAcre: 0.05,
      seedQtyUnit: "grams",
      costPerAcre: 3500
    },
    timeline: [
      { week: "1", title: "Nursery Sowing in Pro-trays", description: "Sow hybrid seeds in coco-peat filled pro-trays under shade net." },
      { week: "4", title: "Bed Preparation & Drip Mulching", description: "Form raised beds, install drip tape, layout mulch paper, and punch holes." },
      { week: "5", title: "Transplanting & Seedling Drenching", description: "Transplant 25-30 day seedlings at 60x45 cm spacing and drench with Humic acid." },
      { week: "8", title: "Staking & Trellising", description: "Erect bamboo poles and tie tomato plants with jute twine for support." },
      { week: "12", title: "Flowering, Fruit Set & Fertigation", description: "Fertigate with 12:61:0 & Micronutrients; spray Planofix for flower retention." },
      { week: "16", title: "First Fruit Picking & Grading", description: "Harvest firm red-ripe fruits every 3 days; sort and pack in crates." }
    ],
    fertilizer: [
      { stage: "Basal Bed Mixture", fertilizer: "10:26:26 NPK + Micronutrients", quantity: "100 kg NPK + 10 kg Boron & Zinc per acre", time: "Before laying mulch" },
      { stage: "Drip Fertigation (Weekly)", fertilizer: "19:19:19 / 0:52:34 / 13:0:45", quantity: "3-5 kg per fertigation cycle", time: "Every 4-5 days via drip" }
    ],
    irrigation: [
      { stage: "Drip Irrigation System", frequency: "Daily 1-2 hours depending on heat", waterRequirement: "Maintain soil field capacity under mulch" }
    ],
    weed: [
      "Plastic mulching film (25 micron) suppresses 95% weed growth on raised beds.",
      "Manual weeding in inter-bed pathways every 25 days."
    ],
    pest: [
      { problem: "Early / Late Blight & Leaf Curl Virus", solution: "Spray Copper Oxychloride 3g/L + Streptocycline 0.2g/L or Dimethomorph for blight." },
      { problem: "Fruit Borer / Tuta Absoluta", solution: "Spray Chlorantraniliprole 18.5% SC @ 60 ml/acre or Spinetoram @ 100ml/acre." }
    ],
    equipment: [
      { name: "Tractor with Bed Maker", purpose: "Forming 90 cm raised beds", estimatedRent: "₹1,200 / hour" },
      { name: "Drip & Fertigation Unit", purpose: "Precision water and soluble fertilizer delivery", estimatedRent: "₹6,000 / setup" }
    ],
    labour: [
      { activity: "Nursery Management & Pro-tray Sowing", workers: "2 workers", days: "2 days" },
      { activity: "Transplanting, Mulching & Staking", workers: "6 workers", days: "3 days" },
      { activity: "Fruit Picking & Sorting (Multiple Picks)", workers: "5 workers", days: "8 days" }
    ],
    precautions: [
      "Staking with bamboo poles is mandatory for indeterminate hybrids to avoid soil-borne fruit rot.",
      "Avoid excess overhead watering during flowering to prevent blossom drop."
    ],
    tips: [
      "Use silver-black reflective mulch paper to deter thrips & whitefly vectoring leaf curl virus.",
      "Spray Calcium Nitrate @ 5g/L to prevent Blossom End Rot (black spot on fruit bottom)."
    ]
  },

  onion: {
    cropName: "Onion",
    cropDuration: "4 - 5 Months",
    bestSeason: "Rabi / Late Kharif",
    yieldPerAcre: 140,
    yieldUnit: "Quintals",
    landPrep: [
      "Plough land 3 times to get fine pulverized soil.",
      "Apply 6-8 tonnes FYM + 50 kg Neem cake per acre.",
      "Form flat beds or broad beds (BBF) of 1.2 meter width."
    ],
    seed: {
      variety: "N-53 / Bhima Super / Agrifound Dark Red / Bhima Shakti",
      baseSeedQtyKgPerAcre: 4,
      seedQtyUnit: "kg",
      costPerAcre: 3000
    },
    timeline: [
      { week: "1", title: "Nursery Bed Sowing", description: "Sow seeds in raised nursery beds @ 4 kg/acre; cover with paddy straw." },
      { week: "7", title: "Field Prep & Transplanting", description: "Transplant 45-50 day old seedlings at 15x10 cm spacing in flat beds." },
      { week: "10", title: "Vegetative Growth & 1st Weeding", description: "Apply split dose of Nitrogen and spray Oxyfluorfen for weeds." },
      { week: "14", title: "Bulb Initiation & Development", description: "Apply Potash and Sulphur; maintain shallow irrigation." },
      { week: "18", title: "Neck Fall Stage & Harvest", description: "Stop irrigation when 50% neck fall occurs; harvest bulbs and cure in field shade." }
    ],
    fertilizer: [
      { stage: "Basal Application", fertilizer: "DAP + MOP + Elemental Sulphur", quantity: "50 kg DAP + 40 kg MOP + 20 kg Elemental Sulphur per acre", time: "At transplanting" },
      { stage: "Top Dressing 1 (30 DAT)", fertilizer: "Urea", quantity: "40 kg Urea per acre", time: "30 days after transplanting" },
      { stage: "Top Dressing 2 (45 DAT)", fertilizer: "Urea + Potash", quantity: "30 kg Urea + 20 kg MOP per acre", time: "45 days after transplanting" }
    ],
    irrigation: [
      { stage: "Transplanting to Establishment", frequency: "Light watering every 5-7 days", waterRequirement: "Shallow root zone wetting" },
      { stage: "Bulb Enlargement Stage", frequency: "Every 8-10 days", waterRequirement: "Regular moisture without waterlogging" }
    ],
    weed: [
      "Spray Oxyfluorfen 23.5% EC @ 150 ml/acre at 15-20 days after transplanting.",
      "Manual hand weeding at 30 and 50 DAT."
    ],
    pest: [
      { problem: "Thrips (Silvering of leaves)", solution: "Spray Fipronil 5% SC @ 2 ml/L or Spinetoram 11.7% SC @ 1 ml/L with sticker." },
      { problem: "Purple Blotch / Stemphylium Blight", solution: "Spray Tebuconazole + Trifloxystrobin @ 0.7g/L or Mancozeb @ 2.5g/L." }
    ],
    equipment: [
      { name: "Tractor with Rotavator", purpose: "Finely pulverized soil bed creation", estimatedRent: "₹1,100 / hour" },
      { name: "Sprayer with Boom nozzle", purpose: "Coverage of small thrips under leaf sheaths", estimatedRent: "₹500 / day" }
    ],
    labour: [
      { activity: "Nursery Management & Seedling Pulling", workers: "3 workers", days: "2 days" },
      { activity: "Manual Seedling Transplanting", workers: "10 workers", days: "1 day" },
      { activity: "Bulb Harvesting, Detop & Curing", workers: "8 workers", days: "3 days" }
    ],
    precautions: [
      "Sulphur application (20 kg/acre) is essential for onion pungency, bulb size, and storage life.",
      "Stop irrigation 10-15 days prior to harvest to prevent rotting during storage."
    ],
    tips: [
      "Perform field curing under shade for 5-7 days after harvest to dry outer bulb skins.",
      "Avoid excess Nitrogen after 60 DAT as it leads to thick necks and poor storage quality."
    ]
  },

  potato: {
    cropName: "Potato",
    cropDuration: "3.5 - 4 Months",
    bestSeason: "Rabi (October - February)",
    yieldPerAcre: 120,
    yieldUnit: "Quintals",
    landPrep: [
      "Deep ploughing up to 25 cm followed by 3 harrowings to make soil loose and friable.",
      "Apply 6-8 tonnes well-composted FYM per acre.",
      "Make furrows and ridges at 60 cm distance."
    ],
    seed: {
      variety: "Kufri Pukhraj / Kufri Jyoti / Kufri Bahar / Chipsona",
      baseSeedQtyKgPerAcre: 1000,
      seedQtyUnit: "kg (Seed Tubers)",
      costPerAcre: 18000
    },
    timeline: [
      { week: "1", title: "Tuber Treatment & Planting", description: "Treat well-sprouted seed tubers with Mancozeb and plant at 60x20 cm." },
      { week: "4", title: "Emergence & 1st Earthing Up", description: "Perform earthing up to cover developing shoots with loose soil." },
      { week: "7", title: "Tuber Initiation & Top Dressing", description: "Top dress Urea and perform 2nd deep earthing up." },
      { week: "11", title: "Tuber Enlargement & Blight Watch", description: "Maintain soil moisture; spray preventive Mancozeb against Late Blight." },
      { week: "14", title: "Haulm Cutting (De-topping)", description: "Cut green vines 10-12 days before digging to harden tuber skin." },
      { week: "16", title: "Tuber Digging & Sorting", description: "Dig tubers with tractor potato digger; sort by size and store." }
    ],
    fertilizer: [
      { stage: "Basal Furrow Application", fertilizer: "DAP + MOP + Neem Cake", quantity: "75 kg DAP + 50 kg MOP + 100 kg Neem Cake per acre", time: "At planting in furrows" },
      { stage: "Earthing Up (30 DAS)", fertilizer: "Urea", quantity: "50 kg Urea per acre", time: "30 days after planting" }
    ],
    irrigation: [
      { stage: "Sprouting Phase", frequency: "Light irrigation", waterRequirement: "Moist ridges without touching tuber top" },
      { stage: "Tuberization Phase", frequency: "Every 7-10 days", waterRequirement: "Regular light furrow irrigation" }
    ],
    weed: [
      "Spray Metribuzin 70% WP @ 200g/acre as pre-emergence within 3 days of planting."
    ],
    pest: [
      { problem: "Late Blight (Phytophthora)", solution: "Spray Cymoxanil + Mancozeb @ 600g/acre or Dimethomorph @ 400g/acre immediately." },
      { problem: "Aphids / Potato Tuber Moth", solution: "Spray Imidacloprid 17.8% SL @ 60 ml/acre to keep vectors away." }
    ],
    equipment: [
      { name: "Tractor with Potato Planter & Ridger", purpose: "Automated tuber planting and ridge formation", estimatedRent: "₹1,500 / hour" },
      { name: "Potato Digger Machine", purpose: "Uprooting tubers without mechanical cuts", estimatedRent: "₹1,400 / hour" }
    ],
    labour: [
      { activity: "Seed Tuber Cutting & Planting", workers: "5 workers", days: "2 days" },
      { activity: "Earthing Up & Weeding", workers: "4 workers", days: "2 days" },
      { activity: "Tuber Picking, Sorting & Bagging", workers: "8 workers", days: "3 days" }
    ],
    precautions: [
      "Proper earthing up is critical to prevent tubers from greening due to sunlight exposure (Solanine synthesis).",
      "Perform haulm cutting (de-topping) 10 days before digging to prevent tuber skin peeling during transit."
    ],
    tips: [
      "Use disease-free certified seed tubers weighing 30-40 grams each with 2-3 active eyes.",
      "Never irrigate field 10 days before harvesting."
    ]
  }
};

const formatting = {
  yieldFormat: (min, max, unit, acres) => `${min} - ${max} ${unit} (Total for ${acres} Acre${acres > 1 ? "s" : ""})`,
  workersFormat: (n) => `${n} worker${n > 1 ? "s" : ""}`,
  daysFormat: (d) => `${d} day${d > 1 ? "s" : ""}`,
  units: {
    quintals: "Quintals",
    tonnes: "Tonnes",
    kg: "kg",
    grams: "grams",
    setts: "setts"
  },
  defaults: {
    state: "Maharashtra",
    district: "Ahmednagar",
    soilType: "Black Soil",
    waterSource: "Borewell",
    activity: "Field Work",
    equipmentName: "Tractor",
    equipmentPurpose: "Field Operations"
  }
};

module.exports = { crops, formatting };
