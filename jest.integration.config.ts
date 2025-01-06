export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testRegex: '((\\.|/*.)(integration.test))\\.ts?$',
  clearMocks: true,
  modulePaths: ['<rootDir>/src/services/'],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/src/config',
    '<rootDir>/src/dto',
    '<rootDir>/src/enums',
    '<rootDir>/src/utils',
    '<rootDir>/src/services/aws.service.ts',
    '<rootDir>/src/services/file.service.ts',
    '<rootDir>/src/services/index.ts',
    '<rootDir>/src/services/logger.service.ts',
    '<rootDir>/src/services/vendor.service.ts',
  ],
};
