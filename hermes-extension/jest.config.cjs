module.exports = {
  preset: 'ts-jest/presets/js-with-ts-esm',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/test'],
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  transform: {
    '^.+\\.(ts|tsx|js)$': ['ts-jest', { useESM: true }]
  },
  moduleNameMapper: {
    '^@hermes/core$': '<rootDir>/../packages/core/src/index.ts',
    '^@hermes/core/(.*)$': '<rootDir>/../packages/core/src/$1'
  }
};
