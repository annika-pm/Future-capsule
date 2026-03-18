import '@testing-library/jest-dom';

// Add Node/Web API polyfills for Node.js environment
if (typeof global.fetch === 'undefined') {
  global.fetch = jest.fn();
}

// Add Request/Response polyfills (required for middleware tests)
if (typeof global.Request === 'undefined') {
  global.Request = class Request {
    constructor(public input: string, public init?: any) {}
  } as any;
}

if (typeof global.Response === 'undefined') {
  global.Response = class Response {
    constructor(public body?: any, public init?: any) {}
    json() { return Promise.resolve(this.body); }
    text() { return Promise.resolve(this.body?.toString() || ''); }
  } as any;
}

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
  }),
}));

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock Firebase auth
jest.mock('firebase/auth', () => ({
  initializeApp: jest.fn(),
  getAuth: jest.fn(() => ({
    currentUser: null,
  })),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn((auth, callback) => {
    callback(null);
    return () => {};
  }),
  signInWithPopup: jest.fn(),
  GoogleAuthProvider: jest.fn(),
}));

// Mock Firebase firestore
jest.mock('firebase/firestore', () => ({
  initializeFirestore: jest.fn(),
  getFirestore: jest.fn(),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  getDocs: jest.fn(),
  getDoc: jest.fn(),
  addDoc: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  Timestamp: {
    now: jest.fn(() => new Date()),
    fromDate: jest.fn((date) => date),
  },
}));

// Mock Firebase analytics
jest.mock('firebase/analytics', () => ({
  getAnalytics: jest.fn(),
  logEvent: jest.fn(),
}));

// Suppress console errors in tests (optional)
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render') ||
       args[0].includes('Warning: ReactDOM.createRoot') ||
       args[0].includes('Warning: useLayoutEffect'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
