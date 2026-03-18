require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const User = require("../src/models/User");
const Admin = require("../src/models/Admin");
const Category = require("../src/models/Category");
const Status = require("../src/models/Status");
const Task = require("../src/models/Task");

const MONGO_URI = process.env.MONGO_URI ?? proces.env.Mongo_URL;

const usernames = [
  "alice",
  "bob",
  "charlie",
  "diana",
  "eric",
  "fatima",
  "georges",
  "hana",
  "admin",
];

const categoryNames = ["Design", "Developpement", "Data", "Communication", "Marketing"];
const statusLabels = ["To do", "En cours", "Fini"];

const taskTitles = [
  "Finaliser maquette home",
  "Corriger bug API auth",
  "Mettre a jour Swagger",
  "Analyser feedback utilisateurs",
  "Optimiser requete MongoDB",
  "Preparer presentation sprint",
  "Refactor middleware validation",
  "Ajouter tests integration",
  "Creer rapport hebdomadaire",
  "Nettoyer backlog produit",
];

const randomFrom = (list) => list[Math.floor(Math.random() * list.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const toDateOnly = (date) => {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const createUsers = async () => {
  const hashedPassword = await bcrypt.hash("password123", 10);

  const usersPayload = usernames.map((username, index) => ({
    username,
    email: `${username}@taskflow.local`,
    password: hashedPassword,
  }));

  return User.insertMany(usersPayload);
};

const createAdmins = async (users) => {
  const adminUser = users.find((user) => user.username === "admin");
  if (!adminUser) {
    throw new Error("Utilisateur admin introuvable pour le seed");
  }
  return Admin.insertMany([{ userId: adminUser._id }]);
};

const createCategories = async () => {
  return Category.insertMany(categoryNames.map((name) => ({ name })));
};

const createStatuses = async () => {
  return Status.insertMany(statusLabels.map((label) => ({ label })));
};

const createTasks = async (users, categories, statuses) => {
  const now = Date.now();

  const tasksPayload = Array.from({ length: 24 }, (_, index) => ({
    title: `${randomFrom(taskTitles)} #${index + 1}`,
    description: `Tache de seed ${index + 1}`,
    dueDate: toDateOnly(new Date(now + randomInt(1, 30) * 24 * 60 * 60 * 1000)),
    idCategory: randomFrom(categories)._id,
    idStatu: randomFrom(statuses)._id,
    idUser: randomFrom(users)._id,
  }));

  return Task.insertMany(tasksPayload);
};

const seed = async () => {
  if (!MONGO_URI) {
    throw new Error("MONGO_URI manquant dans .env");
  }

  await mongoose.connect(MONGO_URI);

  await Promise.all([
    Task.deleteMany({}),
    Admin.deleteMany({}),
    User.deleteMany({}),
    Category.deleteMany({}),
    Status.deleteMany({}),
  ]);

  const users = await createUsers();
  await createAdmins(users);
  const categories = await createCategories();
  const statuses = await createStatuses();
  const tasks = await createTasks(users, categories, statuses);

  console.log("Seed termine");
  console.log(`Users: ${users.length}`);
  console.log("Admins: 1");
  console.log(`Categories: ${categories.length}`);
  console.log(`Status: ${statuses.length}`);
  console.log(`Tasks: ${tasks.length}`);
};

seed()
  .catch((error) => {
    console.error("Erreur seed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
