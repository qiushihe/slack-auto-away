import { describe, expect, it } from "@jest/globals";

import { handler } from "./hello";

describe("functions / dummy / hello", () => {
  it("should work", async () => {
    const res = await (handler as any)();
    expect(res).toHaveProperty("body");

    const body = JSON.parse(res.body);
    expect(body).toHaveProperty("message", "It Worked!");
  });
});
