import { describe, expect, it } from "vitest";
import {
  isPlaceholderMediaHost,
  isUnusableMediaUrl,
} from "@/lib/expert/mediaUrls";

describe("isPlaceholderMediaHost", () => {
  it("treats media.example.com as dummy seed media", () => {
    expect(isPlaceholderMediaHost("media.example.com")).toBe(true);
    expect(isPlaceholderMediaHost("example.com")).toBe(true);
  });

  it("allows real storage hosts", () => {
    expect(isPlaceholderMediaHost("firebasestorage.googleapis.com")).toBe(
      false,
    );
  });
});

describe("isUnusableMediaUrl", () => {
  it("rejects dummy coinzy seed images", () => {
    expect(
      isUnusableMediaUrl(
        "https://media.example.com/coinzy/uploads/dummy-obverse.jpg",
      ),
    ).toBe(true);
  });

  it("keeps firebase avatar urls for same-origin proxying", () => {
    expect(
      isUnusableMediaUrl(
        "https://firebasestorage.googleapis.com/v0/b/coinzy-26a4d.firebasestorage.app/o/experts%2Favatars%2Fphoto.png?alt=media",
      ),
    ).toBe(false);
  });
});
