type Tab = 'shelf' | 'calendar' | 'stats';

const tabs = [
  { id: 'shelf',    label: '本棚',   icon: '📚' },
  { id: 'calendar', label: '新刊',   icon: '📅' },
  { id: 'stats',    label: '統計',   icon: '📊' },
] as const;

export function BottomNav({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50">
      <div className="mx-4 mb-4 rounded-2xl overflow-hidden"
        style={{ background: 'rgba(26,26,46,0.95)', backdropFilter: 'blur(20px)', boxShadow: '0 -1px 0 rgba(255,255,255,0.05), 0 8px 32px rgba(0,0,0,0.4)' }}>
        <div className="flex">
          {tabs.map(t => (
            <button key={t.id} onClick={() => onChange(t.id)}
              className="flex-1 flex flex-col items-center py-3 gap-0.5 transition-all"
              style={{ color: active === t.id ? '#a78bfa' : '#64748b' }}>
              <span className="text-xl">{t.icon}</span>
              <span className="text-[10px] font-medium">{t.label}</span>
              {active === t.id && (
                <span className="absolute bottom-3 w-1 h-1 rounded-full bg-violet-400" />
              )}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
