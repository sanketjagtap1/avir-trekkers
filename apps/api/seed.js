require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const RegistrationForm = require("./Models/AdminModels/RegistrationModel");
const Category = require("./Models/CategoryModel");
const Trek = require("./Models/TrekModel");

async function seed() {
  await mongoose.connect(process.env.MONGODB_URL);
  console.log("Connected to DB");

  // ── Admin user ──
  const existingAdmin = await RegistrationForm.findOne({ email: "admin@avirtrekkers.com" });
  let admin;
  if (existingAdmin) {
    admin = existingAdmin;
    console.log("Admin already exists:", admin._id);
  } else {
    admin = await RegistrationForm.create({
      fullName: "Avir Admin",
      role: "admin",
      email: "contact@avirtrekkers.com",
      password: await bcrypt.hash("Admin@123", 10),
    });
    console.log("Admin created:", admin._id);
  }

  // ── Categories ──
  const categoryDefs = [
    { name: "Fort Trek",      description: "Trek to historic forts and fortresses of Maharashtra",   icon: "🏰", color: "sahyadri",  sortOrder: 1 },
    { name: "Waterfall Trek", description: "Treks featuring spectacular waterfalls and rivers",       icon: "💧", color: "blue",      sortOrder: 2 },
    { name: "Night Trek",     description: "Midnight and early morning treks under starlit skies",    icon: "🌙", color: "indigo",    sortOrder: 3 },
    { name: "Camping Trek",   description: "Multi-day treks with overnight camping in the wild",      icon: "⛺", color: "green",     sortOrder: 4 },
    { name: "Heritage Trek",  description: "Treks through historically significant sites and temples", icon: "🏛️", color: "amber",    sortOrder: 5 },
  ];
  const categories = {};
  for (const def of categoryDefs) {
    let cat = await Category.findOne({ name: def.name });
    if (!cat) cat = await Category.create(def);
    categories[def.name] = cat._id;
    console.log(`Category: ${def.name} → ${cat._id}`);
  }

  // ── Treks ──
  const now = new Date();
  const d = (daysFromNow) => new Date(now.getTime() + daysFromNow * 86400000);

  const treks = [
    {
      title: "Rajmachi Fort Trek",
      shortDescription: "A classic monsoon trek through dense forests to twin forts Shrivardhan and Manaranjan in the Sahyadri range.",
      description: "Rajmachi Trek is one of the most popular treks in Maharashtra, offering breathtaking views of the Sahyadri ranges. The trek passes through dense forests and small villages, leading to the twin forts of Shrivardhan and Manaranjan. During monsoon, the entire region transforms into a lush green paradise with numerous waterfalls cascading down the cliffs. The base village of Udhewadi provides homestay options for trekkers who want to camp overnight. This trek is ideal for beginners and experienced trekkers alike, offering a perfect blend of history, nature, and adventure.",
      location: "Lonavala, Maharashtra",
      category: categories["Fort Trek"],
      difficulty: "Easy",
      height: 925,
      grade: "T1",
      range: "Sahyadri",
      route: "Kondivade Village Route",
      base: "Udhewadi Village",
      duration: "2 Days / 1 Night",
      price: 1499,
      startDate: d(14),
      endDate: d(15),
      registrationDeadline: d(11),
      maxParticipants: 30,
      currentParticipants: 8,
      images: [
        "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
        "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80",
      ],
      itinerary: [
        { day: 1, dayTitle: "Mumbai to Rajmachi", title: "Arrival & Night Trek", description: "Meet at Lonavala station at 11 PM. Begin night trek through Kondivade village. Reach base camp by 3 AM. Rest till sunrise.", activities: ["Night trek", "Campfire", "Stargazing"] },
        { day: 2, dayTitle: "Fort Exploration", title: "Fort Visit & Descent", description: "Wake up to stunning sunrise views. Explore Shrivardhan and Manaranjan forts. Descend to Lonavala by afternoon.", activities: ["Fort exploration", "Photography", "Village walk"] },
      ],
      inclusions: ["Professional trek guide", "First aid kit", "Breakfast & dinner on day 1", "Camping equipment"],
      exclusions: ["Travel to/from Lonavala", "Lunch", "Personal expenses", "Travel insurance"],
      requirements: ["Comfortable trekking shoes", "Raincoat/poncho", "Water bottle (2L minimum)", "Torch/headlamp", "Valid ID proof"],
      pickupPoints: ["Dadar Station (10:30 PM)", "Thane Station (11:00 PM)", "Panvel Station (11:45 PM)"],
      status: "Upcoming",
      isFeatured: true,
      isActive: true,
      createdBy: admin._id,
    },
    {
      title: "Harishchandragad Trek",
      shortDescription: "Trek to one of Maharashtra's most iconic forts featuring the famous Konkan Kada cliff — a sheer 1200-ft vertical drop.",
      description: "Harishchandragad is one of the most magnificent forts in the Sahyadri ranges. The trek is known for the famous Konkan Kada, a concave cliff that offers a dramatic view of the Konkan plains below. The fort has an ancient Harishchandra temple, the Kedareshwar cave with a Shivalinga, and the stunning Taramati peak. The route from Khireshwar takes you through dense forests, rocky patches, and open plateaus. It's a challenging trek but immensely rewarding — the panoramic views from the top are simply unmatched in Maharashtra.",
      location: "Ahmednagar, Maharashtra",
      category: categories["Fort Trek"],
      difficulty: "Hard",
      height: 1424,
      grade: "T3",
      range: "Sahyadri",
      route: "Khireshwar Route",
      base: "Khireshwar Village",
      duration: "2 Days / 1 Night",
      price: 1999,
      startDate: d(21),
      endDate: d(22),
      registrationDeadline: d(18),
      maxParticipants: 25,
      currentParticipants: 12,
      images: [
        "https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&q=80",
        "https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?w=800&q=80",
      ],
      itinerary: [
        { day: 1, dayTitle: "Base Camp", title: "Drive & Trek to Base", description: "Depart from Pune at 6 AM. Drive to Khireshwar. Start trek by 10 AM. Reach Harishchandragad plateau by evening. Set up camp.", activities: ["Forest trail", "Rock patches", "Camp setup"] },
        { day: 2, dayTitle: "Summit & Konkan Kada", title: "Exploration & Return", description: "Early morning visit to Konkan Kada for sunrise. Explore the fort, temple, and Kedareshwar cave. Descend and drive back.", activities: ["Konkan Kada sunrise", "Temple visit", "Fort exploration"] },
      ],
      inclusions: ["Trek leader & guide", "Camping equipment", "Meals (dinner, breakfast)", "First aid", "Transport from Pune"],
      exclusions: ["Lunch", "Personal gear", "Insurance", "Entry fees if any"],
      requirements: ["Trekking shoes (mandatory)", "Warm jacket", "3L water", "Energy snacks", "Fitness: moderate to good"],
      pickupPoints: ["Shivajinagar, Pune (5:30 AM)", "Hadapsar, Pune (6:00 AM)"],
      status: "Upcoming",
      isFeatured: true,
      isActive: true,
      createdBy: admin._id,
    },
    {
      title: "Sandhan Valley Trek",
      shortDescription: "Descend into the mysterious 'Valley of Shadows' — a stunning canyon carved by the Sandhan river in the Sahyadris.",
      description: "Sandhan Valley, also known as the 'Valley of Shadows', is a unique rappelling and trekking experience through a narrow canyon in Bhandardara, Maharashtra. The valley is formed by the Sandhan river cutting through the Sahyadri rocks over thousands of years, creating towering walls on both sides. The trek involves crossing through the valley with sections requiring swimmers to wade through water pools. It's a memorable overnight adventure combining trekking, rappelling, and river crossing.",
      location: "Bhandardara, Maharashtra",
      category: categories["Night Trek"],
      difficulty: "Moderate",
      height: 900,
      grade: "T2",
      range: "Sahyadri",
      route: "Samrad Village Route",
      base: "Samrad Village",
      duration: "2 Days / 1 Night",
      price: 2299,
      startDate: d(28),
      endDate: d(29),
      registrationDeadline: d(25),
      maxParticipants: 20,
      currentParticipants: 5,
      images: [
        "https://images.unsplash.com/photo-1579762715118-a6f1d4b934f1?w=800&q=80",
        "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&q=80",
      ],
      itinerary: [
        { day: 1, dayTitle: "Entry & Canyon Trek", title: "Enter the Valley", description: "Drive from Mumbai/Pune to Samrad village. Enter the valley. Trek through the narrow canyon. Set up camp inside the valley.", activities: ["Canyon walk", "Water crossing", "Rappelling sections", "Camp in valley"] },
        { day: 2, dayTitle: "Exit & Return", title: "Valley Exit", description: "Morning yoga in the valley. Complete the exit trek. Drive back. Reach base cities by evening.", activities: ["Sunrise in valley", "Exit trek", "Photography"] },
      ],
      inclusions: ["Professional guide & safety crew", "Rappelling equipment", "Camping gear", "All meals inside valley", "Transport"],
      exclusions: ["Personal trekking gear", "Dry bags (recommended)", "Insurance"],
      requirements: ["Must know swimming (basic)", "Waterproof bag", "Quick-dry clothes", "Torch", "Energy bars"],
      pickupPoints: ["Dadar, Mumbai (9:00 PM)", "Kalyan (9:30 PM)", "Nashik (11:00 PM)"],
      status: "Upcoming",
      isFeatured: true,
      isActive: true,
      createdBy: admin._id,
    },
    {
      title: "Kalsubai Peak Trek",
      shortDescription: "Conquer Maharashtra's highest peak at 1646m and witness a 360° panoramic sunrise above the clouds.",
      description: "Kalsubai is the highest peak in Maharashtra at 1646 metres above sea level, often called the 'Everest of Maharashtra'. Located in the Sahyadri range near Bhandardara, the trek offers spectacular views of the Western Ghats. The trail is well-marked and passes through dense forests and rocky terrain. At the summit stands a small temple of Goddess Kalsubai. The sunrise view from the top, with clouds swirling below you, is an experience that trekkers describe as life-changing. Best done in the monsoon or winter seasons.",
      location: "Bhandardara, Ahmednagar",
      category: categories["Camping Trek"],
      difficulty: "Moderate",
      height: 1646,
      grade: "T2",
      range: "Sahyadri",
      route: "Bari Village Route",
      base: "Bari Village",
      duration: "1 Day",
      price: 999,
      startDate: d(7),
      endDate: d(7),
      registrationDeadline: d(5),
      maxParticipants: 35,
      currentParticipants: 20,
      images: [
        "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80",
        "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
      ],
      itinerary: [
        { day: 1, dayTitle: "Night Drive & Summit", title: "Kalsubai Summit", description: "Depart midnight from Mumbai. Reach base at 4 AM. Begin summit trek at 4:30 AM. Reach summit by 6:30 AM for sunrise. Descend and head back.", activities: ["Night trek", "Sunrise at summit", "Temple visit", "Photography"] },
      ],
      inclusions: ["Trek guide", "First aid", "Light breakfast at summit"],
      exclusions: ["Transport", "Personal meals", "Insurance"],
      requirements: ["Trekking shoes", "Warm jacket (essential)", "Torch", "2L water", "Snacks"],
      pickupPoints: ["Dadar (11:30 PM)", "Thane (12:00 AM)", "Kasara (1:30 AM)"],
      status: "Upcoming",
      isFeatured: false,
      isActive: true,
      createdBy: admin._id,
    },
    {
      title: "Raigad Fort Trek",
      shortDescription: "Walk in the footsteps of Chhatrapati Shivaji Maharaj at the historic capital fort of the Maratha Empire.",
      description: "Raigad Fort was the capital of Chhatrapati Shivaji Maharaj's Maratha Empire. Perched at 820 metres, the fort offers a deep dive into Maharashtra's rich Maratha history. The trek from Pachad village to the fort top takes you through ancient stone pathways, past the Maha Darwaja (main gate), the Jijabai wada, Shivaji's samadhi, and the iconic Takmak Tok cliff. The ropeway option is also available for those who prefer. This trek is as much a history lesson as it is an adventure — perfect for heritage enthusiasts.",
      location: "Mahad, Raigad",
      category: categories["Heritage Trek"],
      difficulty: "Easy",
      height: 820,
      grade: "T1",
      range: "Sahyadri",
      route: "Pachad Village Route",
      base: "Pachad Village",
      duration: "1 Day",
      price: 1299,
      startDate: d(35),
      endDate: d(35),
      registrationDeadline: d(33),
      maxParticipants: 40,
      currentParticipants: 3,
      images: [
        "https://images.unsplash.com/photo-1586348943529-beaae6c28db9?w=800&q=80",
        "https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?w=800&q=80",
      ],
      itinerary: [
        { day: 1, dayTitle: "Raigad Heritage Walk", title: "Fort Exploration", description: "Depart early from Mumbai. Reach Pachad by 9 AM. Trek up through the Maha Darwaja. Explore the fort complex including Shivaji's throne, samadhi, and Takmak Tok. Descend and return.", activities: ["Heritage walk", "Fort exploration", "Photography", "History briefing"] },
      ],
      inclusions: ["Certified guide with historical knowledge", "First aid", "Bottled water at summit"],
      exclusions: ["Transport", "Fort entry ticket (₹20)", "Ropeway charges", "Meals"],
      requirements: ["Comfortable walking shoes", "Cap/hat", "Sunscreen", "Water bottle"],
      pickupPoints: ["CST Mumbai (6:00 AM)", "Vashi (6:30 AM)", "Panvel (7:00 AM)"],
      status: "Upcoming",
      isFeatured: false,
      isActive: true,
      createdBy: admin._id,
    },
    {
      title: "Bhimashankar Wildlife Trek",
      shortDescription: "Trek through a UNESCO biodiversity hotspot to the ancient Jyotirlinga temple, home to the Giant Squirrel.",
      description: "Bhimashankar is a Jyotirlinga temple and a wildlife sanctuary in the Western Ghats. The trek through the Bhimashankar Wildlife Sanctuary takes you through pristine forests that are home to the Indian Giant Squirrel (Maharashtra's state animal), leopards, sloth bears, and over 200 species of birds. The route from Khandas village passes through dense Shola forests and waterfalls. The ancient Bhimashankar temple at the top is believed to date back over 700 years. A spiritually and ecologically enriching experience.",
      location: "Pune District, Maharashtra",
      category: categories["Waterfall Trek"],
      difficulty: "Moderate",
      height: 1033,
      grade: "T2",
      range: "Sahyadri",
      route: "Khandas Village Route",
      base: "Khandas Village",
      duration: "1 Day",
      price: 1199,
      startDate: d(42),
      endDate: d(42),
      registrationDeadline: d(40),
      maxParticipants: 30,
      currentParticipants: 0,
      images: [
        "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80",
        "https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&q=80",
      ],
      itinerary: [
        { day: 1, dayTitle: "Forest & Temple Trek", title: "Bhimashankar Trek", description: "Drive from Pune. Trek through Khandas forest trail. Spot wildlife — especially Indian Giant Squirrel. Visit the ancient Bhimashankar temple. Return by evening.", activities: ["Wildlife spotting", "Forest trail", "Temple visit", "Waterfall pit stop"] },
      ],
      inclusions: ["Naturalist guide", "First aid", "Forest entry permit", "Breakfast"],
      exclusions: ["Transport", "Lunch", "Personal expenses"],
      requirements: ["Silent movement (wildlife area)", "Comfortable shoes", "Camera (optional)", "Water 2L"],
      pickupPoints: ["Shivajinagar Pune (5:30 AM)", "Wakad Pune (6:00 AM)"],
      status: "Upcoming",
      isFeatured: false,
      isActive: true,
      createdBy: admin._id,
    },
  ];

  let created = 0;
  for (const trekData of treks) {
    const exists = await Trek.findOne({ title: trekData.title });
    if (!exists) {
      await Trek.create(trekData);
      created++;
      console.log(`Trek created: ${trekData.title}`);
    } else {
      console.log(`Trek already exists: ${trekData.title}`);
    }
  }

  console.log(`\n✅ Seed complete. ${created} treks created.`);
  console.log("Admin login → email: admin@avirtrekkers.com | password: Admin@123");
  await mongoose.disconnect();
}

seed().catch(err => { console.error(err); process.exit(1); });
