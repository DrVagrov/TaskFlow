const mongoose = require("mongoose");
const request = require("supertest");

const app = require("../src/app");
const Category = require("../src/models/Category");
const Status = require("../src/models/Status");
const Task = require("../src/models/Task");
const Admin = require("../src/models/Admin");

const MONGO_URI_TEST = process.env.MONGO_URI_TEST || "mongodb://127.0.0.1:27017/taskflow_test";

let categoryId;
let statusId;

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
  const category = await Category.create({ name: "Test Category" });
  const status = await Status.create({ label: "Test Status" });
  categoryId = category._id.toString();
  statusId = status._id.toString();
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

describe("Task CRUD - Jest + Supertest", () => {
  test("POST /api/tasks cree une task en base", async () => {
    const { token, userId } = await registerAndLogin({
      username: "crud_create_user",
      email: "crud_create_user@test.local",
      password: "password123",
    });

    const res = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Create task",
        description: "Create CRUD test",
        dueDate: "2026-12-31",
        idCategory: categoryId,
        idStatu: statusId,
        idUser: userId,
      });

    expect(res.status).toBe(201);
    expect(res.body._id).toBeDefined();

    const task = await Task.findById(res.body._id);
    expect(task).not.toBeNull();
    expect(task.title).toBe("Create task");
    expect(task.dueDate).toBe("2026-12-31");
  });

  test("GET /api/tasks retourne les tasks", async () => {
    const user = await registerAndLogin({
      username: "crud_list_user",
      email: "crud_list_user@test.local",
      password: "password123",
    });
    await Admin.create({ userId: user.userId });

    await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${user.token}`)
      .send({
        title: "Task 1",
        description: "List CRUD test",
        idCategory: categoryId,
        idStatu: statusId,
        idUser: user.userId,
      });

    const res = await request(app).get("/api/tasks").set("Authorization", `Bearer ${user.token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
    expect(res.body[0].title).toBe("Task 1");
  });

  test("GET /api/tasks refuse un utilisateur non-admin", async () => {
    const user = await registerAndLogin({
      username: "crud_list_forbidden_user",
      email: "crud_list_forbidden_user@test.local",
      password: "password123",
    });

    const res = await request(app).get("/api/tasks").set("Authorization", `Bearer ${user.token}`);
    expect(res.status).toBe(403);
  });

  test("GET /api/tasks/:id retourne la task cible", async () => {
    const { token, userId } = await registerAndLogin({
      username: "crud_get_user",
      email: "crud_get_user@test.local",
      password: "password123",
    });

    const createRes = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Task to read",
        description: "Read CRUD test",
        idCategory: categoryId,
        idStatu: statusId,
        idUser: userId,
      });

    const res = await request(app)
      .get(`/api/tasks/${createRes.body._id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body._id).toBe(createRes.body._id);
    expect(res.body.title).toBe("Task to read");
  });

  test("PUT /api/tasks/:id met a jour la task en base", async () => {
    const { token, userId } = await registerAndLogin({
      username: "crud_update_user",
      email: "crud_update_user@test.local",
      password: "password123",
    });

    const createRes = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Task before update",
        description: "Update CRUD test",
        idCategory: categoryId,
        idStatu: statusId,
        idUser: userId,
      });

    const res = await request(app)
      .put(`/api/tasks/${createRes.body._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Task after update",
        description: "Updated value",
      });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe("Task after update");

    const task = await Task.findById(createRes.body._id);
    expect(task.title).toBe("Task after update");
    expect(task.description).toBe("Updated value");
  });

  test("DELETE /api/tasks/:id supprime la task en base", async () => {
    const { token, userId } = await registerAndLogin({
      username: "crud_delete_user",
      email: "crud_delete_user@test.local",
      password: "password123",
    });

    const createRes = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Task to delete",
        description: "Delete CRUD test",
        idCategory: categoryId,
        idStatu: statusId,
        idUser: userId,
      });

    const res = await request(app)
      .delete(`/api/tasks/${createRes.body._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Task supprimee");

    const task = await Task.findById(createRes.body._id);
    expect(task).toBeNull();
  });
});
