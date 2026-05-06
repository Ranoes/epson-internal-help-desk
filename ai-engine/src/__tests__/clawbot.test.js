const { search, buildSystemPrompt, loadKnowledgeBase } = require("../clawbot");
const path = require("path");

// Point Clawbot at the test fixtures directory
process.env.KNOWLEDGE_BASE_DIR = path.join(__dirname, "fixtures");

const fs = require("fs");
const FIXTURES_DIR = path.join(__dirname, "fixtures");

beforeAll(() => {
  fs.mkdirSync(FIXTURES_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(FIXTURES_DIR, "sop-test.md"),
    `# SOP Pengujian Printer
Langkah 1: Pastikan printer terhubung ke jaringan.
Langkah 2: Buka panel kontrol printer.
Langkah 3: Cetak halaman uji diagnostik.
Prosedur ini berlaku untuk semua lini produk Epson.`
  );
});

afterAll(() => {
  fs.rmSync(FIXTURES_DIR, { recursive: true, force: true });
});

describe("loadKnowledgeBase", () => {
  it("loads chunks from the fixture file", () => {
    const chunks = loadKnowledgeBase();
    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks[0]).toHaveProperty("source");
    expect(chunks[0]).toHaveProperty("text");
  });
});

describe("search", () => {
  it("returns relevant chunks for a matching query", () => {
    const results = search("printer diagnostik");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].score).toBeGreaterThan(0);
  });

  it("returns empty array for non-matching query", () => {
    const results = search("xyz123 nonexistent");
    expect(results).toHaveLength(0);
  });
});

describe("buildSystemPrompt", () => {
  it("includes SOP context for matching query", () => {
    const prompt = buildSystemPrompt("printer diagnostik");
    expect(prompt).toContain("SOP");
    expect(prompt).toContain("sop-test.md");
  });

  it("returns base prompt when no match", () => {
    const prompt = buildSystemPrompt("xyz123 nonexistent");
    expect(prompt).toContain("Epson");
    expect(prompt).not.toContain("sop-test.md");
  });
});
