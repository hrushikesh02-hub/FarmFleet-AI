export type EquipmentType =
  | "Tractor"
  | "Harvester"
  | "Plough"
  | "Rotavator"
  | "Seeder"
  | "Sprayer"
  | "Thresher"
  | "Tiller";

export interface Equipment {
  id: string;
  name: string;
  type: EquipmentType;
  image: string;
  pricePerHour: number;
  pricePerDay: number;
  pricePerAcre?: number;
  ownerName: string;
  ownerVillage: string;
  ownerRating: number;
  ownerVerified: boolean;
  distanceKm: number;
  rating: number;
  reviewsCount: number;
  operatorIncluded: boolean;
  status: "active" | "inactive" | "maintenance";
  specs: { label: string; value: string }[];
  description: string;
  availability: "available" | "few" | "busy" | "full";
}

const stock = (seed: string, w = 800, h = 600) =>
  `https://images.unsplash.com/${seed}?auto=format&fit=crop&w=${w}&h=${h}&q=70`;

const imgs = [
  "photo-1599909533730-9af1d5e4ec1b", // tractor field
  "photo-1592982537447-7440770faae9", // harvester
  "photo-1625246333195-78d9c38ad449", // tractor
  "photo-1500651230702-0e2d8a49d4ad", // farm
  "photo-1574943320219-553eb213f72d", // tractor red
  "photo-1605000797499-95a51c5269ae", // tractor sunset
  "photo-1620200423727-8127f75d4f1e", // tractor green
  "photo-1623211093988-67b8eb12d5a8", // farm machine
];

export const EQUIPMENT: Equipment[] = [
  {
    id: "eq-001",
    name: "Mahindra 575 DI Tractor",
    type: "Tractor",
    image: stock(imgs[0]),
    pricePerHour: 450,
    pricePerDay: 3200,
    pricePerAcre: 850,
    ownerName: "Ramesh Patil",
    ownerVillage: "Wai, Satara",
    ownerRating: 4.8,
    ownerVerified: true,
    distanceKm: 3.2,
    rating: 4.7,
    reviewsCount: 142,
    operatorIncluded: true,
    status: "active",
    specs: [
      { label: "Power", value: "47 HP" },
      { label: "Fuel", value: "Diesel" },
      { label: "Year", value: "2022" },
      { label: "Hours used", value: "1,240 hrs" },
    ],
    description:
      "Well maintained Mahindra 575 with operator. Ideal for ploughing, transport and rotavator work.",
    availability: "available",
  },
  {
    id: "eq-002",
    name: "John Deere W70 Combine Harvester",
    type: "Harvester",
    image: stock(imgs[1]),
    pricePerHour: 1800,
    pricePerDay: 12000,
    pricePerAcre: 2200,
    ownerName: "Sunil Deshmukh",
    ownerVillage: "Karad, Satara",
    ownerRating: 4.9,
    ownerVerified: true,
    distanceKm: 7.4,
    rating: 4.9,
    reviewsCount: 87,
    operatorIncluded: true,
    status: "active",
    specs: [
      { label: "Capacity", value: "5.5 tons/hr" },
      { label: "Cutter", value: "14 ft" },
      { label: "Year", value: "2023" },
    ],
    description:
      "High-output combine harvester suitable for wheat, paddy and soybean. Operator and fuel included.",
    availability: "few",
  },
  {
    id: "eq-003",
    name: "Sonalika MM18 Rotavator",
    type: "Rotavator",
    image: stock(imgs[2]),
    pricePerHour: 350,
    pricePerDay: 2400,
    pricePerAcre: 600,
    ownerName: "Anjali Jadhav",
    ownerVillage: "Phaltan, Satara",
    ownerRating: 4.6,
    ownerVerified: true,
    distanceKm: 5.1,
    rating: 4.5,
    reviewsCount: 64,
    operatorIncluded: false,
    status: "active",
    specs: [
      { label: "Width", value: "1.8 m" },
      { label: "Blades", value: "42" },
      { label: "Power req.", value: "35-50 HP" },
    ],
    description: "Heavy duty rotavator for fine seedbed preparation.",
    availability: "available",
  },
  {
    id: "eq-004",
    name: "Swaraj 744 FE Tractor",
    type: "Tractor",
    image: stock(imgs[3]),
    pricePerHour: 500,
    pricePerDay: 3600,
    pricePerAcre: 900,
    ownerName: "Vikas More",
    ownerVillage: "Koregaon, Satara",
    ownerRating: 4.7,
    ownerVerified: true,
    distanceKm: 9.8,
    rating: 4.6,
    reviewsCount: 98,
    operatorIncluded: true,
    status: "active",
    specs: [
      { label: "Power", value: "48 HP" },
      { label: "Year", value: "2021" },
    ],
    description: "Reliable tractor with experienced operator.",
    availability: "busy",
  },
  {
    id: "eq-005",
    name: "Aspee Power Sprayer",
    type: "Sprayer",
    image: stock(imgs[4]),
    pricePerHour: 180,
    pricePerDay: 1100,
    pricePerAcre: 250,
    ownerName: "Pooja Shinde",
    ownerVillage: "Karad, Satara",
    ownerRating: 4.5,
    ownerVerified: false,
    distanceKm: 6.0,
    rating: 4.3,
    reviewsCount: 41,
    operatorIncluded: false,
    status: "active",
    specs: [
      { label: "Tank", value: "16 L" },
      { label: "Type", value: "Battery" },
    ],
    description: "Battery powered sprayer suitable for pesticides and fertilizers.",
    availability: "available",
  },
  {
    id: "eq-006",
    name: "Kubota DC-70G Paddy Harvester",
    type: "Harvester",
    image: stock(imgs[5]),
    pricePerHour: 2000,
    pricePerDay: 13500,
    pricePerAcre: 2400,
    ownerName: "Mahesh Pawar",
    ownerVillage: "Wai, Satara",
    ownerRating: 4.9,
    ownerVerified: true,
    distanceKm: 4.5,
    rating: 4.8,
    reviewsCount: 76,
    operatorIncluded: true,
    status: "active",
    specs: [
      { label: "Power", value: "70 HP" },
      { label: "Cutter", value: "2.1 m" },
    ],
    description: "Top of the line paddy harvester with skilled operator.",
    availability: "full",
  },
  {
    id: "eq-007",
    name: "Mahindra Disc Plough",
    type: "Plough",
    image: stock(imgs[6]),
    pricePerHour: 220,
    pricePerDay: 1400,
    pricePerAcre: 400,
    ownerName: "Ramesh Patil",
    ownerVillage: "Wai, Satara",
    ownerRating: 4.8,
    ownerVerified: true,
    distanceKm: 3.2,
    rating: 4.6,
    reviewsCount: 53,
    operatorIncluded: false,
    status: "maintenance",
    specs: [
      { label: "Discs", value: "3" },
      { label: "Width", value: "0.9 m" },
    ],
    description: "Three disc plough for primary tillage.",
    availability: "few",
  },
  {
    id: "eq-008",
    name: "John Deere Multi-Crop Thresher",
    type: "Thresher",
    image: stock(imgs[7]),
    pricePerHour: 600,
    pricePerDay: 4200,
    pricePerAcre: 1100,
    ownerName: "Sunil Deshmukh",
    ownerVillage: "Karad, Satara",
    ownerRating: 4.9,
    ownerVerified: true,
    distanceKm: 7.4,
    rating: 4.7,
    reviewsCount: 62,
    operatorIncluded: true,
    status: "active",
    specs: [
      { label: "Capacity", value: "800 kg/hr" },
      { label: "Crops", value: "Wheat, Soy, Paddy" },
    ],
    description: "Multi-crop thresher with high throughput.",
    availability: "available",
  },
];

export const CATEGORIES: { type: EquipmentType; icon: string }[] = [
  { type: "Tractor", icon: "🚜" },
  { type: "Harvester", icon: "🌾" },
  { type: "Plough", icon: "⚒️" },
  { type: "Rotavator", icon: "🛠️" },
  { type: "Seeder", icon: "🌱" },
  { type: "Sprayer", icon: "💧" },
  { type: "Thresher", icon: "🌽" },
  { type: "Tiller", icon: "⚙️" },
];

export const MONTHLY_EARNINGS = [
  { month: "Jan", earnings: 28000, bookings: 14 },
  { month: "Feb", earnings: 32000, bookings: 16 },
  { month: "Mar", earnings: 41000, bookings: 22 },
  { month: "Apr", earnings: 38000, bookings: 19 },
  { month: "May", earnings: 52000, bookings: 27 },
  { month: "Jun", earnings: 61000, bookings: 32 },
  { month: "Jul", earnings: 74000, bookings: 41 },
  { month: "Aug", earnings: 68000, bookings: 36 },
  { month: "Sep", earnings: 71000, bookings: 38 },
  { month: "Oct", earnings: 85000, bookings: 44 },
  { month: "Nov", earnings: 92000, bookings: 47 },
  { month: "Dec", earnings: 78000, bookings: 40 },
];

export const EQUIPMENT_USAGE = [
  { name: "Mahindra 575", hours: 142 },
  { name: "John Deere W70", hours: 98 },
  { name: "Sonalika MM18", hours: 76 },
  { name: "Swaraj 744", hours: 121 },
  { name: "Disc Plough", hours: 44 },
];

export const ACTIVITIES = [
  { id: 1, text: "New booking from Sachin Kale", time: "2 min ago", type: "booking" },
  { id: 2, text: "Payment received ₹3,200", time: "1 hr ago", type: "payment" },
  { id: 3, text: "Mahindra 575 maintenance due in 3 days", time: "4 hr ago", type: "alert" },
  { id: 4, text: "5-star review from Priya Sharma", time: "Yesterday", type: "review" },
  { id: 5, text: "Booking completed: Rotavator at Phaltan", time: "Yesterday", type: "booking" },
];

export interface Booking {
  id: string;
  equipmentId: string;
  equipmentName: string;
  equipmentImage: string;
  renterName: string;
  ownerName: string;
  date: string;
  slot: string;
  acres: number;
  price: number;
  location: string;
  status: "pending" | "accepted" | "rejected" | "completed" | "cancelled" | "upcoming";
}

export const BOOKINGS: Booking[] = [
  {
    id: "bk-101",
    equipmentId: "eq-001",
    equipmentName: "Mahindra 575 DI Tractor",
    equipmentImage: stock(imgs[0], 400, 300),
    renterName: "Sachin Kale",
    ownerName: "Ramesh Patil",
    date: "2026-06-08",
    slot: "Morning (6 AM - 11 AM)",
    acres: 3,
    price: 2550,
    location: "Survey 142, Wai",
    status: "pending",
  },
  {
    id: "bk-102",
    equipmentId: "eq-002",
    equipmentName: "John Deere W70 Combine Harvester",
    equipmentImage: stock(imgs[1], 400, 300),
    renterName: "Priya Sharma",
    ownerName: "Sunil Deshmukh",
    date: "2026-06-10",
    slot: "Afternoon (12 PM - 5 PM)",
    acres: 5,
    price: 11000,
    location: "Karad East",
    status: "accepted",
  },
  {
    id: "bk-103",
    equipmentId: "eq-003",
    equipmentName: "Sonalika MM18 Rotavator",
    equipmentImage: stock(imgs[2], 400, 300),
    renterName: "Rohit Jadhav",
    ownerName: "Anjali Jadhav",
    date: "2026-06-05",
    slot: "Evening (3 PM - 7 PM)",
    acres: 2,
    price: 1200,
    location: "Phaltan Road",
    status: "completed",
  },
  {
    id: "bk-104",
    equipmentId: "eq-005",
    equipmentName: "Aspee Power Sprayer",
    equipmentImage: stock(imgs[4], 400, 300),
    renterName: "Kavita More",
    ownerName: "Pooja Shinde",
    date: "2026-06-12",
    slot: "Morning (7 AM - 10 AM)",
    acres: 1.5,
    price: 375,
    location: "Karad",
    status: "upcoming",
  },
  {
    id: "bk-105",
    equipmentId: "eq-008",
    equipmentName: "John Deere Multi-Crop Thresher",
    equipmentImage: stock(imgs[7], 400, 300),
    renterName: "Vinod Patil",
    ownerName: "Sunil Deshmukh",
    date: "2026-05-29",
    slot: "Morning",
    acres: 4,
    price: 4400,
    location: "Karad West",
    status: "rejected",
  },
];

export const REVIEWS = [
  { id: 1, name: "Sachin Kale", rating: 5, comment: "Operator was very skilled, tractor in great condition.", date: "May 2026" },
  { id: 2, name: "Priya Sharma", rating: 5, comment: "Best decision. Saved us thousands compared to buying.", date: "April 2026" },
  { id: 3, name: "Rohit Jadhav", rating: 4, comment: "Easy booking via phone. Will use again.", date: "March 2026" },
];

export const TESTIMONIALS = [
  { id: 1, name: "Sachin Kale", village: "Wai", quote: "FarmFleet helped me harvest 12 acres in one day. Booking took 2 minutes.", crop: "Soybean farmer" },
  { id: 2, name: "Anita Pawar", village: "Phaltan", quote: "Listing my tractor here doubled my monthly income.", crop: "Equipment owner" },
  { id: 3, name: "Mahesh Salunkhe", village: "Karad", quote: "Voice support in Marathi made everything easy for me.", crop: "Sugarcane farmer" },
];

export const STATS = {
  farmers: 12400,
  machines: 3850,
  villages: 920,
  bookings: 28700,
};

// Availability matrix: 7 days x 3 slots
export type SlotStatus = "available" | "few" | "busy" | "full";
export const AVAILABILITY_MATRIX: SlotStatus[][] = [
  ["available", "available", "few"],
  ["available", "few", "busy"],
  ["few", "busy", "full"],
  ["busy", "full", "available"],
  ["available", "available", "few"],
  ["available", "few", "busy"],
  ["full", "busy", "available"],
];
