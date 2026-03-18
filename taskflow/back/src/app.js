//Import des librairy
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

//Import du Swagger
const swaggerUi = require("swagger-ui-express");
const getSwaggerSpec = require("./docs/swagger");

//Import des routes
const taskRoutes = require("./routes/task.routes");
const categoryRoutes = require("./routes/category.routes");
const statusRoutes = require("./routes/status.routes");
const authRoutes = require("./routes/auth.routes");

const app = express();

app.use(cors({origin : ['http://localhost:3000',("https://"+FONT_PUBLIC_DOMAIN)]}));
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

app.get("/api-docs.json", (_req, res) => {
  res.set("Cache-Control", "no-store");
  res.json(getSwaggerSpec());
});

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(null, {
    explorer: true,
    swaggerOptions: {
      url: "/api-docs.json",
    },
  })
);
app.use("/api/tasks", taskRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/status", statusRoutes);
app.use("/api/auth", authRoutes);

app.get("/api/task", (req, res) => {
  res.status(200).json({
    message: "TaskFlow API running",
  });
});

module.exports = app;
