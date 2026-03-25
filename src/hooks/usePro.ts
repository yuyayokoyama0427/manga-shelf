import { useState } from 'react'
import { isProFromStorage, validateLicense, clearLicense } from '../lib/license'

export function usePro() {
  const [isPro, setIsPro] = useState<boolean>(isProFromStorage)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function activate(key: string) {
    setLoading(true)
    setError(null)
    const ok = await validateLicense(key)
    if (ok) {
      setIsPro(true)
    } else {
      setError('ライセンスキーが無効です。再確認してください。')
    }
    setLoading(false)
  }

  function deactivate() {
    clearLicense()
    setIsPro(false)
  }

  return { isPro, activate, deactivate, loading, error }
}
