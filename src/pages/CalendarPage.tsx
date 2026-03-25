import { useMemo, useState, useEffect, useRef } from 'react';
import type { Series, Volume } from '../types';
import { fetchLatestRelease, type LatestRelease } from '../utils/fetchLatestRelease';

interface Props {
  series: Series[];
  volumes: Volume[];
}

export function CalendarPage({ series, volumes }: Props) {
  const today = new Date();
  const [year, setYear]   = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [latestReleases, setLatestReleases] = useState<LatestRelease[]>([]);
  const [fetching, setFetching] = useState(false);
  const fetchedIds = useRef<Set<string>>(new Set());

  // シリーズが追加されたら未取得分だけ最新刊を取得
  useEffect(() => {
    const newSeries = series.filter(s => !fetchedIds.current.has(s.id));
    if (newSeries.length === 0) return;
    newSeries.forEach(s => fetchedIds.current.add(s.id));
    setFetching(true);
    Promise.all(
      newSeries.map(s => {
        const owned = volumes.filter(v => v.seriesId === s.id).map(v => v.volumeNumber);
        return fetchLatestRelease(s.id, s.title, s.coverUrl, owned);
      })
    ).then(results => {
      const valid = results.filter((r): r is LatestRelease => r !== null);
      setLatestReleases(prev => {
        const merged = [...prev];
        valid.forEach(r => {
          const idx = merged.findIndex(x => x.seriesId === r.seriesId);
          if (idx >= 0) merged[idx] = r; else merged.push(r);
        });
        return merged;
      });
      setFetching(false);
    });
  }, [series]);

  const ym = `${year}-${String(month).padStart(2, '0')}`;

  // 手動登録済みのリリース
  const registeredReleases = useMemo(() => {
    return volumes
      .filter(v => v.releaseDate?.startsWith(ym))
      .map(v => {
        const s = series.find(s => s.id === v.seriesId);
        return { ...v, seriesTitle: s?.title ?? '不明', coverUrl: s?.coverUrl ?? '', isAuto: false };
      });
  }, [volumes, series, ym]);

  // 自動取得の新刊（その月のもの）
  const autoReleases = useMemo(() => {
    return latestReleases
      .filter(r => r.releaseDate.startsWith(ym))
      .filter(r => !registeredReleases.some(rr => rr.seriesId === r.seriesId && rr.volumeNumber === r.volumeNumber))
      .map(r => ({ ...r, id: `auto-${r.seriesId}-${r.volumeNumber}`, status: 'want' as const, isAuto: true, seriesId: r.seriesId, purchaseDate: null, purchasePrice: r.price, releaseDate: r.releaseDate }));
  }, [latestReleases, ym, registeredReleases]);

  const releases = useMemo(() => {
    return [...registeredReleases, ...autoReleases]
      .sort((a, b) => (a.releaseDate ?? '').localeCompare(b.releaseDate ?? ''));
  }, [registeredReleases, autoReleases]);

  const prev = () => { if (month === 1) { setYear(y => y - 1); setMonth(12); } else setMonth(m => m - 1); };
  const next = () => { if (month === 12) { setYear(y => y + 1); setMonth(1); } else setMonth(m => m + 1); };

  return (
    <div className="pb-28 md:pb-8">
      <div className="px-5 pt-14 md:pt-8 pb-4"
        style={{ background: 'linear-gradient(180deg, rgba(6,182,212,0.12) 0%, transparent 100%)' }}>
        <h1 className="text-2xl font-bold text-slate-100 mb-4">新刊カレンダー</h1>

        {/* 月ナビ */}
        <div className="flex items-center justify-between rounded-2xl px-4 py-3 mb-2"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={prev} className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-100 transition-colors"
            style={{ background: 'rgba(255,255,255,0.06)' }}>‹</button>
          <p className="font-semibold text-slate-100">{year}年{month}月</p>
          <button onClick={next} className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-100 transition-colors"
            style={{ background: 'rgba(255,255,255,0.06)' }}>›</button>
        </div>
      </div>

      <div className="px-5 space-y-3">
        {fetching && (
          <p className="text-xs text-center py-2" style={{ color: 'var(--text-muted)' }}>新刊情報を取得中...</p>
        )}
        {releases.length === 0 && !fetching ? (
          <div className="flex flex-col items-center justify-center pt-16 gap-3">
            <span className="text-4xl">📅</span>
            <p className="text-slate-400 text-sm text-center">
              この月の発売予定はありません
            </p>
          </div>
        ) : (
          releases.map(r => (
            <div key={r.id} className="flex gap-3 p-3 rounded-2xl"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              {r.coverUrl
                ? <img src={r.coverUrl} className="w-12 h-16 object-cover rounded-xl shrink-0" />
                : <div className="w-12 h-16 rounded-xl flex items-center justify-center text-2xl shrink-0"
                    style={{ background: 'rgba(6,182,212,0.15)' }}>📖</div>
              }
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{r.seriesTitle}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--accent)' }}>{r.volumeNumber}巻</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  {r.releaseDate ? new Date(r.releaseDate).toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' }) : ''}
                  {r.purchasePrice ? `　¥${r.purchasePrice.toLocaleString()}` : ''}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1 justify-center">
                {'isAuto' in r && r.isAuto && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: 'color-mix(in srgb, var(--accent2) 20%, transparent)', color: 'var(--accent2)' }}>自動</span>
                )}
                <span className="text-[10px] px-2 py-1 rounded-full font-medium"
                  style={{ background: 'rgba(6,182,212,0.15)', color: '#06b6d4' }}>
                  {r.status === 'owned' ? '購入済' : r.status === 'want' ? '欲しい' : '予定'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
