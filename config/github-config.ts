/**
 * GitHub OAuth configuration helper
 * This replaces the dynamic environment variable setting in middleware
 */
export function getGitHubCredentials(hostname: string) {
  const isDev = hostname.includes("courseai.dev")

  return {
    clientId: isDev ? process.env.GITHUB_CLIENT_ID : process.env.GITHUB_CLIENT_ID_IO,
    clientSecret: isDev ? process.env.GITHUB_CLIENT_SECRET : process.env.GITHUB_CLIENT_SECRET_IO,
  }
}
