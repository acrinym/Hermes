module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/test'],
  setupFiles: ['<rootDir>/test/setup.ts']
};
