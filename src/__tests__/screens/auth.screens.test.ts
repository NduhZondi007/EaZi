/**
 * Screen smoke tests — verify each screen module exports at least one valid
 * function component (named or default export).
 */

jest.mock('@/lib/supabase', () => ({ supabase: { auth: { signInWithPassword: jest.fn() } } }));
jest.mock('@/stores/auth.store', () => ({
  useAuthStore: jest.fn(() => ({
    user: null,
    profile: null,
    isLoading: false,
    signIn: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    resetPassword: jest.fn(),
  })),
}));

function getFirstFunctionExport(modulePath: string): unknown {
  const mod = require(modulePath) as Record<string, unknown>;
  if (typeof mod.default === 'function') return mod.default;
  const fnExport = Object.values(mod).find((v) => typeof v === 'function');
  return fnExport ?? mod;
}

describe('Auth screens — module exports', () => {
  it('WelcomeScreen exports a function component', () => {
    const component = getFirstFunctionExport('@/screens/auth/WelcomeScreen');
    expect(typeof component).toBe('function');
  });

  it('LoginScreen exports a function component', () => {
    const component = getFirstFunctionExport('@/screens/auth/LoginScreen');
    expect(typeof component).toBe('function');
  });

  it('SignUpScreen exports a function component', () => {
    const component = getFirstFunctionExport('@/screens/auth/SignUpScreen');
    expect(typeof component).toBe('function');
  });

  it('ForgotPasswordScreen exports a function component', () => {
    const component = getFirstFunctionExport('@/screens/auth/ForgotPasswordScreen');
    expect(typeof component).toBe('function');
  });

  it('ResetPasswordScreen exports a function component', () => {
    const component = getFirstFunctionExport('@/screens/auth/ResetPasswordScreen');
    expect(typeof component).toBe('function');
  });
});

describe('Client screens — module exports', () => {
  it('HomeScreen exports a function component', () => {
    const component = getFirstFunctionExport('@/screens/client/HomeScreen');
    expect(typeof component).toBe('function');
  });

  it('BookingsListScreen exports a function component', () => {
    const component = getFirstFunctionExport('@/screens/client/BookingsListScreen');
    expect(typeof component).toBe('function');
  });
});

describe('Provider screens — module exports', () => {
  it('ProviderDashboardScreen exports a function component', () => {
    const component = getFirstFunctionExport('@/screens/provider/ProviderDashboardScreen');
    expect(typeof component).toBe('function');
  });

  it('MyServicesScreen exports a function component', () => {
    const component = getFirstFunctionExport('@/screens/provider/MyServicesScreen');
    expect(typeof component).toBe('function');
  });
});
