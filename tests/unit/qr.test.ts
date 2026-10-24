import { describe, expect, it } from "vitest";
import jsQR from "jsqr";
import { encodeQr } from "@/lib/qr";

function rasterize(text: string, scale = 4, margin = 4) {
  const { size, modules } = encodeQr(text);
  const dim = (size + margin * 2) * scale;
  const rgba = new Uint8ClampedArray(dim * dim * 4);
  for (let y = 0; y < dim; y += 1) {
    for (let x = 0; x < dim; x += 1) {
      const mx = Math.floor(x / scale) - margin;
      const my = Math.floor(y / scale) - margin;
      const dark = mx >= 0 && my >= 0 && mx < size && my < size && modules[my][mx];
      const i = (y * dim + x) * 4;
      const v = dark ? 0 : 255;
      rgba[i] = v;
      rgba[i + 1] = v;
      rgba[i + 2] = v;
      rgba[i + 3] = 255;
    }
  }
  return { rgba, dim };
}

describe("qr encoder", () => {
  it.each([
    "hello world",
    "otpauth://totp/Coffer:dev@coffer.local?secret=JBSWY3DPEHPK3PXP&issuer=Coffer&algorithm=SHA1&digits=6&period=30",
    "otpauth://totp/Coffer:someone@example.com?secret=GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ&issuer=Coffer&algorithm=SHA1&digits=6&period=30",
    "a longer payload that should push us into a higher version, well beyond version 2 for sure, with lots of lowercase characters and punctuation!",
  ])("decodes %j with an independent implementation", (text) => {
    const { rgba, dim } = rasterize(text);
    const decoded = jsQR(rgba, dim, dim);
    expect(decoded?.data).toBe(text);
  });

  it("chooses the smallest version that fits and stays within 1–10", () => {
    expect((encodeQr("hi").size - 17) / 4).toBe(1);
    expect(encodeQr("a".repeat(200)).size).toBeLessThanOrEqual(17 + 4 * 10);
  });

  it("rejects payloads beyond version 10", () => {
    expect(() => encodeQr("a".repeat(3000))).toThrow();
  });
});
