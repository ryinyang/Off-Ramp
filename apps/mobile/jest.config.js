/** @type {import('jest').Config} */
module.exports = {
  preset: "jest-expo",
  setupFiles: ["<rootDir>/jest.setup.js"],
  moduleNameMapper: {
    "modules/off-ramp-monitor/src/OffRampMonitorModule$": "<rootDir>/src/testing/mockOffRampMonitor.ts",
  },
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)",
  ],
  collectCoverageFrom: ["src/**/*.{ts,tsx}", "!src/testing/**"],
};
