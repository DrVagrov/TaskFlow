const mongoose = require("mongoose");
const request = require("supertest");

const app = require("../src/app");
const Category = require("../src/models/Category");
const Admin = require("../src/models/Admin");

const MONGO_URI_TEST = process.env.MONGO_URI_TEST || "mongodb://127.0.0.1:27017/taskflow_test";

const registerAndLogin = async ({ username, email, password }) => {
  const registerRes = await request(app).post("/api/auth/register").send({ username, email, password });
  expect(registerRes.status).toBe(201);

  const loginRes = await request(app).post("/api/auth/login").send({ email, password });
  expect(loginRes.status).toBe(200);

  return {
    token: loginRes.body.token,
    userId: registerRes.body.user.id,
  };
};

beforeAll(async () => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || "test_jwt_secret";
  await mongoose.connect(MONGO_URI_TEST);
});

beforeEach(async () => {
  await mongoose.connection.dropDatabase();
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

describe("Category CRUD - Jest + Supertest", () => {
  test("POST /api/categories cree une category en base", async () => {
    const { token } = await registerAndLogin({
      username: "category_create_user",
      email: "category_create_user@test.local",
      password: "password123",
    });

    const res = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Design" });

    expect(res.status).toBe(201);
    expect(res.body._id).toBeDefined();

    const category = await Category.findById(res.body._id);
    expect(category).not.toBeNull();
    expect(category.name).toBe("Design");
  });

  test("GET /api/categories retourne les categories", async () => {
    const { token } = await registerAndLogin({
      username: "category_list_user",
      email: "category_list_user@test.local",
      password: "password123",
    });

    await Category.create({ name: "Data" });

    const res = await request(app).get("/api/categories").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
    expect(res.body[0].name).toBe("Data");
  });

  test("GET /api/categories/:id retourne la category cible", async () => {
    const { token } = await registerAndLogin({
      username: "category_get_user",
      email: "category_get_user@test.local",
      password: "password123",
    });

    const category = await Category.create({ name: "Communication" });

    const res = await request(app)
      .get(`/api/categories/${category._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body._id).toBe(category._id.toString());
    expect(res.body.name).toBe("Communication");
  });

  test("PUT /api/categories/:id met a jour la category en base", async () => {
    const { token } = await registerAndLogin({
      username: "category_update_user",
      email: "category_update_user@test.local",
      password: "password123",
    });

    const category = await Category.create({ name: "Old Name" });

    const res = await request(app)
      .put(`/api/categories/${category._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "New Name" });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("New Name");

    const categoryInDb = await Category.findById(category._id);
    expect(categoryInDb.name).toBe("New Name");
  });

  test("DELETE /api/categories/:id refuse non-admin puis autorise admin", async () => {
    const user = await registerAndLogin({
      username: "category_delete_user",
      email: "category_delete_user@test.local",
      password: "password123",
    });

    const category = await Category.create({ name: "To Delete" });

    const forbiddenRes = await request(app)
      .delete(`/api/categories/${category._id}`)
      .set("Authorization", `Bearer ${user.token}`);

    expect(forbiddenRes.status).toBe(403);

    await Admin.create({ userId: user.userId });

    const okRes = await request(app)
      .delete(`/api/categories/${category._id}`)
      .set("Authorization", `Bearer ${user.token}`);

    expect(okRes.status).toBe(200);
    expect(okRes.body.message).toBe("Categorie supprimee");

    const categoryInDb = await Category.findById(category._id);
    expect(categoryInDb).toBeNull();
  });
});
