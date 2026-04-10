/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node', // Use node environment for Selenium WebDriver tests
    testMatch: ['**/__tests__/e2e/**/*.test.ts'],
    testTimeout: 30000, // Selenium tests generally need more time
};
