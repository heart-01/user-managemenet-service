export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testRegex: '((\\.|/*.)(integration.test))\\.ts?$',
  clearMocks: true,
};
