const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "TaskFlow API",
      version: "1.0.0",
      description: "API backend TaskFlow avec MongoDB/Mongoose",
    },
    servers: [
      {
        url: "http://localhost:5000",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        Category: {
          type: "object",
          properties: {
            _id: { type: "string" },
            name: { type: "string" },
          },
        },
        CategoryInput: {
          type: "object",
          required: ["name"],
          properties: {
            name: { type: "string" },
          },
        },
        Status: {
          type: "object",
          properties: {
            _id: { type: "string" },
            label: { type: "string" },
          },
        },
        StatusInput: {
          type: "object",
          required: ["label"],
          properties: {
            label: { type: "string" },
          },
        },
        User: {
          type: "object",
          properties: {
            _id: { type: "string" },
            username: { type: "string" },
            email: { type: "string" },
          },
        },
        Admin: {
          type: "object",
          properties: {
            id: { type: "string" },
            user: { $ref: "#/components/schemas/User" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        RegisterInput: {
          type: "object",
          required: ["username", "email", "password"],
          properties: {
            username: { type: "string" },
            email: { type: "string" },
            password: { type: "string", format: "password" },
          },
        },
        LoginInput: {
          type: "object",
          required: ["identifier", "password"],
          properties: {
            identifier: { type: "string", description: "Email ou username" },
            password: { type: "string", format: "password" },
          },
        },
        AuthSuccessResponse: {
          type: "object",
          properties: {
            message: { type: "string" },
            token: { type: "string" },
            user: { $ref: "#/components/schemas/User" },
          },
        },
        AdminRegisterInput: {
          type: "object",
          required: ["userId"],
          properties: {
            userId: { type: "string" },
          },
        },
        AdminRegisterResponse: {
          type: "object",
          properties: {
            message: { type: "string" },
            admin: { $ref: "#/components/schemas/Admin" },
          },
        },
        Task: {
          type: "object",
          properties: {
            _id: { type: "string" },
            title: { type: "string" },
            description: { type: "string" },
            dueDate: { type: "string", format: "date", nullable: true, example: "2026-12-31" },
            idCategory: {
              oneOf: [{ type: "string" }, { $ref: "#/components/schemas/Category" }],
            },
            idStatu: {
              oneOf: [{ type: "string" }, { $ref: "#/components/schemas/Status" }],
            },
            idUser: {
              oneOf: [{ type: "string" }, { $ref: "#/components/schemas/User" }],
            },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        TaskInput: {
          type: "object",
          required: ["title", "idCategory", "idStatu", "idUser"],
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            dueDate: { type: "string", format: "date", example: "2026-12-31" },
            idCategory: { type: "string" },
            idStatu: { type: "string" },
            idUser: { type: "string" },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            message: { type: "string" },
            error: { type: "string" },
          },
        },
      },
    },
  },
  apis: ["./back/src/routes/*.js"],
};

const getSwaggerSpec = () => swaggerJsdoc(options);

module.exports = getSwaggerSpec;
