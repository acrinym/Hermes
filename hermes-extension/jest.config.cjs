module.exports = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/test'],
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    '^.+\\.(ts|js)$': ['ts-jest', { useESM: true }]
  }
};
