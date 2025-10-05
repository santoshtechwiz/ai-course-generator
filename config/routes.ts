export const routeConfig = {
  protected: ["/profile", "/dashboard/course/"],
  public: ["/", "/about", "/contact", "/dashboard/explore", "/dashboard/mcq"],
  redirects: [
    { from: "/course/:id", to: "/course/:slug" },
    { from: "/mcq/:id", to: "/mcq/:slug" },
    { from: "/dashboard/profile", to: "/dashboard/account" },
    { from: "/dashboard/settings", to: "/dashboard/account" },
  ],
  authRedirects: {
    signIn: "/api/auth/signin",
    signOut: "/api/auth/signout",
    error: "/auth/error",
    verifyRequest: "/auth/verify-request",
    newUser: "/auth/new-user",
  },
}
