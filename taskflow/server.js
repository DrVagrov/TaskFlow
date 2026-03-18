require("dotenv").config();

const app = require("./back/src/app");
const connectDB = require("./back/src/config/db");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  //await connectDB.clearDatabase();
  await connectDB.fillWithBaseCatAndStat();

  app.listen(PORT, () => {
    console.log(`Serveur lance sur http://localhost:${PORT}`);
  });
};

startServer();
