import { describe, expect, it } from "@jest/globals";

import { addMinutes } from "./time.util";

describe("util / time", () => {
  describe("addMinutes", () => {
    it("should add minutes to a given time", async () => {
      const newTime = addMinutes("4:20", 5);
      expect(newTime).toEqual([4, 25]);
    });

    it("should overflow hours", async () => {
      const newTime = addMinutes("4:20", 1260);
      expect(newTime).toEqual([1, 20]);
    });

    it("should overflow minutes", async () => {
      const newTime = addMinutes("4:20", 55);
      expect(newTime).toEqual([5, 15]);
    });

    it("should overflow hours and minutes", async () => {
      const newTime = addMinutes("4:20", 1315);
      expect(newTime).toEqual([2, 15]);
    });

    it("should subtract minutes to a given time", async () => {
      const newTime = addMinutes("4:20", -5);
      expect(newTime).toEqual([4, 15]);
    });

    it("should underflow hours", async () => {
      const newTime = addMinutes("4:20", -300);
      expect(newTime).toEqual([23, 20]);
    });

    it("should underflow minutes", async () => {
      const newTime = addMinutes("4:20", -25);
      expect(newTime).toEqual([3, 55]);
    });

    it("should underflow hours and minutes", async () => {
      const newTime = addMinutes("4:20", -325);
      expect(newTime).toEqual([22, 55]);
    });
  });
});
