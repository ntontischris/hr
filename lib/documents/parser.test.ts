// @vitest-environment node
import { describe, it, expect } from "vitest";
import { extractText, SUPPORTED_TYPES, MAX_FILE_SIZE } from "./parser";

describe("extractText", () => {
  it("should extract text from a plain text file", async () => {
    const content = "Hello, αυτό είναι ένα τεστ.";
    const file = new File([content], "test.txt", { type: "text/plain" });
    const result = await extractText(file);
    expect(result).toBe(content);
  });

  it("should reject files over MAX_FILE_SIZE", async () => {
    const bigContent = "x".repeat(MAX_FILE_SIZE + 1);
    const file = new File([bigContent], "big.txt", { type: "text/plain" });
    await expect(extractText(file)).rejects.toThrow("μέγεθος");
  });

  it("should reject unsupported file types", async () => {
    const file = new File(["data"], "image.png", { type: "image/png" });
    await expect(extractText(file)).rejects.toThrow("τύπος");
  });

  it("should normalize whitespace in extracted text", async () => {
    const content = "Hello   world.\n\n\n\nNext    line.";
    const file = new File([content], "test.txt", { type: "text/plain" });
    const result = await extractText(file);
    expect(result).not.toContain("   ");
    expect(result).not.toContain("\n\n\n");
  });

  it("should export SUPPORTED_TYPES", () => {
    expect(SUPPORTED_TYPES).toContain("text/plain");
    expect(SUPPORTED_TYPES).toContain("application/pdf");
    expect(SUPPORTED_TYPES).toContain(
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );
  });
});
