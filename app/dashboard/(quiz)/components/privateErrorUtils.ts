export function isPrivateError(error?: any): boolean {
  if (!error) return false
  try {
    const msg = typeof error === 'string' ? error : JSON.stringify(error)
    return /private|forbidden|unauthorized|visibility|access denied|403/i.test(msg)
  } catch {
    return false
  }
}


