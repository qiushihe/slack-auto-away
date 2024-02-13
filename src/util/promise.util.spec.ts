import { describe, expect, it } from "@jest/globals";

import { paginatedPromises, promisedFn } from "./promise.util";

describe("util / promise", () => {
  describe("promisedFn", () => {
    it("should return promised value", async () => {
      const [promisedErr, promisedValue] = await promisedFn(() => Promise.resolve(42));

      expect(promisedErr).toBeNull();
      expect(promisedValue).toEqual(42);
    });

    it("should return promised error", async () => {
      const [promisedErr, promisedValue] = await promisedFn(() =>
        Promise.reject(new Error("Oh Lawl"))
      );

      expect(promisedErr).toBeInstanceOf(Error);
      expect(promisedErr).toHaveProperty("message", "Oh Lawl");
      expect(promisedValue).toBeNull();
    });
  });

  describe("paginatedPromises", () => {
    it("should resolve all provided promise functions", async () => {
      const [resultsErr, results] = await paginatedPromises(
        [async () => 42, async () => "fortytwo", async () => true],
        { pageSize: 2 }
      );

      expect(resultsErr).toBeNull();
      expect(results).not.toBeNull();
      expect(results!).toHaveLength(3);
      expect(results![0]).toEqual(42);
      expect(results![1]).toEqual("fortytwo");
      expect(results![2]).toEqual(true);
    });
  });
});
