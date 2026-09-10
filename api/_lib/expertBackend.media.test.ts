import { describe, expect, it } from "vitest";
import { isNonImageMediaPayload } from "./expertBackend";

describe("isNonImageMediaPayload", () => {
  it("rejects HTML documents even when status would be 200", () => {
    expect(
      isNonImageMediaPayload(
        "text/html; charset=utf-8",
        Buffer.from("<!DOCTYPE html><html></html>"),
      ),
    ).toBe(true);
  });

  it("accepts JPEG bytes", () => {
    expect(
      isNonImageMediaPayload(
        "image/jpeg",
        Buffer.from([0xff, 0xd8, 0xff, 0xe0]),
      ),
    ).toBe(false);
  });

  it("does not treat SVG as HTML", () => {
    expect(
      isNonImageMediaPayload(
        "image/svg+xml",
        Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>'),
      ),
    ).toBe(false);
  });
});
