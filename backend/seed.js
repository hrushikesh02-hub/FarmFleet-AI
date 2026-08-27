const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const Farmer = require("./models/Farmer");
const Owner = require("./models/Owner");
const Equipment = require("./models/Equipment");
const Labour = require("./models/Labour");
const CropItinerary = require("./models/CropItinerary");

const { generateFallbackItinerary } = require("./services/ai/fallbackEngine");
const { generateSchedule } = require("./services/weather/dateScheduler");

async function seedData() {
  try {
    console.log("🌱 Database seeding started...");

    // Clean up all existing collections to ensure zero stale/stray data
    await Farmer.deleteMany({});
    await Owner.deleteMany({});
    await Labour.deleteMany({});
    await Equipment.deleteMany({});
    await CropItinerary.deleteMany({});

    // 1. Seed Farmers
    console.log("👤 Seeding Farmers...");
    const hashedPassword = await bcrypt.hash("password123", 10);
    
    const farmer1 = await Farmer.create({
      fullName: "Raju Shinde",
      mobile: "9876543210",
      email: "farmer@farmfleet.com",
      password: hashedPassword,
      village: "Karanji",
      district: "Ahmednagar",
      state: "Maharashtra",
      preferredLanguage: "en"
    });

    const farmer2 = await Farmer.create({
      fullName: "Amit Patil",
      mobile: "9876543211",
      email: "farmer2@farmfleet.com",
      password: hashedPassword,
      village: "Hadapsar",
      district: "Pune",
      state: "Maharashtra",
      preferredLanguage: "en"
    });

    // 2. Seed Equipment Owners
    console.log("🏢 Seeding Equipment Owners...");
    const owner1 = await Owner.create({
      fullName: "Ramesh Pawar",
      mobile: "9876543220",
      email: "ramesh@owner.com",
      password: hashedPassword,
      village: "Rahuri",
      district: "Ahmednagar",
      state: "Maharashtra",
      rating: 4.8,
      totalReviews: 12
    });

    const owner2 = await Owner.create({
      fullName: "Vijay Patil",
      mobile: "9876543221",
      email: "vijay@owner.com",
      password: hashedPassword,
      village: "Ambegaon",
      district: "Pune",
      state: "Maharashtra",
      rating: 4.7,
      totalReviews: 8
    });

    const owner3 = await Owner.create({
      fullName: "Prakash Deshmukh",
      mobile: "9876543222",
      email: "prakash@owner.com",
      password: hashedPassword,
      village: "Pimpalgaon",
      district: "Nashik",
      state: "Maharashtra",
      rating: 4.9,
      totalReviews: 15
    });

    // 3. Seed Equipment Listings
    console.log("🚜 Seeding Equipment Listings...");

    await Equipment.create([
      {
        owner: owner1._id,
        name: "Mahindra 575 DI Tractor",
        type: "Tractor",
        pricePerAcre: 800,
        pricePerDay: 5000,
        pricePerHour: 800,
        pricingType: "both",
        location: "Rahuri, Ahmednagar, Maharashtra",
        operatorIncluded: true,
        image: "https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0?w=800&auto=format&fit=crop&q=80",
        status: "Active"
      },
      {
        owner: owner1._id,
        name: "Shaktiman Rotavator",
        type: "Rotavator",
        pricePerAcre: 600,
        pricePerDay: 2500,
        pricePerHour: 400,
        pricingType: "both",
        location: "Rahuri, Ahmednagar, Maharashtra",
        operatorIncluded: false,
        image: "https://images.unsplash.com/photo-1589923188900-85dae523342b?w=800&auto=format&fit=crop&q=80",
        status: "Active"
      },
      {
        owner: owner2._id,
        name: "Fieldking Cultivator",
        type: "Cultivator",
        pricePerAcre: 500,
        pricePerDay: 2000,
        pricePerHour: 300,
        pricingType: "both",
        location: "Ambegaon, Pune, Maharashtra",
        operatorIncluded: false,
        image: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&auto=format&fit=crop&q=80",
        status: "Active"
      },
      {
        owner: owner2._id,
        name: "Seed Drill Machine",
        type: "Seeder",
        pricePerAcre: 550,
        pricePerDay: 2200,
        pricePerHour: 350,
        pricingType: "both",
        location: "Ambegaon, Pune, Maharashtra",
        operatorIncluded: true,
        image: "https://images.unsplash.com/photo-1594752834371-d68a2bf62013?w=800&auto=format&fit=crop&q=80",
        status: "Active"
      },
      {
        owner: owner3._id,
        name: "Kubota Combine Harvester",
        type: "Harvester",
        pricePerAcre: 2000,
        pricePerDay: 9000,
        pricePerHour: 1500,
        pricingType: "both",
        location: "Pimpalgaon, Nashik, Maharashtra",
        operatorIncluded: true,
        image: "https://images.unsplash.com/photo-1530906358829-e84b2769270f?w=800&auto=format&fit=crop&q=80",
        status: "Active"
      },
      {
        owner: owner3._id,
        name: "ASPEE Power Sprayer",
        type: "Sprayer",
        pricePerAcre: 350,
        pricePerDay: 1200,
        pricePerHour: 200,
        pricingType: "both",
        location: "Pimpalgaon, Nashik, Maharashtra",
        operatorIncluded: false,
        image: "https://images.unsplash.com/photo-1563514220747-6f73a388f8d6?w=800&auto=format&fit=crop&q=80",
        status: "Active"
      }
    ]);

    // 4. Seed Labour Profiles
    console.log("👨‍🌾 Seeding Labour Profiles...");
    await Labour.create([
      {
        fullName: "Suresh Patil",
        mobile: "9876543230",
        email: "suresh@labour.com",
        password: hashedPassword,
        village: "Khed",
        district: "Pune",
        state: "Maharashtra",
        primarySkill: "Sowing",
        experience: "5-10 Years",
        dailyCharges: 450,
        rating: 4.9,
        totalReviews: 24,
        completedJobs: 42,
        availability: "Available"
      },
      {
        fullName: "Sunita Shinde",
        mobile: "9876543231",
        email: "sunita@labour.com",
        password: hashedPassword,
        village: "Sangamner",
        district: "Ahmednagar",
        state: "Maharashtra",
        primarySkill: "Harvesting",
        experience: "10+ Years",
        dailyCharges: 400,
        rating: 4.85,
        totalReviews: 32,
        completedJobs: 60,
        availability: "Available"
      },
      {
        fullName: "Ganesh Jadhav",
        mobile: "9876543232",
        email: "ganesh@labour.com",
        password: hashedPassword,
        village: "Niphad",
        district: "Nashik",
        state: "Maharashtra",
        primarySkill: "Spraying",
        experience: "3-5 Years",
        dailyCharges: 500,
        rating: 4.8,
        totalReviews: 18,
        completedJobs: 28,
        availability: "Available"
      },
      {
        fullName: "Dnyaneshwar Pawar",
        mobile: "9876543233",
        email: "dnyaneshwar@labour.com",
        password: hashedPassword,
        village: "Baramati",
        district: "Pune",
        state: "Maharashtra",
        primarySkill: "Tillage",
        experience: "10+ Years",
        dailyCharges: 550,
        rating: 4.95,
        totalReviews: 45,
        completedJobs: 82,
        availability: "Available"
      }
    ]);

    console.log("🌾 Seeding Sample Crop Itineraries...");

    // Generate Wheat Plan using Fallback Engine
    const wheatPayload = generateFallbackItinerary({
      crop: "Wheat",
      state: "Maharashtra",
      district: "Ahmednagar",
      soilType: "Black Soil",
      landArea: "3",
      waterSource: "Canal",
      budget: "60000",
      language: "en"
    });
    const wheatTimeline = generateSchedule(
      wheatPayload.timeline.map((item) => ({ ...item, status: "Upcoming" })),
      new Date()
    );

    await CropItinerary.create({
      farmer: farmer1._id,
      language: "en",
      source: "fallback",
      crop: "Wheat",
      location: wheatPayload.location,
      soilType: wheatPayload.soilType,
      landArea: wheatPayload.landArea,
      waterSource: wheatPayload.waterSource,
      budget: "60000",
      cropDuration: wheatPayload.cropDuration,
      bestSeason: wheatPayload.bestSeason,
      expectedYield: wheatPayload.expectedYield,
      estimatedTotalCost: wheatPayload.estimatedTotalCost,
      estimatedIncome: wheatPayload.estimatedIncome,
      estimatedProfit: wheatPayload.estimatedProfit,
      aiSummary: {
        cropDuration: wheatPayload.cropDuration,
        expectedYield: wheatPayload.expectedYield,
        estimatedCost: wheatPayload.estimatedTotalCost,
        estimatedIncome: wheatPayload.estimatedIncome,
        estimatedProfit: wheatPayload.estimatedProfit,
        bestSowingSeason: wheatPayload.bestSeason,
        riskLevel: "Low Risk",
        source: "fallback",
      },
      timeline: wheatTimeline,
      landPreparation: wheatPayload.landPreparation,
      seedRecommendation: wheatPayload.seedRecommendation,
      fertilizerSchedule: wheatPayload.fertilizerSchedule,
      irrigationSchedule: wheatPayload.irrigationSchedule,
      weedManagement: wheatPayload.weedManagement,
      pestAndDiseaseManagement: wheatPayload.pestAndDiseaseManagement,
      equipmentRequired: wheatPayload.equipmentRequired,
      labourRequirement: wheatPayload.labourRequirement,
      precautions: wheatPayload.precautions,
      tips: wheatPayload.tips,
      aiResponse: wheatPayload
    });

    // Generate Sugarcane Plan using Fallback Engine
    const sugarcanePayload = generateFallbackItinerary({
      crop: "Sugarcane",
      state: "Maharashtra",
      district: "Ahmednagar",
      soilType: "Black Soil",
      landArea: "2",
      waterSource: "Borewell",
      budget: "100000",
      language: "en"
    });
    const sugarcaneTimeline = generateSchedule(
      sugarcanePayload.timeline.map((item) => ({ ...item, status: "Upcoming" })),
      new Date()
    );

    await CropItinerary.create({
      farmer: farmer1._id,
      language: "en",
      source: "fallback",
      crop: "Sugarcane",
      location: sugarcanePayload.location,
      soilType: sugarcanePayload.soilType,
      landArea: sugarcanePayload.landArea,
      waterSource: sugarcanePayload.waterSource,
      budget: "100000",
      cropDuration: sugarcanePayload.cropDuration,
      bestSeason: sugarcanePayload.bestSeason,
      expectedYield: sugarcanePayload.expectedYield,
      estimatedTotalCost: sugarcanePayload.estimatedTotalCost,
      estimatedIncome: sugarcanePayload.estimatedIncome,
      estimatedProfit: sugarcanePayload.estimatedProfit,
      aiSummary: {
        cropDuration: sugarcanePayload.cropDuration,
        expectedYield: sugarcanePayload.expectedYield,
        estimatedCost: sugarcanePayload.estimatedTotalCost,
        estimatedIncome: sugarcanePayload.estimatedIncome,
        estimatedProfit: sugarcanePayload.estimatedProfit,
        bestSowingSeason: sugarcanePayload.bestSeason,
        riskLevel: "Low Risk",
        source: "fallback",
      },
      timeline: sugarcaneTimeline,
      landPreparation: sugarcanePayload.landPreparation,
      seedRecommendation: sugarcanePayload.seedRecommendation,
      fertilizerSchedule: sugarcanePayload.fertilizerSchedule,
      irrigationSchedule: sugarcanePayload.irrigationSchedule,
      weedManagement: sugarcanePayload.weedManagement,
      pestAndDiseaseManagement: sugarcanePayload.pestAndDiseaseManagement,
      equipmentRequired: sugarcanePayload.equipmentRequired,
      labourRequirement: sugarcanePayload.labourRequirement,
      precautions: sugarcanePayload.precautions,
      tips: sugarcanePayload.tips,
      aiResponse: sugarcanePayload
    });

    console.log("✅ Database seeded successfully with mock data!");
  } catch (error) {
    console.error("❌ Database seeding failed:", error);
  }
}

module.exports = { seedData };
