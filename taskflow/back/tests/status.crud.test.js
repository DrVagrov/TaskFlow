const mongoose = require("mongoose");
const request = require("supertest");

const app = require("../src/app");
const Status = require("../src/models/Status");
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

describe("Status CRUD - Jest + Supertest", () => {
  test("POST /api/status cree un status en base", async () => {
    const { token } = await registerAndLogin({
      username: "status_create_user",
      email: "status_create_user@test.local",
      password: "password123",
    });

    const res = await request(app)
      .post("/api/status")
      .set("Authorization", `Bearer ${token}`)
      .send({ label: "En attente" });

    expect(res.status).toBe(201);
    expect(res.body._id).toBeDefined();

    const status = await Status.findById(res.body._id);
    expect(status).not.toBeNull();
    expect(status.label).toBe("En attente");
  });

  test("GET /api/status retourne les status", async () => {
    const { token } = await registerAndLogin({
      username: "status_list_user",
      email: "status_list_user@test.local",
      password: "password123",
    });

    await Status.create({ label: "Fini" });

    const res = await request(app).get("/api/status").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
    expect(res.body[0].label).toBe("Fini");
  });

  test("PUT /api/status/:id met a jour le status en base", async () => {
    const { token } = await registerAndLogin({
      username: "status_update_user",
      email: "status_update_user@test.local",
      password: "password123",
    });

    const status = await Status.create({ label: "Old Label" });

    const res = await request(app)
      .put(`/api/status/${status._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ label: "New Label" });

    expect(res.status).toBe(200);
    expect(res.body.label).toBe("New Label");

    const statusInDb = await Status.findById(status._id);
    expect(statusInDb.label).toBe("New Label");
  });

  test("DELETE /api/status/:id refuse non-admin puis autorise admin", async () => {
    const user = await registerAndLogin({
      username: "status_delete_user",
      email: "status_delete_user@test.local",
      password: "password123",
    });

    const status = await Status.create({ label: "To Delete" });

    const forbiddenRes = await request(app)
      .delete(`/api/status/${status._id}`)
      .set("Authorization", `Bearer ${user.token}`);

    expect(forbiddenRes.status).toBe(403);

    await Admin.create({ userId: user.userId });

    const okRes = await request(app)
      .delete(`/api/status/${status._id}`)
      .set("Authorization", `Bearer ${user.token}`);

    expect(okRes.status).toBe(200);
    expect(okRes.body.message).toBe("Status supprime");

    const statusInDb = await Status.findById(status._id);
    expect(statusInDb).toBeNull();
  });
});
