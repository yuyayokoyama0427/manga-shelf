import { useState } from 'react';
import { useStore } from './hooks/useStore';
import { useSupabaseStore } from './hooks/useSupabaseStore';
import { usePro } from './hooks/usePro';
import { useAuth } from './hooks/useAuth';
import { FREE_LIMIT } from './lib/license';
import { ThemeProvider } from './contexts/ThemeContext';
import { BottomNav } from './components/BottomNav';
import { SideNav } from './components/SideNav';
import { ThemeSettings } from './components/ThemeSettings';
import { ProModal } from './components/ProModal';
import { LoginModal } from './components/LoginModal';
import { ShelfPage } from './pages/ShelfPage';
import { CalendarPage } from './pages/CalendarPage';
import { StatsPage } from './pages/StatsPage';
import { SeriesDetailPage } from './pages/SeriesDetailPage';
import type { Series } from './types';

type Tab = 'shelf' | 'calendar' | 'stats';

function AppInner() {
  const [tab, setTab]           = useState<Tab>('shelf');
  const [selected, setSelected] = useState<Series | null>(null);
  const [showTheme, setShowTheme] = useState(false);
  const [showPro, setShowPro]   = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const { user, signOut } = useAuth();
  const localStore = useStore();
  const remoteStore = useSupabaseStore(user?.id ?? null);
  const store = user ? remoteStore : localStore;
  const { isPro, activate, loading, error } = usePro();

  const canAdd = isPro || store.series.length < FREE_LIMIT;

  const content = selected ? (
    <SeriesDetailPage
      series={selected}
      volumes={store.volumesOf(selected.id)}
      onBack={() => setSelected(null)}
      onUpsertVolume={store.upsertVolume}
      onAddVolumes={store.addVolumes}
      onDelete={store.deleteSeries}
      onDeleteVolume={store.deleteVolume}
      onUpdateSeries={store.updateSeries}
    />
  ) : (
    <>
      {tab === 'shelf' && (
        <ShelfPage
          series={store.series}
          volumes={store.volumes}
          volumesOf={store.volumesOf}
          onAdd={canAdd ? store.addSeries : () => setShowPro(true)}
          onSelect={setSelected}
          isPro={isPro}
          freeLimit={FREE_LIMIT}
          onUpgrade={() => setShowPro(true)}
        />
      )}
      {tab === 'calendar' && (
        <CalendarPage series={store.series} volumes={store.volumes} />
      )}
      {tab === 'stats' && (
        <StatsPage
          series={store.series}
          volumes={store.volumes}
          monthlySpend={store.monthlySpend}
          dailySpend={store.dailySpend}
          weeklySpend={store.weeklySpend}
        />
      )}
    </>
  );

  const storeDbError = user ? remoteStore.dbError : null;

  return (
    <>
      {storeDbError && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white text-sm px-4 py-2 rounded-xl shadow-lg">
          {storeDbError}
        </div>
      )}
      {/* デスクトップ: サイドバー + メインエリア */}
      <div className="hidden md:flex h-dvh overflow-hidden">
        <SideNav active={tab} onChange={t => { setSelected(null); setTab(t); }} onTheme={() => setShowTheme(true)} user={user} onLogin={() => setShowLogin(true)} onLogout={signOut} />
        <main className="flex-1 overflow-y-auto">
          {content}
        </main>
      </div>

      {/* スマホ: 従来レイアウト */}
      <div className="md:hidden">
        {content}
        {!selected && <BottomNav active={tab} onChange={setTab} />}
      </div>

      {showTheme && <ThemeSettings onClose={() => setShowTheme(false)} isPro={isPro} onUpgrade={() => setShowPro(true)} />}
      {showPro && (
        <ProModal
          mode="upgrade"
          onActivate={async (key) => { await activate(key); if (isPro) setShowPro(false); }}
          onClose={() => setShowPro(false)}
          loading={loading}
          error={error}
        />
      )}
      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
    </>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  );
}

export default App;
