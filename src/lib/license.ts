const STORAGE_KEY = 'manga_shelf_license'
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export const FREE_LIMIT = 30  // 無料版は30シリーズまで

export function getLicenseKey(): string | null {
  return localStorage.getItem(STORAGE_KEY)
}

export function isProFromStorage(): boolean {
  const key = localStorage.getItem(STORAGE_KEY)
  return key !== null && UUID_REGEX.test(key)
}

export async function validateLicense(key: string): Promise<boolean> {
  try {
    const res = await fetch('/api/validate-license', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ licenseKey: key }),
    })
    const data = await res.json() as { valid: boolean }
    if (data.valid) {
      localStorage.setItem(STORAGE_KEY, key)
      return true
    }
    return false
  } catch {
    return false
  }
}

export function clearLicense(): void {
  localStorage.removeItem(STORAGE_KEY)
}
