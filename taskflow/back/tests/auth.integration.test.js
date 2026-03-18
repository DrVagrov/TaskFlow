const mongoose = require("mongoose");
const request = require("supertest");
const bcrypt = require("bcrypt");

const app = require("../src/app");
const User = require("../src/models/User");
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

describe("Auth - Jest + Supertest", () => {
  test("POST /api/auth/register cree un user avec password hash", async () => {
    const res = await request(app).post("/api/auth/register").send({
      username: "auth_register_user",
      email: "auth_register_user@test.local",
      password: "password123",
    });

    expect(res.status).toBe(201);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe("auth_register_user@test.local");

    const user = await User.findOne({ email: "auth_register_user@test.local" }).select("+password");
    expect(user).not.toBeNull();
    expect(user.password).not.toBe("password123");
    const isHashMatching = await bcrypt.compare("password123", user.password);
    expect(isHashMatching).toBe(true);
  });

  test("POST /api/auth/login retourne un token valide", async () => {
    await request(app).post("/api/auth/register").send({
      username: "auth_login_user",
      email: "auth_login_user@test.local",
      password: "password123",
    });

    const res = await request(app).post("/api/auth/login").send({
      email: "auth_login_user@test.local",
      password: "password123",
    });

    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe("string");
    expect(res.body.token.length).toBeGreaterThan(20);
    expect(res.body.user.email).toBe("auth_login_user@test.local");
  });

  test("POST /api/auth/login refuse un mauvais mot de passe", async () => {
    await request(app).post("/api/auth/register").send({
      username: "auth_bad_password_user",
      email: "auth_bad_password_user@test.local",
      password: "password123",
    });

    const res = await request(app).post("/api/auth/login").send({
      email: "auth_bad_password_user@test.local",
      password: "wrong_password",
    });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Identifiants invalides");
  });

  test("POST /api/auth/login accepte un username comme identifiant", async () => {
    await request(app).post("/api/auth/register").send({
      username: "auth_login_by_username",
      email: "auth_login_by_username@test.local",
      password: "password123",
    });

    const res = await request(app).post("/api/auth/login").send({
      identifier: "auth_login_by_username",
      password: "password123",
    });

    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe("string");
    expect(res.body.user.username).toBe("auth_login_by_username");
  });

  test("POST /api/auth/register-admin refuse un utilisateur non-admin", async () => {
    const requester = await registerAndLogin({
      username: "auth_requester_user",
      email: "auth_requester_user@test.local",
      password: "password123",
    });

    const targetRegisterRes = await request(app).post("/api/auth/register").send({
      username: "auth_target_user",
      email: "auth_target_user@test.local",
      password: "password123",
    });
    expect(targetRegisterRes.status).toBe(201);

    const res = await request(app)
      .post("/api/auth/register-admin")
      .set("Authorization", `Bearer ${requester.token}`)
      .send({ userId: targetRegisterRes.body.user.id });

    expect(res.status).toBe(403);
    expect(res.body.message).toBe("Acces refuse");
  });

  test("POST /api/auth/register-admin autorise un admin et persiste en base", async () => {
    const requester = await registerAndLogin({
      username: "auth_admin_requester",
      email: "auth_admin_requester@test.local",
      password: "password123",
    });

    await Admin.create({ userId: requester.userId });

    const targetRegisterRes = await request(app).post("/api/auth/register").send({
      username: "auth_target_promoted",
      email: "auth_target_promoted@test.local",
      password: "password123",
    });
    expect(targetRegisterRes.status).toBe(201);

    const res = await request(app)
      .post("/api/auth/register-admin")
      .set("Authorization", `Bearer ${requester.token}`)
      .send({ userId: targetRegisterRes.body.user.id });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe("Admin enregistre");

    const adminInDb = await Admin.findOne({ userId: targetRegisterRes.body.user.id });
    expect(adminInDb).not.toBeNull();
  });

  
  test("DELETE /api/auth/remove-admin autorise la suppression si plus de 3 admins", async () => {
    const adminA = await registerAndLogin({
      username: "remove_admin_ok_a",
      email: "remove_admin_ok_a@test.local",
      password: "password123",
    });
    const adminB = await registerAndLogin({
      username: "remove_admin_ok_b",
      email: "remove_admin_ok_b@test.local",
      password: "password123",
    });
    const adminC = await registerAndLogin({
      username: "remove_admin_ok_c",
      email: "remove_admin_ok_c@test.local",
      password: "password123",
    });
    const adminD = await registerAndLogin({
      username: "remove_admin_ok_d",
      email: "remove_admin_ok_d@test.local",
      password: "password123",
    });

    await Admin.create({ userId: adminA.userId });
    await Admin.create({ userId: adminB.userId });
    await Admin.create({ userId: adminC.userId });
    await Admin.create({ userId: adminD.userId });

    const res = await request(app)
      .delete("/api/auth/remove-admin")
      .set("Authorization", `Bearer ${adminA.token}`)
      .send({ userId: adminB.userId });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Admin retire");

    const removed = await Admin.findOne({ userId: adminB.userId });
    expect(removed).toBeNull();
  });
});
