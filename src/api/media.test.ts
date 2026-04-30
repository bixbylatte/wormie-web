import { describe, expect, it } from "vitest";

import { resolveApiAssetUrl } from "./media";


describe("resolveApiAssetUrl", () => {
  it("rewrites legacy relative media URLs against the API origin", () => {
    expect(resolveApiAssetUrl("/media/cover.avif", "https://wormie-api.example.com")).toBe(
      "https://wormie-api.example.com/media/cover.avif"
    );
  });

  it("leaves absolute URLs untouched", () => {
    expect(resolveApiAssetUrl("https://storage.googleapis.com/wormie/covers/cover.avif", "https://wormie-api.example.com")).toBe(
      "https://storage.googleapis.com/wormie/covers/cover.avif"
    );
  });
});
