module.exports = new Proxy(
  {},
  {
    get: (_, prop) => {
      if (prop === '__esModule') return true;
      if (prop === 'default') return {};
      return jest.fn(() => null);
    },
  },
);
