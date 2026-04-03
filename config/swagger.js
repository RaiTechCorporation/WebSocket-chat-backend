const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Chat App API",
      version: "1.0.0",
    },
    servers: [
      {
        url: "http://localhost:9000",
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
    },

    // ✅ GLOBAL TOKEN (sab APIs me auto apply hoga)
    security: [
      {
        bearerAuth: [],
      },
    ],
  },

  apis: [], // no route scanning
};

const swaggerSpec = swaggerJsdoc(options);

// 👇 ALL APIs
swaggerSpec.paths = {
  // =========================
  // 🔓 REGISTER (NO TOKEN)
  // =========================
  "/users/register": {
    post: {
      summary: "Register new user",
      tags: ["Users"],
      security: [], // ❌ public
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["name", "email", "password"],
              properties: {
                name: { type: "string", example: "Devesh" },
                email: { type: "string", example: "test@gmail.com" },
                password: { type: "string", example: "123456" },
              },
            },
          },
        },
      },
      responses: {
        201: { description: "User registered successfully" },
        400: { description: "User already exists" },
      },
    },
  },

  // =========================
  // 🔓 LOGIN (NO TOKEN)
  // =========================
  "/users/login": {
    post: {
      summary: "Login user",
      tags: ["Users"],
      security: [], // ❌ public
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                email: { type: "string", example: "test@gmail.com" },
                password: { type: "string", example: "123456" },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "Login success" },
        401: { description: "Invalid credentials" },
      },
    },
  },

  // =========================
  // 🔐 PROFILE
  // =========================
  "/users/profile": {
    get: {
      summary: "Get user profile",
      tags: ["Users"],
      responses: {
        200: { description: "User data" },
      },
    },
  },

  // =========================
  // 🔐 UPDATE PROFILE
  // =========================
  "/users/update-profile/{id}": {
    post: {
      summary: "Update profile",
      tags: ["Users"],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      ],
      requestBody: {
        content: {
          "multipart/form-data": {
            schema: {
              type: "object",
              properties: {
                name: { type: "string" },
                about: { type: "string" },
                image: { type: "string", format: "binary" },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "Updated successfully" },
      },
    },
  },

  // =========================
  // 🔐 UPDATE PRIVACY
  // =========================
  "/users/update-privacy/{id}": {
    post: {
      summary: "Update privacy",
      tags: ["Users"],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      ],
      requestBody: {
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                field: { type: "string" },
                value: { type: "string" },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "Updated" },
      },
    },
  },

  // =========================
  // 🔐 STATUS UPLOAD
  // =========================
  "/users/status/upload": {
    post: {
      summary: "Upload status",
      tags: ["Users"],
      requestBody: {
        content: {
          "multipart/form-data": {
            schema: {
              type: "object",
              properties: {
                statusMedia: {
                  type: "array",
                  items: { type: "string", format: "binary" },
                },
                captions: {
                  type: "array",
                  items: { type: "string" },
                },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "Uploaded" },
      },
    },
  },

  // =========================
  // 🔐 GET MESSAGES BETWEEN USERS
  // =========================
  "/messages/message/{user1}/{user2}": {
    get: {
      summary: "Get messages between two users",
      tags: ["Messages"],
      parameters: [
        { name: "user1", in: "path", required: true, schema: { type: "string" } },
        { name: "user2", in: "path", required: true, schema: { type: "string" } },
      ],
      responses: {
        200: { description: "Messages list" },
      },
    },
  },

  // =========================
  // 🔐 GET ALL MESSAGES
  // =========================
  "/messages/all/{userId}": {
    get: {
      summary: "Get all messages of a user",
      tags: ["Messages"],
      parameters: [
        {
          name: "userId",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      ],
      responses: {
        200: { description: "All messages" },
      },
    },
  },

  // =========================
  // 🔐 UPLOAD FILES
  // =========================
  "/uploads": {
    post: {
      summary: "Upload files",
      tags: ["Uploads"],
      requestBody: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: {
              type: "object",
              properties: {
                files: {
                  type: "array",
                  items: { type: "string", format: "binary" },
                },
                senderId: { type: "string" },
                receiverId: { type: "string" },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "Files uploaded" },
      },
    },
  },

  // =========================
  // 🔐 DOWNLOAD FILE
  // =========================
  "/uploads/download": {
    get: {
      summary: "Download file",
      tags: ["Uploads"],
      parameters: [
        {
          name: "file",
          in: "query",
          required: true,
          schema: { type: "string" },
        },
      ],
      responses: {
        200: { description: "File download" },
      },
    },
  },
};

module.exports = swaggerSpec;