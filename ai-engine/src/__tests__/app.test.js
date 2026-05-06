const request = require("supertest");
const app = require("../index");

describe("AI Engine – health check", () => {
  it("GET /health returns ok", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });
});

describe("POST /search – validation", () => {
  it("returns 400 when query is missing", async () => {
    const res = await request(app).post("/search").send({});
    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });
});

describe("POST /chat – validation", () => {
  it("returns 400 when message is missing", async () => {
    const res = await request(app).post("/chat").send({});
    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });
});
