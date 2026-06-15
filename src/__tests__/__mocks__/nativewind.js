module.exports = {
  cssInterop: jest.fn(),
  remapProps: jest.fn(),
  styled: (component) => component,
  useColorScheme: () => ({ colorScheme: 'light' }),
};
