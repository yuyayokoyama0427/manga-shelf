import { useState, useMemo } from 'react';
import { SeriesCard } from '../components/SeriesCard';
import { AddSeriesModal } from '../components/AddSeriesModal';
import { ThemeSettings } from '../components/ThemeSettings';
import { exportCSV } from '../utils/exportCSV';
import type { Series, Volume } from '../types';

interface Props {
  series: Series[];
  volumes: Volume[];
  volumesOf: (id: string) => Volume[];
  onAdd: (s: Series) => void;
  onSelect: (s: Series) => void;
  isPro?: boolean;
  freeLimit?: number;
  onUpgrade?: () => void;
}

const STATUS_FILTERS = ['すべて', '所持', '読了', '欲しい', '積読'] as const;
const BOOK_TYPES = ['すべて', '漫画', '書籍'] as const;

export function ShelfPage({ series, volumes, volumesOf, onAdd, onSelect, isPro, freeLimit, onUpgrade }: Props) {
  const [showAdd, setShowAdd]       = useState(false);
  const [showTheme, setShowTheme]   = useState(false);
  const [bookTypeTab, setBookType]  = useState<typeof BOOK_TYPES[number]>('すべて');
  const [statusFilter, setStatus]   = useState<typeof STATUS_FILTERS[number]>('すべて');
  const [genreFilter, setGenre]     = useState('すべて');
  const [eraFilter, setEra]         = useState('すべて');
  const [completedFilter, setComp]  = useState<'すべて'|'連載中'|'完結'>('すべて');
  const [search, setSearch]         = useState('');
  const [showFilter, setShowFilter] = useState(false);

  // 動的なジャンル・年代一覧
  const genres = useMemo(() => {
    const gs = [...new Set(series.map(s => s.genre).filter(Boolean))];
    return ['すべて', ...gs];
  }, [series]);

  const eras = useMemo(() => {
    const years = [...new Set(series.map(s => new Date(s.addedAt).getFullYear()))].sort((a,b) => b-a);
    return ['すべて', ...years.map(String)];
  }, [series]);

  const filtered = useMemo(() => series.filter(s => {
    const vols = volumesOf(s.id);
    const type = s.bookType ?? 'manga'; // 既存データはmangaとして扱う
    const matchType =
      bookTypeTab === 'すべて' ? true :
      bookTypeTab === '漫画'   ? type === 'manga' :
      bookTypeTab === '書籍'   ? type === 'book' : true;
    const matchStatus =
      statusFilter === 'すべて'  ? true :
      statusFilter === '所持'    ? vols.some(v => v.status === 'owned') :
      statusFilter === '読了'    ? vols.some(v => v.status === 'reading') :
      statusFilter === '欲しい'  ? vols.some(v => v.status === 'want') :
      statusFilter === '積読'    ? vols.some(v => v.status === 'backlog') : true;
    const matchGenre     = genreFilter === 'すべて' || s.genre === genreFilter;
    const matchEra       = eraFilter === 'すべて'   || new Date(s.addedAt).getFullYear() === parseInt(eraFilter);
    const matchCompleted =
      completedFilter === 'すべて'  ? true :
      completedFilter === '完結'    ? s.isCompleted :
      completedFilter === '連載中'  ? !s.isCompleted : true;
    const matchSearch    = s.title.includes(search) || s.author.includes(search);
    return matchType && matchStatus && matchGenre && matchEra && matchCompleted && matchSearch;
  }), [series, volumesOf, bookTypeTab, statusFilter, genreFilter, eraFilter, completedFilter, search]);

  const activeFilters = [genreFilter, eraFilter, completedFilter].filter(f => f !== 'すべて').length;

  return (
    <div className="pb-28 md:pb-8">
      {/* ヘッダー */}
      <div className="px-5 pt-14 md:pt-8 pb-4"
        style={{ background: 'linear-gradient(180deg, color-mix(in srgb, var(--accent) 15%, transparent) 0%, transparent 100%)' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>マイ本棚</h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {series.length}シリーズ
              {!isPro && freeLimit && (
                <span style={{ color: series.length >= freeLimit ? 'var(--accent)' : 'var(--text-muted)' }}>
                  {' '}/ {freeLimit}（無料）
                </span>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowTheme(true)}
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg transition-transform active:scale-95"
              style={{ background: 'var(--input-bg)', border: '1px solid var(--border)' }}>
              🎨
            </button>
            <button
              onClick={() => isPro ? exportCSV(series, volumes) : onUpgrade?.()}
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg transition-transform active:scale-95"
              style={{ background: 'var(--input-bg)', border: '1px solid var(--border)' }}
              title="CSVで書き出す（Pro）">
              {isPro ? '📥' : '🔒'}
            </button>
            <button onClick={() => setShowAdd(true)}
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl font-light transition-transform active:scale-95"
              style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent2))', color: '#fff' }}>
              +
            </button>
          </div>
        </div>

        {/* 無料版上限接近バナー */}
        {!isPro && freeLimit && series.length >= freeLimit - 5 && series.length < freeLimit && (
          <div className="mb-3 rounded-xl p-3 flex items-center justify-between text-sm"
            style={{ background: 'color-mix(in srgb, #f59e0b 10%, transparent)', border: '1px solid #f59e0b' }}>
            <span style={{ color: 'var(--text)' }}>あと{freeLimit - series.length}件で無料上限（{freeLimit}シリーズ）です</span>
            <button onClick={onUpgrade}
              className="text-xs font-semibold px-3 py-1 rounded-lg ml-2 shrink-0"
              style={{ background: '#f59e0b', color: '#fff' }}>
              Pro版へ
            </button>
          </div>
        )}

        {/* 無料版上限バナー */}
        {!isPro && freeLimit && series.length >= freeLimit && (
          <div className="mb-3 rounded-xl p-3 flex items-center justify-between text-sm"
            style={{ background: 'color-mix(in srgb, var(--accent) 15%, transparent)', border: '1px solid var(--accent)' }}>
            <span style={{ color: 'var(--text)' }}>無料版の上限（{freeLimit}シリーズ）に達しました</span>
            <button onClick={onUpgrade}
              className="text-xs font-semibold px-3 py-1 rounded-lg"
              style={{ background: 'var(--accent)', color: '#fff' }}>
              Pro版へ
            </button>
          </div>
        )}

        {/* 検索 */}
        <div className="relative mb-3">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--text-muted)' }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="タイトル・著者で検索"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text)' }} />
        </div>

        {/* 漫画/書籍タブ */}
        <div className="flex rounded-xl overflow-hidden mb-3" style={{ border: '1px solid var(--border)' }}>
          {BOOK_TYPES.map(t => (
            <button key={t} onClick={() => setBookType(t)}
              className="flex-1 py-2 text-xs font-medium transition-all"
              style={bookTypeTab === t
                ? { background: 'linear-gradient(135deg, var(--accent), var(--accent2))', color: '#fff' }
                : { background: 'transparent', color: 'var(--text-muted)' }}>
              {t}
            </button>
          ))}
        </div>

        {/* ステータスフィルター */}
        <div className="flex gap-2 overflow-x-auto pb-1 mb-2">
          {STATUS_FILTERS.map(f => (
            <button key={f} onClick={() => setStatus(f)}
              className="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
              style={statusFilter === f
                ? { background: 'linear-gradient(135deg, var(--accent), var(--accent2))', color: '#fff' }
                : { background: 'var(--input-bg)', color: 'var(--text-sub)' }}>
              {f}
            </button>
          ))}
        </div>

        {/* 詳細フィルタートグル */}
        <button onClick={() => setShowFilter(!showFilter)}
          className="flex items-center gap-1.5 text-xs transition-colors"
          style={{ color: activeFilters > 0 ? 'var(--accent)' : 'var(--text-muted)' }}>
          ⚙️ 詳細フィルター {activeFilters > 0 && `(${activeFilters})`}
          <span>{showFilter ? '▲' : '▼'}</span>
        </button>

        {showFilter && (
          <div className="mt-3 space-y-3 rounded-2xl p-4"
            style={{ background: 'var(--input-bg)', border: '1px solid var(--border)' }}>
            {[
              { label: 'ジャンル',   items: genres,                           val: genreFilter,    set: setGenre },
              { label: '年代（追加年）', items: eras,                          val: eraFilter,      set: setEra   },
              { label: '状態',       items: ['すべて','連載中','完結'],        val: completedFilter, set: (v: any) => setComp(v) },
            ].map(row => (
              <div key={row.label}>
                <p className="text-[10px] font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>{row.label}</p>
                <div className="flex gap-1.5 flex-wrap">
                  {row.items.map(item => (
                    <button key={item} onClick={() => row.set(item)}
                      className="px-2.5 py-1 rounded-full text-[11px] font-medium transition-all"
                      style={row.val === item
                        ? { background: 'var(--accent)', color: '#fff' }
                        : { background: 'var(--bg-card)', color: 'var(--text-sub)', border: '1px solid var(--border)' }}>
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* グリッド */}
      <div className="px-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-20 gap-3">
            <span className="text-5xl">📚</span>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {series.length === 0 ? '作品を追加しよう' : '該当する作品がありません'}
            </p>
            {series.length === 0 ? (
              <button onClick={() => setShowAdd(true)}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent2))', color: '#fff' }}>
                最初の1冊を追加
              </button>
            ) : (
              <button
                onClick={() => { setStatus('すべて'); setGenre('すべて'); setEra('すべて'); setComp('すべて'); setSearch('') }}
                className="px-5 py-2 rounded-xl text-sm font-medium"
                style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text)' }}>
                フィルターをリセット
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-3">
            {filtered.map(s => (
              <SeriesCard key={s.id} series={s} volumes={volumesOf(s.id)} onClick={() => onSelect(s)} />
            ))}
          </div>
        )}
      </div>

      {showAdd   && <AddSeriesModal onAdd={onAdd} onClose={() => setShowAdd(false)} />}
      {showTheme && <ThemeSettings onClose={() => setShowTheme(false)} />}
    </div>
  );
}
