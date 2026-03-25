import { useTheme, type Theme } from '../contexts/ThemeContext';

const PRESETS = ['#7c3aed','#ec4899','#06b6d4','#10b981','#f59e0b','#ef4444'];

export function ThemeSettings({ onClose, isPro, onUpgrade }: { onClose: () => void; isPro?: boolean; onUpgrade?: () => void }) {
  const { theme, setTheme, customAccent, setCustomAccent } = useTheme();

  const themes: { id: Theme; label: string; icon: string; proOnly?: boolean }[] = [
    { id: 'dark',   label: 'ダーク',    icon: '🌙' },
    { id: 'light',  label: 'ライト',    icon: '☀️' },
    { id: 'custom', label: 'カスタム',  icon: '🎨', proOnly: true },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={onClose}>
      <div className="w-full max-w-[430px] mx-auto rounded-t-3xl p-6 pb-28"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', backdropFilter: 'blur(20px)' }}
        onClick={e => e.stopPropagation()}>
        <div className="flex justify-center mb-4">
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--border)' }} />
        </div>
        <h2 className="text-lg font-bold mb-5" style={{ color: 'var(--text)' }}>テーマ設定</h2>

        {/* テーマ選択 */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {themes.map(t => {
            const locked = t.proOnly && !isPro;
            return (
              <button key={t.id}
                onClick={() => locked ? onUpgrade?.() : setTheme(t.id)}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl transition-all relative"
                style={{
                  background: theme === t.id ? 'var(--accent)' : 'var(--input-bg)',
                  border: `2px solid ${theme === t.id ? 'var(--accent)' : 'var(--border)'}`,
                  color: theme === t.id ? '#fff' : 'var(--text-sub)',
                  opacity: locked ? 0.6 : 1,
                }}>
                <span className="text-2xl">{t.icon}</span>
                <span className="text-xs font-medium">{t.label}</span>
                {locked && <span className="text-[10px] absolute top-1 right-1">Pro</span>}
              </button>
            );
          })}
        </div>

        {/* アクセントカラー */}
        <div>
          <p className="text-sm font-medium mb-3" style={{ color: 'var(--text-sub)' }}>アクセントカラー</p>
          <div className="flex gap-3 flex-wrap mb-3">
            {PRESETS.map(c => (
              <button key={c} onClick={() => setCustomAccent(c)}
                className="w-9 h-9 rounded-full transition-transform active:scale-90"
                style={{ background: c, outline: customAccent === c ? `3px solid ${c}` : 'none', outlineOffset: '2px' }} />
            ))}
          </div>
          <div className="flex items-center gap-3">
            <input type="color" value={customAccent} onChange={e => setCustomAccent(e.target.value)}
              className="w-9 h-9 rounded-full cursor-pointer border-0 p-0"
              style={{ background: 'none' }} />
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>カスタムカラーを選択</span>
          </div>
        </div>

        {/* データ保存に関する注意書き */}
        <div className="mt-6 p-3 rounded-xl text-xs" style={{ background: 'var(--input-bg)', color: 'var(--text-muted)' }}>
          <p className="font-medium mb-1" style={{ color: 'var(--text-sub)' }}>データの保存について</p>
          <p>データはこのブラウザにのみ保存されます。ブラウザのデータ削除・シークレットモード・別端末では引き継がれません。</p>
        </div>
      </div>
    </div>
  );
}
