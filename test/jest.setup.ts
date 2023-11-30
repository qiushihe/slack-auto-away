import { afterEach, jest } from "@jest/globals";

// Ensure all `jest.spyOn` mocks are restored (that is: restored to their original, pre-mocked
// implementation) automatically after each test run.
// If you ever have to restore/clear a mock in `beforeEach` or `beforeAll` inside individual tests
// and/or test suites: You're doing it wrong!
afterEach(() => {
  jest.restoreAllMocks();
});
