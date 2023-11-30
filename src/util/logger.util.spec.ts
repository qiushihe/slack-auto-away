import { describe, expect, it } from "@jest/globals";

import { UnitTestNamespacedLogger } from "./logger.util";

describe("util / logger", () => {
  describe("NamespacedLogger", () => {
    it("should log message with namespace prefix", async () => {
      const logger = new UnitTestNamespacedLogger("unit test");

      const logPayload = logger.log("test message") as [string, ...unknown[]];
      expect(logPayload[0]).toEqual("[unit test] test message");
    });
  });
});
