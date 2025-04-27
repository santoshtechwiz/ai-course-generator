const jest = require("jest-mock")

module.exports = {
  useAuth: () => ({
    isAuthenticated: false,
    signIn: jest.fn(),
    signOut: jest.fn(),
    user: null,
    status: "unauthenticated",
  }),
}
