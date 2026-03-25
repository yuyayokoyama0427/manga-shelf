import { useState } from 'react'

const CHECKOUT_URL = 'https://yomiyasu.lemonsqueezy.com/checkout/buy/d83467ad-266a-453b-b6ce-92e7bc31e406'
const FREE_LIMIT = 30

interface Props {
  mode: 'upgrade' | 'activate'
  onActivate: (key: string) => Promise<void>
  onClose: () => void
  loading: boolean
  error: string | null
}

export function ProModal({ mode, onActivate, onClose, loading, error }: Props) {
  const [key, setKey] = useState('')
  const [view, setView] = useState<'upgrade' | 'activate'>(mode)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        {view === 'upgrade' ? (
          <>
            <h2 className="text-lg font-bold text-gray-800 mb-1">Pro版にアップグレード</h2>
            <p className="text-sm text-gray-500 mb-5">
              無料版は{FREE_LIMIT}シリーズまで登録できます。
              Pro版なら制限なしで使えます。
            </p>
            <div className="bg-violet-50 rounded-xl p-4 mb-5 space-y-2">
              <p className="text-sm font-semibold text-violet-700">Pro版でできること</p>
              <ul className="text-sm text-violet-600 space-y-1">
                <li>✓ シリーズ登録 無制限</li>
                <li>✓ CSV書き出し</li>
                <li>✓ カスタムカラーテーマ</li>
              </ul>
              <p className="text-xs text-violet-400 mt-2">月額 980円</p>
            </div>
            <a
              href={CHECKOUT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-violet-600 hover:bg-violet-700 text-white text-center rounded-xl py-3 text-sm font-semibold mb-3"
            >
              Pro版を購入する
            </a>
            <button
              className="w-full text-sm text-gray-500 hover:text-gray-700 py-2"
              onClick={() => setView('activate')}
            >
              すでに購入済みの方はこちら
            </button>
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl"
              onClick={onClose}
            >
              ×
            </button>
          </>
        ) : (
          <>
            <h2 className="text-lg font-bold text-gray-800 mb-1">ライセンスキーを入力</h2>
            <p className="text-sm text-gray-500 mb-4">
              購入後にメールで届いたライセンスキーを入力してください。
            </p>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-violet-400"
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              value={key}
              onChange={e => setKey(e.target.value)}
            />
            {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
            <div className="flex gap-2 mt-4">
              <button
                className="flex-1 bg-violet-600 hover:bg-violet-700 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50"
                onClick={() => onActivate(key)}
                disabled={loading || key.trim().length === 0}
              >
                {loading ? '確認中...' : '有効化する'}
              </button>
              <button
                className="px-4 border border-gray-300 rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50"
                onClick={onClose}
              >
                キャンセル
              </button>
            </div>
            <button
              className="w-full text-xs text-gray-400 hover:text-gray-600 mt-3"
              onClick={() => setView('upgrade')}
            >
              ← 戻る
            </button>
          </>
        )}
      </div>
    </div>
  )
}
