import type { User } from '@supabase/supabase-js'

type Tab = 'shelf' | 'calendar' | 'stats';

const tabs = [
  { id: 'shelf',    label: '本棚',   icon: '📚' },
  { id: 'calendar', label: '新刊',   icon: '📅' },
  { id: 'stats',    label: '統計',   icon: '📊' },
] as const;

export function SideNav({ active, onChange, onTheme, user, onLogin, onLogout }: {
  active: Tab
  onChange: (t: Tab) => void
  onTheme: () => void
  user?: User | null
  onLogin?: () => void
  onLogout?: () => void
}) {
  return (
    <aside className="hidden md:flex flex-col w-56 shrink-0 h-dvh sticky top-0"
      style={{ background: 'var(--bg-card)', borderRight: '1px solid var(--border)' }}>
      {/* ロゴ */}
      <div className="px-6 pt-8 pb-6">
        <p className="text-lg font-bold" style={{ color: 'var(--text)' }}>📖 漫画本棚</p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>My Manga Shelf</p>
      </div>

      {/* ナビ */}
      <nav className="flex-1 px-3 space-y-1">
        {tabs.map(t => (
          <button key={t.id} onClick={() => onChange(t.id)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left"
            style={active === t.id
              ? { background: 'linear-gradient(135deg, var(--accent), var(--accent2))', color: '#fff' }
              : { color: 'var(--text-sub)' }}>
            <span className="text-base">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>

      {/* テーマ・ログイン */}
      <div className="px-3 pb-6 space-y-1">
        <button onClick={onTheme}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all"
          style={{ color: 'var(--text-muted)' }}>
          🎨 テーマ設定
        </button>
        {user ? (
          <button onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all"
            style={{ color: 'var(--text-muted)' }}>
            <img src={user.user_metadata?.avatar_url} alt="" className="w-5 h-5 rounded-full" />
            ログアウト
          </button>
        ) : (
          <button onClick={onLogin}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all"
            style={{ color: 'var(--text-muted)' }}>
            👤 ログイン
          </button>
        )}
      </div>
      <div className="px-4 pb-4 flex gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
        <a href="/privacy" className="hover:underline">プライバシー</a>
        <a href="/terms" className="hover:underline">利用規約</a>
      </div>
    </aside>
  );
}
