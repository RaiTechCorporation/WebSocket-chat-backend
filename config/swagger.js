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
                url: "/",
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
// 🔐 LOGOUT
// =========================
"/users/logout": {
  post: {
    summary: "Logout user",
    description: "Invalidate JWT token by adding it to blacklist",
    tags: ["Auth"],
    security: [
      {
        bearerAuth: [],
      },
    ],
    responses: {
      200: {
        description: "Logout successful",
      },
      400: {
        description: "Token required",
      },
      401: {
        description: "Unauthorized / Invalid token",
      },
      500: {
        description: "Server error",
      },
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

    "/users/status": {
  get: {
    summary: "Get user statuses (last 24 hours)",
    tags: ["Users"],
    security: [
      {
        bearerAuth: [],
      },
    ],
    responses: {
      200: {
        description: "Statuses fetched successfully",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: {
                  type: "boolean",
                  example: true,
                },
                statuses: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      _id: {
                        type: "string",
                        example: "661234abcd1234",
                      },
                      userId: {
                        type: "object",
                        properties: {
                          _id: {
                            type: "string",
                            example: "661111abcd1111",
                          },
                          name: {
                            type: "string",
                            example: "John Doe",
                          },
                          profilePic: {
                            type: "string",
                            example: "http://localhost:3000/uploads/profile.jpg",
                          },
                        },
                      },
                      stories: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            _id: {
                              type: "string",
                            },
                            url: {
                              type: "string",
                              example: "http://localhost:3000/uploads/status1.jpg",
                            },
                            caption: {
                              type: "string",
                              example: "My status",
                            },
                            createdAt: {
                              type: "string",
                              format: "date-time",
                            },
                          },
                        },
                      },
                      createdAt: {
                        type: "string",
                        format: "date-time",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      401: {
        description: "Unauthorized",
      },
      500: {
        description: "Internal Server Error",
      },
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
    // =========================
// 🚫 BLOCK USERS
// =========================

"/api/block": {
    post: {
        summary: "Block a user",
        tags: ["Block"],
        security: [{ bearerAuth: [] }],
        requestBody: {
            required: true,
            content: {
                "application/json": {
                    schema: {
                        type: "object",
                        properties: {
                            userId: {
                                type: "string",
                                example: "64f123abc123"
                            }
                        }
                    }
                }
            }
        },
        responses: {
            200: {
                description: "User blocked successfully"
            },
            400: {
                description: "User already blocked or invalid request"
            }
        }
    }
},

// =========================
// 📊 BLOCK STATUS
// =========================

"/api/blocked-status/{targetUserId}": {
    get: {
        summary: "Check block status between users",
        tags: ["Block"],
        security: [{ bearerAuth: [] }],
        parameters: [
            {
                name: "targetUserId",
                in: "path",
                required: true,
                schema: {
                    type: "string"
                },
                example: "64f123abc456"
            }
        ],
        responses: {
            200: {
                description: "Block status fetched",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                isBlocked: {
                                    type: "boolean",
                                    example: true
                                },
                                details: {
                                    type: "object",
                                    nullable: true
                                }
                            }
                        }
                    }
                }
            }
        }
    }
},

// =========================
// 📥 GET BLOCKED USERS
// =========================

"/api/blocked-users": {
    get: {
        summary: "Get all blocked users list",
        tags: ["Block"],
        security: [{ bearerAuth: [] }],
        responses: {
            200: {
                description: "List of blocked users",
                content: {
                    "application/json": {
                        schema: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    _id: { type: "string" },
                                    blocked: {
                                        type: "object",
                                        properties: {
                                            name: { type: "string" },
                                            email: { type: "string" }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
},

// =========================
// 🟢 UNBLOCK USER
// =========================

"/api/unblock": {
    post: {
        summary: "Unblock a user",
        tags: ["Block"],
        security: [{ bearerAuth: [] }],
        requestBody: {
            required: true,
            content: {
                "application/json": {
                    schema: {
                        type: "object",
                        properties: {
                            blockedId: {
                                type: "string",
                                example: "64f123abc456"
                            }
                        }
                    }
                }
            }
        },
        responses: {
            200: {
                description: "User unblocked successfully"
            }
        }
    }
}
};

module.exports = swaggerSpec;