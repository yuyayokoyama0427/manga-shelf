import type { Series, Volume } from '../types';

interface Props {
  series: Series;
  volumes: Volume[];
  onClick: () => void;
}

export function SeriesCard({ series, volumes, onClick }: Props) {
  const owned   = volumes.filter(v => v.status === 'owned' || v.status === 'reading').length;
  const read    = volumes.filter(v => v.status === 'reading').length;
  const total   = series.totalVolumes ?? owned;
  const pct     = total > 0 ? Math.min((read / total) * 100, 100) : 0;
  const latest  = volumes.reduce((max, v) => Math.max(max, v.volumeNumber), 0);

  return (
    <button onClick={onClick} className="w-full text-left group">
      <div className="rounded-2xl overflow-hidden transition-transform duration-200 active:scale-95"
        style={{ background: 'rgba(26,26,46,0.8)', border: '1px solid rgba(255,255,255,0.06)' }}>
        {/* カバー */}
        <div className="relative aspect-[2/3] overflow-hidden">
          {series.coverUrl ? (
            <img src={series.coverUrl} alt={series.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl"
              style={{ background: 'linear-gradient(135deg, #1e1b4b, #4c1d95)' }}>
              📖
            </div>
          )}
          {/* 最新巻バッジ */}
          {latest > 0 && (
            <div className="absolute top-2 right-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ background: 'rgba(0,0,0,0.7)', color: '#a78bfa', backdropFilter: 'blur(4px)' }}>
              {latest}巻
            </div>
          )}
          {/* 完結バッジ */}
          {series.isCompleted && (
            <div className="absolute top-2 left-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ background: '#059669', color: '#fff' }}>完結</div>
          )}
        </div>
        {/* 情報 */}
        <div className="p-2">
          <p className="text-xs font-semibold text-slate-100 truncate leading-tight">{series.title}</p>
          <p className="text-[10px] text-slate-400 truncate mt-0.5">{series.author}</p>
          {/* 読了バー */}
          <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #7c3aed, #ec4899)' }} />
          </div>
          <p className="text-[9px] text-slate-500 mt-1">{owned}所持 / {read}読了</p>
        </div>
      </div>
    </button>
  );
}
