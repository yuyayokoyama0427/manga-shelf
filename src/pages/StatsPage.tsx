import { useMemo, useState } from 'react';
import type { Series, Volume } from '../types';

interface Props {
  series: Series[];
  volumes: Volume[];
  monthlySpend: () => Record<string, number>;
  dailySpend:   () => Record<string, number>;
  weeklySpend:  () => Record<string, number>;
}

type Period = '日' | '週' | '月';

function formatLabel(key: string, period: Period): string[] {
  if (period === '日') {
    // "YYYY-MM-DD" → ["M/D"]
    const [, m, d] = key.split('-');
    return [`${parseInt(m)}/${parseInt(d)}`];
  }
  if (period === '週') {
    // key = 日曜日の "YYYY-MM-DD"
    const sun = new Date(key);
    const sat = new Date(sun); sat.setDate(sun.getDate() + 6);
    const sm = sun.getMonth() + 1, sd = sun.getDate();
    const em = sat.getMonth() + 1, ed = sat.getDate();
    if (sm === em) return [`${sm}/${sd}`, `〜${ed}`];
    return [`${sm}/${sd}`, `〜${em}/${ed}`];
  }
  // 月: "YYYY-MM" → ["MM月", "1〜末日"]
  const [y, m] = key.split('-').map(Number);
  const lastDay = new Date(y, m, 0).getDate();
  return [`${m}月`, `1〜${lastDay}日`];
}

function BarChart({ data, maxBars, period }: { data: [string, number][]; maxBars: number; period: Period }) {
  const maxAmt = Math.max(...data.map(d => d[1]), 1);
  const today  = new Date().toISOString().slice(0, 10);
  const thisM  = new Date().toISOString().slice(0, 7);
  // 今週の日曜日
  const thisSun = (() => { const d = new Date(); d.setDate(d.getDate() - d.getDay()); return d.toISOString().slice(0, 10); })();

  const shown = data.slice(-maxBars);
  return (
    <div className="flex items-end gap-2 h-48">
      {shown.map(([key, amt]) => {
        const h   = (amt / maxAmt) * 100;
        const now = key === today || key === thisM || key === thisSun;
        const lines = formatLabel(key, period);
        return (
          <div key={key} className="flex-1 flex flex-col items-center gap-1 min-w-0">
            <p className="text-[10px] font-medium truncate w-full text-center" style={{ color: now ? 'var(--accent)' : 'var(--text-sub)' }}>
              {amt >= 1000 ? `¥${(amt/1000).toFixed(1)}k` : `¥${amt}`}
            </p>
            <div className="w-full rounded-t-xl transition-all duration-500"
              style={{ height: `${Math.max(h, 4)}%`, minHeight: '6px',
                background: now
                  ? 'linear-gradient(180deg, var(--accent2), var(--accent))'
                  : 'color-mix(in srgb, var(--accent) 40%, transparent)' }} />
            <div className="w-full text-center" style={{ lineHeight: '1.2' }}>
              {lines.map((l, i) => (
                <p key={i} className="text-[9px] truncate w-full" style={{ color: now ? 'var(--accent)' : 'var(--text-muted)' }}>{l}</p>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const DOW = ['日','月','火','水','木','金','土'];

function DayGrid({ daily, dayOffset }: { daily: Record<string, number>; dayOffset: number }) {
  const d = new Date(); d.setDate(d.getDate() + dayOffset);
  const key = d.toISOString().slice(0, 10);
  const amt = daily[key] ?? 0;
  const dow = d.getDay();
  const isToday = dayOffset === 0;
  return (
    <div className="flex justify-center">
      <div className="rounded-2xl p-6 flex flex-col items-center gap-2 w-40"
        style={{ background: isToday ? 'color-mix(in srgb, var(--accent) 15%, transparent)' : 'var(--input-bg)',
          border: `1px solid ${isToday ? 'var(--accent)' : 'var(--border)'}` }}>
        <p className="text-xs font-medium" style={{ color: dow === 0 ? '#f87171' : dow === 6 ? '#60a5fa' : 'var(--text-muted)' }}>
          {DOW[dow]}曜日
        </p>
        <p className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
          {d.getMonth()+1}/{d.getDate()}
        </p>
        <p className="text-xl font-bold" style={{ color: amt > 0 ? 'var(--accent)' : 'var(--text-muted)' }}>
          {amt > 0 ? `¥${amt.toLocaleString()}` : '-'}
        </p>
        {isToday && <p className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'var(--accent)', color: '#fff' }}>今日</p>}
      </div>
    </div>
  );
}

function WeekGrid({ daily, weekOffset }: { daily: Record<string, number>; weekOffset: number }) {
  const sun = new Date();
  sun.setDate(sun.getDate() - sun.getDay() + weekOffset * 7);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sun); d.setDate(sun.getDate() + i);
    return d;
  });
  const total = days.reduce((s, d) => s + (daily[d.toISOString().slice(0,10)] ?? 0), 0);
  return (
    <>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DOW.map((d, i) => (
          <p key={d} className="text-[10px] text-center font-medium"
            style={{ color: i === 0 ? '#f87171' : i === 6 ? '#60a5fa' : 'var(--text-muted)' }}>{d}</p>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((d, i) => {
          const key = d.toISOString().slice(0,10);
          const amt = daily[key] ?? 0;
          const isToday = key === new Date().toISOString().slice(0,10);
          return (
            <div key={key} className="rounded-xl p-1.5 flex flex-col items-center gap-0.5 min-h-[56px]"
              style={{ background: isToday ? 'color-mix(in srgb, var(--accent) 20%, transparent)' : 'var(--input-bg)',
                border: `1px solid ${isToday ? 'var(--accent)' : 'var(--border)'}` }}>
              <p className="text-[10px]" style={{ color: i === 0 ? '#f87171' : i === 6 ? '#60a5fa' : 'var(--text-sub)' }}>
                {d.getMonth()+1}/{d.getDate()}
              </p>
              {amt > 0
                ? <p className="text-[9px] font-bold leading-tight text-center" style={{ color: 'var(--accent)' }}>
                    ¥{amt >= 1000 ? `${(amt/1000).toFixed(1)}k` : amt}
                  </p>
                : <p className="text-[10px]" style={{ color: 'var(--border)' }}>-</p>
              }
            </div>
          );
        })}
      </div>
      {total > 0 && (
        <p className="text-xs text-right mt-2 font-medium" style={{ color: 'var(--text-sub)' }}>
          週計 <span style={{ color: 'var(--accent)' }}>¥{total.toLocaleString()}</span>
        </p>
      )}
    </>
  );
}

function MonthGrid({ daily, monthOffset }: { daily: Record<string, number>; monthOffset: number }) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + monthOffset; // 負数OK、Dateが補正
  const firstDay = new Date(year, month, 1);
  const lastDate = new Date(year, month + 1, 0).getDate();
  const startDow = firstDay.getDay(); // 月初の曜日
  const total = Array.from({ length: lastDate }, (_, i) => {
    const key = new Date(year, month, i + 1).toISOString().slice(0,10);
    return daily[key] ?? 0;
  }).reduce((s, v) => s + v, 0);

  const cells: (number | null)[] = [
    ...Array(startDow).fill(null),
    ...Array.from({ length: lastDate }, (_, i) => i + 1),
  ];
  // 6行になる場合も考慮
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DOW.map((d, i) => (
          <p key={d} className="text-[10px] text-center font-medium"
            style={{ color: i === 0 ? '#f87171' : i === 6 ? '#60a5fa' : 'var(--text-muted)' }}>{d}</p>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((date, idx) => {
          if (date === null) return <div key={idx} />;
          const key = new Date(year, month, date).toISOString().slice(0,10);
          const amt = daily[key] ?? 0;
          const isToday = key === new Date().toISOString().slice(0,10);
          const dow = (startDow + date - 1) % 7;
          return (
            <div key={key} className="rounded-lg p-1 flex flex-col items-center gap-0.5 min-h-[46px]"
              style={{ background: isToday ? 'color-mix(in srgb, var(--accent) 20%, transparent)' : amt > 0 ? 'color-mix(in srgb, var(--accent) 8%, transparent)' : 'transparent',
                border: `1px solid ${isToday ? 'var(--accent)' : amt > 0 ? 'color-mix(in srgb, var(--accent) 30%, transparent)' : 'transparent'}` }}>
              <p className="text-[10px] font-medium" style={{ color: dow === 0 ? '#f87171' : dow === 6 ? '#60a5fa' : 'var(--text-sub)' }}>{date}</p>
              {amt > 0
                ? <p className="text-[8px] font-bold leading-tight text-center" style={{ color: 'var(--accent)' }}>
                    ¥{amt >= 1000 ? `${(amt/1000).toFixed(1)}k` : amt}
                  </p>
                : null
              }
            </div>
          );
        })}
      </div>
      {total > 0 && (
        <p className="text-xs text-right mt-2 font-medium" style={{ color: 'var(--text-sub)' }}>
          月計 <span style={{ color: 'var(--accent)' }}>¥{total.toLocaleString()}</span>
        </p>
      )}
    </>
  );
}

export function StatsPage({ series, volumes, monthlySpend, dailySpend, weeklySpend }: Props) {
  const [period, setPeriod] = useState<Period>('月');
  const [gridOffset, setGridOffset] = useState(0);

  const monthly = useMemo(monthlySpend, [volumes]);
  const daily   = useMemo(dailySpend,   [volumes]);
  const weekly  = useMemo(weeklySpend,  [volumes]);

  const chartData = useMemo((): [string, number][] => {
    const map = period === '月' ? monthly : period === '週' ? weekly : daily;
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [period, monthly, daily, weekly]);

  const totalOwned   = volumes.filter(v => v.status === 'owned' || v.status === 'reading' || v.status === 'backlog').length;
  const totalRead    = volumes.filter(v => v.status === 'reading').length;
  const totalWant    = volumes.filter(v => v.status === 'want').length;
  const totalSpend   = Object.values(monthly).reduce((s, v) => s + v, 0);
  const thisM        = new Date().toISOString().slice(0, 7);
  const thisMonthAmt = monthly[thisM] ?? 0;

  const maxBars = period === '日' ? 14 : period === '週' ? 8 : 6;

  return (
    <div className="pb-28 md:pb-8">
      <div className="px-5 pt-14 md:pt-8 pb-4"
        style={{ background: 'linear-gradient(180deg, color-mix(in srgb, var(--accent2) 12%, transparent) 0%, transparent 100%)' }}>
        <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text)' }}>統計</h1>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>あなたの漫画ライフを可視化</p>
      </div>

      <div className="px-5 space-y-4">
        {/* サマリー */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: '今月の出費', value: `¥${thisMonthAmt.toLocaleString()}`, color: 'var(--accent2)', icon: '💸' },
            { label: '累計出費',   value: `¥${totalSpend.toLocaleString()}`,   color: 'var(--accent)',  icon: '📈' },
            { label: '所持巻数',   value: `${totalOwned}巻`,                   color: '#34d399',        icon: '📦' },
            { label: '読了',       value: `${totalRead}巻`,                    color: '#06b6d4',        icon: '✅' },
          ].map(c => (
            <div key={c.label} className="rounded-2xl p-4"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <p className="text-xl mb-1">{c.icon}</p>
              <p className="text-lg font-bold" style={{ color: c.color }}>{c.value}</p>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{c.label}</p>
            </div>
          ))}
        </div>

        {/* 購入金額グラフ */}
        <div className="rounded-2xl p-5"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>購入金額</p>
            {/* 期間タブ */}
            <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
              {(['日','週','月'] as Period[]).map(p => (
                <button key={p} onClick={() => { setPeriod(p); setGridOffset(0); }}
                  className="px-3 py-1 text-xs font-medium transition-all"
                  style={period === p
                    ? { background: 'var(--accent)', color: '#fff' }
                    : { background: 'transparent', color: 'var(--text-muted)' }}>
                  {p}
                </button>
              ))}
            </div>
          </div>
          {chartData.length === 0 ? (
            <div className="flex flex-col items-center py-8 gap-2">
              <span className="text-3xl">📊</span>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>購入記録を追加するとグラフが表示されます</p>
            </div>
          ) : (
            <BarChart data={chartData} maxBars={maxBars} period={period} />
          )}
        </div>

        {/* 家計簿グリッド（週・月のみ） */}
        {(
          <div className="rounded-2xl p-5"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => setGridOffset(o => o - 1)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-lg"
                style={{ background: 'var(--input-bg)', color: 'var(--text-sub)' }}>‹</button>
              <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                {period === '日' ? (() => {
                    const d = new Date(); d.setDate(d.getDate() + gridOffset);
                    return `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日`;
                  })() : period === '週' ? (() => {
                    const sun = new Date(); sun.setDate(sun.getDate() - sun.getDay() + gridOffset * 7);
                    const sat = new Date(sun); sat.setDate(sun.getDate() + 6);
                    return `${sun.getMonth()+1}/${sun.getDate()} 〜 ${sat.getMonth()+1}/${sat.getDate()}`;
                  })() : (() => {
                    const d = new Date(); d.setMonth(d.getMonth() + gridOffset);
                    return `${d.getFullYear()}年${d.getMonth()+1}月`;
                  })()}
              </p>
              <button onClick={() => setGridOffset(o => Math.min(o + 1, 0))}
                className="w-8 h-8 rounded-full flex items-center justify-center text-lg"
                style={{ background: 'var(--input-bg)', color: gridOffset >= 0 ? 'var(--border)' : 'var(--text-sub)' }}
                disabled={gridOffset >= 0}>›</button>
            </div>
            {period === '日'
              ? <DayGrid daily={daily} dayOffset={gridOffset} />
              : period === '週'
              ? <WeekGrid daily={daily} weekOffset={gridOffset} />
              : <MonthGrid daily={daily} monthOffset={gridOffset} />
            }
          </div>
        )}

        {/* ライブラリ概要 */}
        <div className="rounded-2xl p-5"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <p className="text-sm font-semibold mb-3" style={{ color: 'var(--text)' }}>ライブラリ概要</p>
          <div className="space-y-2">
            {[
              { label: 'シリーズ数', value: series.length,  color: 'var(--accent)' },
              { label: '所持巻数',   value: totalOwned,     color: '#34d399' },
              { label: '読了',       value: totalRead,      color: '#06b6d4' },
              { label: '欲しい',     value: totalWant,      color: '#fb923c' },
            ].map(r => (
              <div key={r.label} className="flex items-center justify-between">
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{r.label}</p>
                <p className="text-sm font-bold" style={{ color: r.color }}>{r.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
