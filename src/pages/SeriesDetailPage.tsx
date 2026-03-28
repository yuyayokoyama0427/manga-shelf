import { useState, useRef } from 'react';
import type { Series, Volume, ReadStatus } from '../types';
import { searchManga } from '../utils/googleBooks';

interface Props {
  series: Series;
  volumes: Volume[];
  onBack: () => void;
  onUpsertVolume: (v: Volume) => void;
  onAddVolumes: (vs: Volume[]) => void;
  onDelete: (id: string) => void;
  onDeleteVolume: (id: string) => void;
  onUpdateSeries: (s: Series) => void;
}

const STATUS_LABEL: Record<ReadStatus, string> = {
  reading: '読了', owned: '所持', want: '欲しい', backlog: '積読',
};
const STATUS_COLOR: Record<ReadStatus, string> = {
  reading: '#34d399', owned: '#a78bfa', want: '#fb923c', backlog: '#64748b',
};

type AddMode = 'single' | 'bulk';

export function SeriesDetailPage({ series, volumes, onBack, onUpsertVolume, onAddVolumes, onDelete, onDeleteVolume, onUpdateSeries }: Props) {
  // 次の未登録巻を計算
  const nextVolNum = () => {
    if (volumes.length === 0) return '1';
    const nums = volumes.map(v => v.volumeNumber).sort((a, b) => a - b);
    for (let i = 1; i <= nums[nums.length - 1] + 1; i++) {
      if (!nums.includes(i)) return String(i);
    }
    return String(nums[nums.length - 1] + 1);
  };

  const [showForm, setShowForm] = useState(false);
  const [addMode, setAddMode]   = useState<AddMode>('single');
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({ title: series.title, author: series.author, coverUrl: series.coverUrl });

  // 単巻追加
  const [sv, setSv] = useState({ num: '', price: '', date: '', releaseDate: '', status: 'owned' as ReadStatus });
  const [fetchingDate, setFetchingDate] = useState(false);
  const [fetchFailed, setFetchFailed] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openForm = () => {
    const num = nextVolNum();
    setSv({ num, price: '', date: '', releaseDate: '', status: 'owned' });
    setShowForm(true);
    autoFetchReleaseDate(num);
  };

  const autoFetchReleaseDate = (num: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setFetchFailed(false);
    if (!num) return;
    debounceRef.current = setTimeout(async () => {
      setFetchingDate(true);
      try {
        // intitle: で正確なタイトルに絞り込み、"巻"付きで巻数を明示
        const query = `intitle:${series.title} ${num}巻`;
        const results = await searchManga(query);
        const target = parseInt(num);
        // 巻数一致を優先、なければ価格か日付があるものを使う
        const match = results.find(r => r.volumeNumber === target && (r.price !== null || r.publishedDate !== null))
          ?? results.find(r => r.volumeNumber === target)
          ?? results.find(r => r.price !== null || r.publishedDate !== null);
        if (match?.publishedDate) {
          setSv(n => ({ ...n, releaseDate: match.publishedDate! }));
        } else {
          setFetchFailed(true);
        }
        if (match?.price) {
          setSv(n => ({ ...n, price: String(match.price) }));
        }
      } catch (e) {
        console.error('[fetch error]', e);
        setFetchFailed(true);
      }
      setFetchingDate(false);
    }, 800);
  };
  // 一括追加
  const [bv, setBv] = useState({ from: '', to: '', price: '', date: '', status: 'owned' as ReadStatus });

  const addSingle = () => {
    if (!sv.num) return;
    onUpsertVolume({
      id: crypto.randomUUID(), seriesId: series.id,
      volumeNumber: parseInt(sv.num), status: sv.status,
      purchasePrice: sv.price ? parseInt(sv.price) : null,
      purchaseDate: sv.date || null, releaseDate: sv.releaseDate || null,
    });
    setSv({ num: '', price: '', date: '', releaseDate: '', status: 'owned' });
    setShowForm(false);
  };

  const addBulk = () => {
    const from = parseInt(bv.from), to = parseInt(bv.to);
    if (!from || !to || from > to) return;
    const vs: Volume[] = [];
    for (let n = from; n <= to; n++) {
      vs.push({
        id: crypto.randomUUID(), seriesId: series.id,
        volumeNumber: n, status: bv.status,
        purchasePrice: bv.price ? parseInt(bv.price) : null,
        purchaseDate: bv.date || null, releaseDate: null,
      });
    }
    onAddVolumes(vs);
    setBv({ from: '', to: '', price: '', date: '', status: 'owned' });
    setShowForm(false);
  };

  const cycleStatus = (v: Volume) => {
    const order: ReadStatus[] = ['want', 'owned', 'reading', 'backlog'];
    onUpsertVolume({ ...v, status: order[(order.indexOf(v.status) + 1) % order.length] });
  };

  return (
    <div className="pb-28 md:pb-8">
      {/* ヒーロー */}
      <div className="relative">
        <div className="h-48 overflow-hidden">
          {series.coverUrl
            ? <img src={series.coverUrl} className="w-full h-full object-cover blur-sm scale-110 opacity-40" />
            : <div className="w-full h-full" style={{ background: 'linear-gradient(135deg, #1e1b4b, #4c1d95)' }} />
          }
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 30%, var(--bg))' }} />
        </div>
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-4 flex gap-4 items-end">
          {series.coverUrl
            ? <img src={series.coverUrl} className="w-20 h-28 object-cover rounded-2xl shadow-2xl shrink-0" />
            : <div className="w-20 h-28 rounded-2xl flex items-center justify-center text-4xl shrink-0"
                style={{ background: 'color-mix(in srgb, var(--accent) 40%, transparent)' }}>📖</div>
          }
          <div className="min-w-0 pb-1">
            <p className="text-lg font-bold leading-tight" style={{ color: 'var(--text)' }}>{series.title}</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-sub)' }}>{series.author}</p>
            <div className="flex gap-2 mt-2">
              {series.isCompleted && <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-600 text-white">完結</span>}
              {series.genre && <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'color-mix(in srgb, var(--accent) 30%, transparent)', color: 'var(--accent)' }}>{series.genre}</span>}
            </div>
          </div>
        </div>
        <button onClick={onBack} className="absolute top-4 left-4 w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', color: '#fff' }}>‹</button>
        <button onClick={() => { setEditForm({ title: series.title, author: series.author, coverUrl: series.coverUrl }); setShowEdit(true); }}
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-sm"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', color: '#fff' }}>✏️</button>
      </div>

      <div className="px-5 mt-4 space-y-4">
        {/* シリーズ編集フォーム */}
        {showEdit && (
          <div className="rounded-2xl p-4 space-y-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>シリーズを編集</p>
            {[
              { key: 'title', label: 'タイトル', type: 'text' },
              { key: 'author', label: '著者', type: 'text' },
              { key: 'coverUrl', label: 'カバー画像URL', type: 'text' },
            ].map(f => (
              <div key={f.key} className="flex flex-col gap-1">
                <label className="text-[10px] px-1" style={{ color: 'var(--text-muted)' }}>{f.label}</label>
                <input type={f.type} value={(editForm as any)[f.key]}
                  onChange={e => setEditForm(n => ({ ...n, [f.key]: e.target.value }))}
                  className="rounded-xl px-3 py-2 text-sm outline-none"
                  style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text)' }} />
              </div>
            ))}
            <div className="flex gap-2">
              <button onClick={() => { onUpdateSeries({ ...series, ...editForm }); setShowEdit(false); }}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: 'color-mix(in srgb, var(--accent) 30%, transparent)', color: 'var(--accent)', border: '1px solid color-mix(in srgb, var(--accent) 40%, transparent)' }}>
                保存
              </button>
              <button onClick={() => setShowEdit(false)}
                className="px-4 py-2.5 rounded-xl text-sm"
                style={{ background: 'var(--input-bg)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                キャンセル
              </button>
            </div>
          </div>
        )}

        {/* 追加ボタン */}
        <button onClick={() => showForm ? setShowForm(false) : openForm()}
          className="w-full py-3 rounded-2xl text-sm font-semibold"
          style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent2))', color: '#fff' }}>
          + 巻を追加
        </button>

        {/* フォーム */}
        {showForm && (
          <div className="rounded-2xl p-4 space-y-3"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            {/* モード切り替え */}
            <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
              {(['single','bulk'] as AddMode[]).map(m => (
                <button key={m} onClick={() => setAddMode(m)}
                  className="flex-1 py-2 text-xs font-medium transition-all"
                  style={addMode === m
                    ? { background: 'var(--accent)', color: '#fff' }
                    : { background: 'transparent', color: 'var(--text-muted)' }}>
                  {m === 'single' ? '1冊ずつ' : '一括追加'}
                </button>
              ))}
            </div>

            {addMode === 'single' ? (
              <>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'num',         label: '巻数 *',              type: 'number', min: '1' },
                    { key: 'price',       label: sv.price ? '定価（自動取得済）' : '購入価格（円）', type: 'number', min: '0' },
                    { key: 'date',        label: '購入日',               type: 'date',   min: undefined },
                    { key: 'releaseDate', label: fetchingDate ? '発売日 取得中...' : fetchFailed ? '発売日（手動入力）' : sv.releaseDate ? '発売日（自動取得済）' : '発売日', type: 'date', min: undefined },
                  ].map(f => (
                    <div key={f.key} className="flex flex-col gap-1">
                      <label className="text-[10px] px-1" style={{ color: 'var(--text-muted)' }}>{f.label}</label>
                      <input type={f.type} min={f.min}
                        value={(sv as any)[f.key]}
                        onChange={e => {
                          setSv(n => ({ ...n, [f.key]: e.target.value }));
                          if (f.key === 'num') autoFetchReleaseDate(e.target.value);
                        }}
                        className="rounded-xl px-3 py-2 text-sm outline-none"
                        style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text)' }} />
                    </div>
                  ))}
                </div>
                <StatusPicker value={sv.status} onChange={s => setSv(n => ({ ...n, status: s }))} />
                <button onClick={addSingle}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold"
                  style={{ background: 'color-mix(in srgb, var(--accent) 30%, transparent)', color: 'var(--accent)', border: '1px solid color-mix(in srgb, var(--accent) 40%, transparent)' }}>
                  保存
                </button>
              </>
            ) : (
              <>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>追加する巻の範囲を指定してください</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'from', label: '開始巻 *', type: 'number', min: '1', span: false },
                    { key: 'to',   label: '終了巻 *', type: 'number', min: '1', span: false },
                    { key: 'price',label: '1冊あたりの価格（円）', type: 'number', min: '0', span: true },
                  ].map(f => (
                    <div key={f.key} className={`flex flex-col gap-1${f.span ? ' col-span-2' : ''}`}>
                      <label className="text-[10px] px-1" style={{ color: 'var(--text-muted)' }}>{f.label}</label>
                      <input type={f.type} min={f.min} value={(bv as any)[f.key]}
                        onChange={e => setBv(n => ({ ...n, [f.key]: e.target.value }))}
                        className="rounded-xl px-3 py-2 text-sm outline-none"
                        style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text)' }} />
                    </div>
                  ))}
                  <div className="col-span-2 flex flex-col gap-1">
                    <label className="text-[10px] px-1" style={{ color: 'var(--text-muted)' }}>購入日</label>
                    <input type="date" value={bv.date}
                      onChange={e => setBv(n => ({ ...n, date: e.target.value }))}
                      className="rounded-xl px-3 py-2 text-sm outline-none"
                      style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text)' }} />
                  </div>
                </div>
                <StatusPicker value={bv.status} onChange={s => setBv(n => ({ ...n, status: s }))} />
                {bv.from && bv.to && parseInt(bv.from) <= parseInt(bv.to) && (
                  <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
                    {parseInt(bv.from)}〜{parseInt(bv.to)}巻（計{parseInt(bv.to)-parseInt(bv.from)+1}冊）を追加
                    {bv.price && `・合計 ¥${((parseInt(bv.to)-parseInt(bv.from)+1)*parseInt(bv.price)).toLocaleString()}`}
                  </p>
                )}
                <button onClick={addBulk}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold"
                  style={{ background: 'color-mix(in srgb, var(--accent) 30%, transparent)', color: 'var(--accent)', border: '1px solid color-mix(in srgb, var(--accent) 40%, transparent)' }}>
                  一括追加
                </button>
              </>
            )}
          </div>
        )}

        {/* 巻リスト */}
        {volumes.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{volumes.length}巻登録済み　タップでステータス変更</p>
            {volumes.map(v => (
              <div key={v.id} onClick={() => cycleStatus(v)}
                className="flex items-center gap-3 p-3 rounded-2xl cursor-pointer active:scale-[0.98] transition-transform"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ background: `${STATUS_COLOR[v.status]}22`, color: STATUS_COLOR[v.status] }}>
                  {v.volumeNumber}
                </div>
                <div className="flex-1">
                  <p className="text-sm" style={{ color: 'var(--text)' }}>{series.title} {v.volumeNumber}巻</p>
                  {v.purchasePrice && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>¥{v.purchasePrice.toLocaleString()}</p>}
                </div>
                <span className="text-[11px] px-2 py-1 rounded-full font-medium"
                  style={{ background: `${STATUS_COLOR[v.status]}22`, color: STATUS_COLOR[v.status] }}>
                  {STATUS_LABEL[v.status]}
                </span>
                <button
                  onClick={e => { e.stopPropagation(); onDeleteVolume(v.id); }}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0"
                  style={{ color: 'var(--text-muted)' }}>
                  ×
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>まだ巻が登録されていません</p>
        )}

        <button onClick={() => { if (window.confirm(`「${series.title}」を削除しますか？巻のデータもすべて消えます。`)) { onDelete(series.id); onBack(); } }}
          className="w-full py-3 rounded-2xl text-sm transition-colors"
          style={{ color: 'var(--text-muted)' }}>
          このシリーズを削除
        </button>
      </div>
    </div>
  );
}

function StatusPicker({ value, onChange }: { value: ReadStatus; onChange: (s: ReadStatus) => void }) {
  return (
    <div className="flex gap-2">
      {(Object.keys(STATUS_LABEL) as ReadStatus[]).map(s => (
        <button key={s} onClick={() => onChange(s)}
          className="flex-1 py-1.5 rounded-xl text-[11px] font-medium transition-all"
          style={value === s
            ? { background: STATUS_COLOR[s], color: '#fff' }
            : { background: 'var(--input-bg)', color: 'var(--text-sub)' }}>
          {STATUS_LABEL[s]}
        </button>
      ))}
    </div>
  );
}
