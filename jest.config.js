/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  "transform": {
    "^.+\\.(t|j)s?$": "@swc/jest"
  },
  "extensionsToTreatAsEsm": [
    ".ts"
  ],
  "moduleNameMapper": {
    "^(\\.{1,2}/.*)\\.js$": "$1"
  },
  "testMatch": [
    "<rootDir>/backend/**/*.test.ts"
  ],
  "modulePathIgnorePatterns": ["<rootDir>/build/"],
  "testEnvironment": "node"
};
