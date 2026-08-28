import fs from "fs";
import path from "path";

const i18nDir = "c:/FarmFleet/src/i18n";

const translations = {
  en: {
    takeTour: "Take a Tour",
    next: "Next",
    back: "Back",
    skip: "Skip",
    last: "Finish",
    renterDashboard: {
      welcomeTitle: "Welcome to FarmFleet AI! 👋",
      welcomeContent: "Your command center for renting farm equipment and hiring skilled labor.",
      aiPlannerTitle: "AI Crop Planner ✨",
      aiPlannerContent: "Get smart crop itineraries, weather forecasts, and customized farming advice.",
      searchEquipmentTitle: "Find Machinery 🚜",
      searchEquipmentContent: "Search and book nearby tractors, harvesters, and tools with per-acre rates.",
      findLabourTitle: "Hire Farm Labour 👥",
      findLabourContent: "Find verified drivers, operators, and field workers near your village.",
      myBookingsTitle: "Track Your Bookings 📅",
      myBookingsContent: "View active rentals, schedule dates, and monitor booking status updates.",
      recommendedTitle: "Recommended Equipment ⭐",
      recommendedContent: "Explore top-rated machinery tailored for your current farming season."
    },
    ownerDashboard: {
      statsTitle: "Welcome Owner! 💰",
      statsContent: "Track your total revenue, equipment count, active rentals, and utilization rates.",
      earningsChartTitle: "Monthly Revenue Graph 📈",
      earningsChartContent: "Visualize month-over-month rental income and financial growth.",
      topEquipmentTitle: "Top Performing Machinery 🚜",
      topEquipmentContent: "See which of your machines generate the highest rental income.",
      equipmentUsageTitle: "Machine Operating Hours ⏱️",
      equipmentUsageContent: "Monitor active operating hours for maintenance schedules and productivity.",
      recentActivityTitle: "Real-Time Activity Feed ⚡",
      recentActivityContent: "Stay updated on recent booking requests and rental completions."
    },
    labourDashboard: {
      profileTitle: "Labour Profile & Skills 🧑‍🌾",
      profileContent: "View and manage your verified profile, daily rates, and primary skills.",
      statsTitle: "Job Statistics 📊",
      statsContent: "Track total jobs, pending requests, rating, and overall earnings.",
      earningsChartTitle: "Monthly Earnings Graph 💵",
      earningsChartContent: "Analyze your monthly earnings and work performance trends.",
      requestsTitle: "Recent Work Requests 📋",
      requestsContent: "Review and respond to incoming labor requests from local farmers."
    },
    renterSearch: {
      searchInputTitle: "Search & Filter Machinery 🔍",
      searchInputContent: "Type equipment names or select categories to filter nearby machinery.",
      nearMeTitle: "Radius & Distance Filter 📍",
      nearMeContent: "Filter machinery within your village or within a specific km radius.",
      viewToggleTitle: "Map & Grid Views 🗺️",
      viewToggleContent: "Switch between interactive map location view and detailed cards.",
      equipmentCardTitle: "Equipment Details & Booking 🚜",
      equipmentCardContent: "View acre rates, specs, ratings, and click to view full details or book."
    },
    renterEquipmentDetail: {
      overviewTitle: "Equipment Overview & Specs 🚜",
      overviewContent: "Check detailed specifications, condition, power ratings, and acre pricing.",
      ownerCardTitle: "Verified Owner Information 👤",
      ownerCardContent: "See owner ratings, contact options, and verified badge.",
      locationTitle: "Location & Distance 📍",
      locationContent: "View precise village location and calculated distance from your farm.",
      bookingFormTitle: "Book by Acreage 📅",
      bookingFormContent: "Select your land area (acres), start date, and submit instant booking."
    },
    renterBookings: {
      tabsTitle: "Filter Bookings by Status 📌",
      tabsContent: "Switch between Active, Completed, Pending, and Cancelled rentals.",
      bookingItemTitle: "Booking Overview 📋",
      bookingItemContent: "View booked equipment, dates, total cost (₹/acre), and current status.",
      statusBadgeTitle: "Live Status Updates ⚡",
      statusBadgeContent: "Check if your booking is pending owner approval, active, or completed.",
      actionsTitle: "Manage & Contact 📞",
      actionsContent: "Call the equipment owner directly, download receipts, or cancel requests."
    },
    ownerBookings: {
      pendingTitle: "Pending Booking Requests ⏳",
      pendingContent: "Review incoming rental requests requiring your approval.",
      actionsTitle: "Accept or Decline Requests ✅",
      actionsContent: "Approve requests to schedule machinery or decline if unavailable.",
      activeTitle: "Active & Scheduled Rentals 🚜",
      activeContent: "Track equipment currently out on field jobs with farmers.",
      earningsTitle: "Rental Earnings Summary 💵",
      earningsContent: "View total revenue earned from approved and completed bookings."
    },
    renterAiHub: {
      weatherTitle: "Live Weather Intelligence 🌤️",
      weatherContent: "Check real-time temperature, rainfall chance, and agricultural advisories.",
      generateCtaTitle: "Create New Crop Plan ✨",
      generateCtaContent: "Generate customized AI cultivation schedules for your crop and soil.",
      itinerariesTitle: "Your Active Crop Plans 📄",
      itinerariesContent: "Access saved AI itineraries with day-by-day farming activities.",
      insightsTitle: "AI Seasonal Advice 💡",
      insightsContent: "Receive proactive alerts for irrigation, fertilizers, and pest management."
    },
    renterAiReport: {
      summaryTitle: "Crop Plan Summary 🌾",
      summaryContent: "Review crop variety, land area, estimated yield, and expected profit.",
      timelineTitle: "Cultivation Timeline 📅",
      timelineContent: "Follow step-by-step activities from land preparation to harvest.",
      schedulesTitle: "Fertilizer & Irrigation 💧",
      schedulesContent: "Check exact dosage recommendations and watering schedules.",
      actionsTitle: "Export & Print PDF 📥",
      actionsContent: "Download a clean PDF report to save or share with local agronomists."
    },
    ownerEquipment: {
      addTitle: "List New Equipment ➕",
      addContent: "Add your tractors, harvesters, or implements to start earning.",
      gridTitle: "Your Equipment Fleet 🚜",
      gridContent: "View all your registered machinery, acre rates, and availability.",
      availabilityTitle: "Toggle Availability Switch 🟢",
      availabilityContent: "Mark equipment available or busy with a single click.",
      actionsTitle: "Edit or Manage Specs ⚙️",
      actionsContent: "Update rental rates per acre, photos, description, and specifications."
    },
    renterLabours: {
      skillFilterTitle: "Filter by Primary Skill 🛠️",
      skillFilterContent: "Find tractor operators, harvester drivers, or general field workers.",
      chargeFilterTitle: "Daily Charge Range 💰",
      chargeFilterContent: "Filter workers matching your daily labor budget.",
      profileCardTitle: "Worker Profile & Experience 👨‍🌾",
      profileCardContent: "See ratings, village location, daily charges, and verified badges.",
      hireTitle: "Direct Hire Request 📞",
      hireContent: "Send a direct labor request or call the worker for farm jobs."
    },
    labourRequests: {
      requestsTitle: "Incoming Job Requests 📩",
      requestsContent: "View work requests submitted by local farmers needing your skills.",
      farmerCardTitle: "Farmer & Job Details 📍",
      farmerCardContent: "Check farm location, work type, requested dates, and payment.",
      actionsTitle: "Accept or Decline Jobs 👍",
      actionsContent: "Accept job requests to confirm work or decline if busy.",
      statusTitle: "Request Status Filters 📋",
      statusTitleContent: "Filter requests by Pending, Accepted, Completed, or Declined."
    }
  },
  hi: {
    takeTour: "टूर लें",
    next: "आगे",
    back: "पीछे",
    skip: "छोड़ें",
    last: "समाप्त",
    renterDashboard: {
      welcomeTitle: "FarmFleet AI में आपका स्वागत है! 👋",
      welcomeContent: "कृषि उपकरण किराए पर लेने और कुशल श्रमिकों को रखने का आपका मुख्य केंद्र।",
      aiPlannerTitle: "एआई फसल योजनाकार ✨",
      aiPlannerContent: "स्मार्ट फसल यात्रा कार्यक्रम, मौसम पूर्वानुमान और अनुकूलित खेती सलाह प्राप्त करें।",
      searchEquipmentTitle: "मशीनरी खोजें 🚜",
      searchEquipmentContent: "प्रति एकड़ दर के साथ नजदीकी ट्रैक्टर, हार्वेस्टर और उपकरण खोजें और बुक करें।",
      findLabourTitle: "खेती श्रमिक किराए पर लें 👥",
      findLabourContent: "अपने गाँव के पास सत्यापित ड्राइवरों, ऑपरेटरों और खेत श्रमिकों को खोजें।",
      myBookingsTitle: "अपनी बुकिंग ट्रैक करें 📅",
      myBookingsContent: "सक्रिय किराए, अनुसूची तिथियां देखें और बुकिंग स्थिति अपडेट पर नज़र रखें।",
      recommendedTitle: "अनुशंसित उपकरण ⭐",
      recommendedContent: "आपके वर्तमान कृषि सीजन के लिए तैयार की गई शीर्ष रेटेड मशीनरी का अन्वेषण करें।"
    },
    ownerDashboard: {
      statsTitle: "स्वामियों का स्वागत है! 💰",
      statsContent: "अपने कुल राजस्व, उपकरण संख्या, सक्रिय किराए और उपयोग दरों को ट्रैक करें।",
      earningsChartTitle: "मासिक राजस्व ग्राफ 📈",
      earningsChartContent: "माह-दर-माह किराये की आय और वित्तीय वृद्धि की कल्पना करें।",
      topEquipmentTitle: "शीर्ष प्रदर्शन वाली मशीनरी 🚜",
      topEquipmentContent: "देखें कि आपकी कौन सी मशीनें सबसे अधिक किराये की आय उत्पन्न करती हैं।",
      equipmentUsageTitle: "मशीन संचालन घंटे ⏱️",
      equipmentUsageContent: "रखरखाव कार्यक्रम और उत्पादकता के लिए सक्रिय परिचालन घंटों की निगरानी करें।",
      recentActivityTitle: "वास्तविक समय गतिविधि फ़ीड ⚡",
      recentActivityContent: "हाल के बुकिंग अनुरोधों और किराये के पूरा होने पर अपडेट रहें।"
    },
    labourDashboard: {
      profileTitle: "श्रमिक प्रोफ़ाइल और कौशल 🧑‍🌾",
      profileContent: "अपनी सत्यापित प्रोफ़ाइल, दैनिक दरें और प्राथमिक कौशल देखें और प्रबंधित करें।",
      statsTitle: "नौकरी के आंकड़े 📊",
      statsContent: "कुल नौकरियां, लंबित अनुरोध, रेटिंग और कुल कमाई ट्रैक करें।",
      earningsChartTitle: "मासिक कमाई ग्राफ 💵",
      earningsChartContent: "अपनी मासिक कमाई और कार्य प्रदर्शन के रुझानों का विश्लेषण करें।",
      requestsTitle: "हाल के कार्य अनुरोध 📋",
      requestsContent: "स्थानीय किसानों से आने वाले श्रम अनुरोधों की समीक्षा करें और उनका उत्तर दें।"
    },
    renterSearch: {
      searchInputTitle: "मशीनरी खोजें और फ़िल्टर करें 🔍",
      searchInputContent: "नजदीकी मशीनरी को फ़िल्टर करने के लिए उपकरण का नाम लिखें या श्रेणियां चुनें।",
      nearMeTitle: "त्रिज्या और दूरी फ़िल्टर 📍",
      nearMeContent: "अपने गाँव के भीतर या एक निश्चित किमी त्रिज्या के भीतर मशीनरी फ़िल्टर करें।",
      viewToggleTitle: "मानचित्र और ग्रिड दृश्य 🗺️",
      viewToggleContent: "इंटरैक्टिव मानचित्र स्थान दृश्य और विस्तृत कार्ड के बीच स्विच करें।",
      equipmentCardTitle: "उपकरण विवरण और बुकिंग 🚜",
      equipmentCardContent: "एकड़ दरें, विवरण, रेटिंग देखें और पूरा विवरण देखने या बुक करने के लिए क्लिक करें।"
    },
    renterEquipmentDetail: {
      overviewTitle: "उपकरण अवलोकन और विशिष्टताएं 🚜",
      overviewContent: "विस्तृत विवरण, स्थिति, पावर रेटिंग और एकड़ मूल्य की जांच करें।",
      ownerCardTitle: "सत्यापित मालिक जानकारी 👤",
      ownerCardContent: "मालिक की रेटिंग, संपर्क विकल्प और सत्यापित बैज देखें।",
      locationTitle: "स्थान और दूरी 📍",
      locationContent: "सटीक गाँव का स्थान और अपने खेत से गणना की गई दूरी देखें।",
      bookingFormTitle: "एकड़ के अनुसार बुक करें 📅",
      bookingFormContent: "अपनी भूमि का क्षेत्रफल (एकड़), प्रारंभ तिथि चुनें और तत्काल बुकिंग जमा करें।"
    },
    renterBookings: {
      tabsTitle: "स्थिति के अनुसार बुकिंग फ़िल्टर करें 📌",
      tabsContent: "सक्रिय, पूर्ण, लंबित और रद्द किए गए किराए के बीच स्विच करें।",
      bookingItemTitle: "बुकिंग अवलोकन 📋",
      bookingItemContent: "बुक किए गए उपकरण, तिथियां, कुल लागत (₹/एकड़) और वर्तमान स्थिति देखें।",
      statusBadgeTitle: "लाइव स्थिति अपडेट ⚡",
      statusBadgeContent: "जांचें कि क्या आपकी बुकिंग मालिक की स्वीकृति, सक्रिय या पूर्ण होने के लिए लंबित है।",
      actionsTitle: "प्रबंधित करें और संपर्क करें 📞",
      actionsContent: "उपकरण मालिक को सीधे कॉल करें, रसीदें डाउनलोड करें या अनुरोध रद्द करें।"
    },
    ownerBookings: {
      pendingTitle: "लंबित बुकिंग अनुरोध ⏳",
      pendingContent: "आपकी स्वीकृति की आवश्यकता वाले आने वाले किराये के अनुरोधों की समीक्षा करें।",
      actionsTitle: "अनुरोध स्वीकार या अस्वीकार करें ✅",
      actionsContent: "मशीनरी निर्धारित करने के लिए अनुरोधों को स्वीकृत करें या अनुपलब्ध होने पर अस्वीकार करें।",
      activeTitle: "सक्रिय और निर्धारित किराए 🚜",
      activeContent: "किसानों के साथ मैदान पर वर्तमान में काम कर रहे उपकरणों को ट्रैक करें।",
      earningsTitle: "किराया कमाई सारांश 💵",
      earningsContent: "स्वीकृत और पूर्ण बुकिंग से अर्जित कुल राजस्व देखें।"
    },
    renterAiHub: {
      weatherTitle: "लाइव मौसम इंटेलिजेंस 🌤️",
      weatherContent: "वास्तविक समय का तापमान, वर्षा की संभावना और कृषि सलाह देखें।",
      generateCtaTitle: "नई फसल योजना बनाएं ✨",
      generateCtaContent: "अपनी फसल और मिट्टी के लिए अनुकूलित एआई खेती कार्यक्रम बनाएं।",
      itinerariesTitle: "आपकी सक्रिय फसल योजनाएं 📄",
      itinerariesContent: "दिन-प्रतिदिन की कृषि गतिविधियों के साथ सहेजे गए एआई यात्रा कार्यक्रमों तक पहुंचें।",
      insightsTitle: "एआई मौसमी सलाह 💡",
      insightsContent: "सिंचाई, उर्वरक और कीट प्रबंधन के लिए सक्रिय अलर्ट प्राप्त करें।"
    },
    renterAiReport: {
      summaryTitle: "फसल योजना सारांश 🌾",
      summaryContent: "फसल की किस्म, भूमि का क्षेत्रफल, अनुमानित उपज और अपेक्षित लाभ की समीक्षा करें।",
      timelineTitle: "खेती की समयरेखा 📅",
      timelineContent: "भूमि की तैयारी से लेकर फसल की कटाई तक चरण-दर-चरण गतिविधियों का पालन करें।",
      schedulesTitle: "उर्वरक और सिंचाई 💧",
      schedulesContent: "सटीक खुराक की सिफारिशों और पानी देने के शेड्यूल की जांच करें।",
      actionsTitle: "पीडीएफ निर्यात करें और प्रिंट करें 📥",
      actionsContent: "स्थानीय कृषि वैज्ञानिकों के साथ सहेजने या साझा करने के लिए एक साफ पीडीएफ रिपोर्ट डाउनलोड करें।"
    },
    ownerEquipment: {
      addTitle: "नए उपकरण सूचीबद्ध करें ➕",
      addContent: "कमाई शुरू करने के लिए अपने ट्रैक्टर, हार्वेस्टर या उपकरण जोड़ें।",
      gridTitle: "आपका उपकरण बेड़ा 🚜",
      gridContent: "अपनी सभी पंजीकृत मशीनरी, एकड़ दरें और उपलब्धता देखें।",
      availabilityTitle: "उपलब्धता स्विच टॉगल करें 🟢",
      availabilityContent: "एक ही क्लिक से उपकरण उपलब्ध या व्यस्त चिह्नित करें।",
      actionsTitle: "विशिष्टताओं को संपादित या प्रबंधित करें ⚙️",
      actionsContent: "प्रति एकड़ किराया दरें, फ़ोटो, विवरण और विशिष्टताएं अपडेट करें।"
    },
    renterLabours: {
      skillFilterTitle: "प्राथमिक कौशल द्वारा फ़िल्टर करें 🛠️",
      skillFilterContent: "ट्रैक्टर ऑपरेटर, हार्वेस्टर चालक या सामान्य खेत मजदूर खोजें।",
      chargeFilterTitle: "दैनिक शुल्क सीमा 💰",
      chargeFilterContent: "आपके दैनिक श्रम बजट से मेल खाने वाले श्रमिकों को फ़िल्टर करें।",
      profileCardTitle: "श्रमिक प्रोफ़ाइल और अनुभव 👨‍🌾",
      profileCardContent: "रेटिंग, गाँव का स्थान, दैनिक शुल्क और सत्यापित बैज देखें।",
      hireTitle: "सीधा किराया अनुरोध 📞",
      hireContent: "सीधा श्रम अनुरोध भेजें या खेत के काम के लिए कार्यकर्ता को कॉल करें।"
    },
    labourRequests: {
      requestsTitle: "आने वाले कार्य अनुरोध 📩",
      requestsContent: "आपके कौशल की आवश्यकता वाले स्थानीय किसानों द्वारा प्रस्तुत कार्य अनुरोध देखें।",
      farmerCardTitle: "किसान और कार्य विवरण 📍",
      farmerCardContent: "खेत का स्थान, कार्य का प्रकार, अनुरोधित तिथियां और भुगतान की जांच करें।",
      actionsTitle: "काम स्वीकार या अस्वीकार करें 👍",
      actionsContent: "काम की पुष्टि करने के लिए कार्य अनुरोध स्वीकार करें या व्यस्त होने पर अस्वीकार करें।",
      statusTitle: "अनुरोध स्थिति फ़िल्टर 📋",
      statusTitleContent: "लंबित, स्वीकृत, पूर्ण या अस्वीकृत द्वारा अनुरोध फ़िल्टर करें।"
    }
  },
  mr: {
    takeTour: "टूर घ्या",
    next: "पुढील",
    back: "मागे",
    skip: "सोडा",
    last: "पूर्ण",
    renterDashboard: {
      welcomeTitle: "FarmFleet AI मध्ये आपले स्वागत आहे! 👋",
      welcomeContent: "शेतीची उपकरणे भाड्याने घेण्यासाठी आणि कुशल मजूर मिळवण्यासाठी तुमचे मुख्य केंद्र.",
      aiPlannerTitle: "एआय पीक नियोजक ✨",
      aiPlannerContent: "स्मार्ट पीक वेळापत्रक, हवामान अंदाज आणि सानुकूलित शेती सल्ला मिळवा.",
      searchEquipmentTitle: "मशीनरी शोधा 🚜",
      searchEquipmentContent: "प्रति एकर दराने जवळील ट्रॅक्टर, हार्वेस्टर आणि औजारे शोधा आणि बुक करा.",
      findLabourTitle: "शेतमजूर भाड्याने घ्या 👥",
      findLabourContent: "तुमच्या गावाजवळील नोंदणीकृत ड्रायव्हर्स, ऑपरेटर्स आणि शेतमजूर शोधा.",
      myBookingsTitle: "तुमची बुकिंग ट्रॅक करा 📅",
      myBookingsContent: "सक्रिय भाडेतत्त्व, वेळापत्रक तारखा आणि बुकिंग स्थिती अपडेट पहा.",
      recommendedTitle: "शिफारस केलेली उपकरणे ⭐",
      recommendedContent: "तुमच्या सध्याच्या शेती हंगामासाठी तयार केलेली टॉप-रेटेड यंत्रसामग्री एक्सप्लोर करा."
    },
    ownerDashboard: {
      statsTitle: "मालकांचे स्वागत आहे! 💰",
      statsContent: "तुमचा एकूण महसूल, उपकरणांची संख्या, सक्रिय भाडे आणि वापर दर ट्रॅक करा.",
      earningsChartTitle: "मासिक महसूल आलेख 📈",
      earningsChartContent: "महिना-दर-महिना भाड्याचे उत्पन्न आणि आर्थिक वाढीची कल्पना करा.",
      topEquipmentTitle: "सर्वोत्कृष्ट कामगिरी करणारी यंत्रसामग्री 🚜",
      topEquipmentContent: "तुमच्या कोणत्या मशीन सर्वाधिक भाड्याचे उत्पन्न मिळवून देतात ते पहा.",
      equipmentUsageTitle: "मशीनचे कामाचे तास ⏱️",
      equipmentUsageContent: "पालकत्व वेळापत्रक आणि उत्पादकतेसाठी सक्रिय कामाच्या तासांचे निरीक्षण करा.",
      recentActivityTitle: "रिअल-टाइम क्रियाकलाप फीड ⚡",
      recentActivityContent: "नुकत्याच आलेल्या बुकिंग विनंत्या आणि भाडे पूर्ण झाल्याबद्दल अपडेट राहा."
    },
    labourDashboard: {
      profileTitle: "मजूर प्रोफाइल आणि कौशल्ये 🧑‍🌾",
      profileContent: "तुमचे सत्यापित प्रोफाईल, दैनंदिन दर आणि प्राथमिक कौशल्ये पहा आणि व्यवस्थापित करा.",
      statsTitle: "कामाची आकडेवारी 📊",
      statsContent: "एकूण कामे, प्रलंबित विनंत्या, रेटिंग आणि एकूण कमाई ट्रॅक करा.",
      earningsChartTitle: "मासिक कमाई आलेख 💵",
      earningsChartContent: "तुमच्या मासिक कमाईचे आणि कामाच्या कामगिरीचे विश्लेषण करा.",
      requestsTitle: "नुकत्याच आलेल्या कामाच्या विनंत्या 📋",
      requestsContent: "स्थानिक शेतकऱ्यांकडून येणाऱ्या कामगारांच्या विनंत्यांचे पुनरावलोकन करा आणि उत्तर द्या."
    },
    renterSearch: {
      searchInputTitle: "मशीनरी शोधा आणि फिल्टर करा 🔍",
      searchInputContent: "जवळपासची यंत्रसामग्री फिल्टर करण्यासाठी उपकरणाचे नाव टाइप करा किंवा श्रेणी निवडा.",
      nearMeTitle: "त्रिज्या आणि अंतर फिल्टर 📍",
      nearMeContent: "तुमच्या गावातील किंवा ठराविक किमी त्रिज्येतील यंत्रसामग्री फिल्टर करा.",
      viewToggleTitle: "नकाशा आणि ग्रिड दृश्य 🗺️",
      viewToggleContent: "इंटरएक्टिव्ह नकाशा स्थान दृश्य आणि तपशीलवार कार्ड्स दरम्यान स्विच करा.",
      equipmentCardTitle: "उपकरण तपशील आणि बुकिंग 🚜",
      equipmentCardContent: "एकर दर, तपशील, रेटिंग पहा आणि पूर्ण तपशील पाहण्यासाठी किंवा बुक करण्यासाठी क्लिक करा."
    },
    renterEquipmentDetail: {
      overviewTitle: "उपकरणे विहंगावलोकन आणि वैशिष्ट्ये 🚜",
      overviewContent: "तपशीलवार वैशिष्ट्ये, स्थिती, पॉवर रेटिंग आणि एकर किमती तपासा.",
      ownerCardTitle: "सत्यापित मालक माहिती 👤",
      ownerCardContent: "मालक रेटिंग, संपर्क पर्याय आणि सत्यापित बॅज पहा.",
      locationTitle: "स्थान आणि अंतर 📍",
      locationContent: "अचूक गावाचे स्थान आणि तुमच्या शेतापासून गणलेले अंतर पहा.",
      bookingFormTitle: "एकरनुसार बुक करा 📅",
      bookingFormContent: "तुमचे शेत क्षेत्र (एकर), सुरुवातीची तारीख निवडा आणि झटपट बुकिंग सबमिट करा."
    },
    renterBookings: {
      tabsTitle: "स्थितीनुसार बुकिंग फिल्टर करा 📌",
      tabsContent: "सक्रिय, पूर्ण, प्रलंबित आणि रद्द केलेल्या भाड्यादरम्यान स्विच करा.",
      bookingItemTitle: "बुकिंग विहंगावलोकन 📋",
      bookingItemContent: "बुक केलेली उपकरणे, तारखा, एकूण खर्च (₹/एकर) आणि सद्यस्थिती पहा.",
      statusBadgeTitle: "थेट स्थिती अपडेट ⚡",
      statusBadgeContent: "तुमचे बुकिंग मालकाच्या मंजुरीसाठी प्रलंबित आहे, सक्रिय आहे की पूर्ण झाले आहे ते तपासा.",
      actionsTitle: "व्यवस्थापित करा आणि संपर्क साधा 📞",
      actionsContent: "उपकरण मालकाला थेट कॉल करा, पावत्या डाउनलोड करा किंवा विनंत्या रद्द करा."
    },
    ownerBookings: {
      pendingTitle: "प्रलंबित बुकिंग विनंत्या ⏳",
      pendingContent: "तुमच्या मंजुरीची आवश्यकता असलेल्या येणाऱ्या भाड्याच्या विनंत्यांचे पुनरावलोकन करा.",
      actionsTitle: "विनंत्या स्वीकारा किंवा नाकारा ✅",
      actionsContent: "यंत्रसामग्रीचे वेळापत्रक निश्चित करण्यासाठी विनंत्यांना मंजुरी द्या किंवा उपलब्ध नसल्यास नाकारा.",
      activeTitle: "सक्रिय आणि नियोजित भाडे 🚜",
      activeContent: "सध्या शेतकऱ्यांसोबत शेतात काम करणाऱ्या उपकरणांचा मागोवा घ्या.",
      earningsTitle: "भाडे कमाईचा सारांश 💵",
      earningsContent: "मंजूर आणि पूर्ण झालेल्या बुकिंगमधून मिळालेला एकूण महसूल पहा."
    },
    renterAiHub: {
      weatherTitle: "थेट हवामान बुद्धिमत्ता 🌤️",
      weatherContent: "रिअल-टाइम तापमान, पावसाची शक्यता आणि कृषी सल्ला तपासा.",
      generateCtaTitle: "नवीन पीक योजना तयार करा ✨",
      generateCtaContent: "तुमच्या पिकासाठी आणि मातीसाठी सानुकूलित एआय शेती वेळापत्रक तयार करा.",
      itinerariesTitle: "तुमच्या सक्रिय पीक योजना 📄",
      itinerariesContent: "दिवसेंदिवस शेतीच्या उपक्रमांसह जतन केलेल्या एआय वेळापत्रकात प्रवेश करा.",
      insightsTitle: "एआय हंगामी सल्ला 💡",
      insightsContent: "सिंचन, खते आणि कीटक व्यवस्थापनासाठी त्वरित इशारे मिळवा."
    },
    renterAiReport: {
      summaryTitle: "पीक योजना सारांश 🌾",
      summaryContent: "पिकांची जात, जमिनीचे क्षेत्रफळ, अंदाजित उत्पन्न आणि अपेक्षित नफा तपासा.",
      timelineTitle: "शेतीची कालमर्यादा 📅",
      timelineContent: "जमीन तयार करण्यापासून ते काढणीपर्यंत टप्प्याटप्प्याने उपक्रमांचे अनुसरण करा.",
      schedulesTitle: "खत आणि सिंचन 💧",
      schedulesContent: "अचूक डोस शिफारसी आणि पाणी देण्याचे वेळापत्रक तपासा.",
      actionsTitle: "पीडीएफ निर्यात करा आणि मुद्रित करा 📥",
      actionsContent: "स्थानिक कृषी तज्ञांशी जतन करण्यासाठी किंवा शेअर करण्यासाठी स्वच्छ पीडीएफ अहवाल डाउनलोड करा."
    },
    ownerEquipment: {
      addTitle: "नवीन उपकरणे सूचीबद्ध करा ➕",
      addContent: "कमाई सुरू करण्यासाठी तुमचे ट्रॅक्टर, हार्वेस्टर किंवा औजारे जोडा.",
      gridTitle: "तुमची उपकरणे 🚜",
      gridContent: "तुमची सर्व नोंदणीकृत यंत्रसामग्री, एकर दर आणि उपलब्धता पहा.",
      availabilityTitle: "उपलब्धता स्विच बदला 🟢",
      availabilityContent: "एका क्लिकवर उपकरणे उपलब्ध किंवा व्यस्त म्हणून चिन्हांकित करा.",
      actionsTitle: "वैशिष्ट्ये संपादित करा किंवा व्यवस्थापित करा ⚙️",
      actionsContent: "प्रति एकर भाडे दर, फोटो, वर्णन आणि वैशिष्ट्ये अपडेट करा."
    },
    renterLabours: {
      skillFilterTitle: "प्राथमिक कौशल्यानुसार फिल्टर करा 🛠️",
      skillFilterContent: "ट्रॅक्टर चालक, हार्वेस्टर चालक किंवा सामान्य शेतमजूर शोधा.",
      chargeFilterTitle: "दैनंदिन दर मर्यादा 💰",
      chargeFilterContent: "तुमच्या दैनंदिन बजेटशी जुळणारे मजूर फिल्टर करा.",
      profileCardTitle: "मजूर प्रोफाइल आणि अनुभव 👨‍🌾",
      profileCardContent: "रेटिंग, गावाचे स्थान, दैनंदिन दर आणि सत्यापित बॅज पहा.",
      hireTitle: "थेट कामाची विनंती 📞",
      hireContent: "शेतातील कामासाठी थेट मजुरीची विनंती पाठवा किंवा कामगाराला कॉल करा."
    },
    labourRequests: {
      requestsTitle: "येणाऱ्या कामाच्या विनंत्या 📩",
      requestsContent: "तुमच्या कौशल्याची गरज असलेल्या स्थानिक शेतकऱ्यांनी सादर केलेल्या कामाच्या विनंत्या पहा.",
      farmerCardTitle: "शेतकरी आणि कामाचा तपशील 📍",
      farmerCardContent: "शेताचे स्थान, कामाचा प्रकार, विनंती केलेल्या तारखा आणि पेमेंट तपासा.",
      actionsTitle: "कामे स्वीकारा किंवा नाकारा 👍",
      actionsContent: "कामाची पुष्टी करण्यासाठी कामाची विनंती स्वीकारा किंवा व्यस्त असल्यास नाकारा.",
      statusTitle: "विनंती स्थिती फिल्टर 📋",
      statusTitleContent: "प्रलंबित, स्वीकारलेले, पूर्ण झालेले किंवा नाकारलेल्या विनंत्या फिल्टर करा."
    }
  }
};

// Generate matching structure for gu, ta, te, kn, pa based on hindi/english patterns
const languages = ["en", "hi", "mr", "gu", "ta", "te", "kn", "pa"];

languages.forEach((lang) => {
  const filePath = path.join(i18nDir, `${lang}.json`);
  if (!fs.existsSync(filePath)) return;
  const content = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  
  // Choose translation source (lang specific if defined, fallback to hi or en)
  content.tour = translations[lang] || translations.hi || translations.en;

  fs.writeFileSync(filePath, JSON.stringify(content, null, 2), "utf-8");
  console.log(`Updated ${lang}.json with tour section.`);
});
