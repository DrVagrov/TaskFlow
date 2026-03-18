const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const Status = require("../models/Status");
const Category = require("../models/Category");
const User = require("../models/User");
const Admin = require("../models/Admin");

// Default Values for status and categories
const DEFAULT_STATUSES = ["To do", "En cours", "Fini"];
const DEFAULT_CATEGORIES = ["Design", "Developpement", "Data", "Communication"];
const DEFAULT_ADMIN_USERNAME = process.env.DEFAULT_ADMIN_USERNAME || "admin";
const DEFAULT_ADMIN_EMAIL = process.env.DEFAULT_ADMIN_EMAIL || "admin@taskflow.local";
const DEFAULT_ADMIN_PASSWORD = process.env.DEFAULT_ADMIN_PASSWORD || "admin12345";

//Build the default statuses, if one of the statuses already exists, do not create a duplicate.
const buildDefaultStatus = async () => {
  await Promise.all(
    DEFAULT_STATUSES.map((label) =>
      Status.updateOne({ label }, { $setOnInsert: { label } }, { upsert: true })
    )
  );
};
//Build the default categories, if one of the categories already exists, do not create a duplicate.
const buildDefaultCategories = async () => {
  await Promise.all(
    DEFAULT_CATEGORIES.map((name) =>
      Category.updateOne({ name }, { $setOnInsert: { name } }, { upsert: true })
    )
  );
};

const buildDefaultAdminUser = async () => {
  let user = await User.findOne({ email: DEFAULT_ADMIN_EMAIL });

  if (!user) {
    const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10);
    user = await User.create({
      username: DEFAULT_ADMIN_USERNAME,
      email: DEFAULT_ADMIN_EMAIL,
      password: hashedPassword,
    });
  }

  await Admin.updateOne(
    { userId: user._id },
    { $setOnInsert: { userId: user._id } },
    { upsert: true }
  );
};
// Reset DataBase
const clearDatabase = async () => {
  if (mongoose.connection.readyState !== 1) {
    throw new Error("Connexion MongoDB requise avant clearDatabase()");
  }

  await mongoose.connection.dropDatabase();
  console.log("Base de donnees videe");
};
//Connect to Mongoose and MongoDB
const connectDB = async () => {
  const MONGO_URI = process.env.MONGO_URI??process.env.MONGO_URL;
  if (!MONGO_URI) {
    console.error("MONGO_URI et MONGO_URL manquant dans les variables d'environnement.");
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connecte");

  } catch (error) {
    console.error("Erreur connexion MongoDB :", error.message);
    process.exit(1);
  }
};
//fill the data base with the default value for Categories and Status 
const fillWithBaseCatAndStat= async() =>{
    await buildDefaultStatus();
    await buildDefaultCategories();
    await buildDefaultAdminUser();
    console.log("Statuts par defaut verifies");
    console.log("Categories par defaut verifiees");
    console.log("Utilisateur admin par defaut verifie");
};

module.exports = connectDB;
module.exports.clearDatabase = clearDatabase;
module.exports.fillWithBaseCatAndStat = fillWithBaseCatAndStat;
