import { describe, it, expect, vi, afterEach } from "vitest";
import { verifyTurnstile } from "./turnstile";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("verifyTurnstile", () => {
  it("dormant when no secret → allows regardless of token", async () => {
    vi.stubEnv("TURNSTILE_SECRET_KEY", "");
    expect(await verifyTurnstile(null)).toBe(true);
    expect(await verifyTurnstile("anything")).toBe(true);
  });

  it("active but missing token → rejects", async () => {
    vi.stubEnv("TURNSTILE_SECRET_KEY", "secret");
    expect(await verifyTurnstile(null)).toBe(false);
    expect(await verifyTurnstile("")).toBe(false);
  });

  it("active + siteverify success → true", async () => {
    vi.stubEnv("TURNSTILE_SECRET_KEY", "secret");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, json: async () => ({ success: true }) }))
    );
    expect(await verifyTurnstile("tok")).toBe(true);
  });

  it("active + siteverify failure → false", async () => {
    vi.stubEnv("TURNSTILE_SECRET_KEY", "secret");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, json: async () => ({ success: false }) }))
    );
    expect(await verifyTurnstile("tok")).toBe(false);
  });

  it("active + network error → false (fail-closed)", async () => {
    vi.stubEnv("TURNSTILE_SECRET_KEY", "secret");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("net down");
      })
    );
    expect(await verifyTurnstile("tok")).toBe(false);
  });
});
