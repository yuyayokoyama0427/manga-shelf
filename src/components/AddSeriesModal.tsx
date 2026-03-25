import { useState } from 'react';
import { searchManga } from '../utils/googleBooks';
import type { Series, BookType } from '../types';

interface Props {
  onAdd: (s: Series) => void;
  onClose: () => void;
}

export function AddSeriesModal({ onAdd, onClose }: Props) {
  const [query, setQuery]       = useState('');
  const [results, setResults]   = useState<any[]>([]);
  const [loading, setLoading]   = useState(false);
  const [bookType, setBookType] = useState<BookType>('manga');
  const [manual, setManual]     = useState({ title: '', author: '', coverUrl: '', genre: '', totalVolumes: '' });

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    const res = await searchManga(query);
    setResults(res);
    setLoading(false);
  };

  const pickResult = (r: any) => {
    // 末尾の巻数表記を除去してシリーズ名にする（例: "ONE PIECE 1" → "ONE PIECE"）
    const cleanTitle = r.title.replace(/[\s　]+[\d０-９]+[巻冊]?\s*$/, '').trim() || r.title;
    const s: Series = {
      id: crypto.randomUUID(),
      title: cleanTitle,
      author: r.author,
      coverUrl: r.coverUrl,
      genre: '',
      totalVolumes: null,
      isCompleted: false,
      addedAt: new Date().toISOString(),
      bookType,
    };
    onAdd(s);
    onClose();
  };

  const addManual = () => {
    if (!manual.title.trim()) return;
    const s: Series = {
      id: crypto.randomUUID(),
      title: manual.title,
      author: manual.author,
      coverUrl: manual.coverUrl,
      genre: manual.genre,
      totalVolumes: manual.totalVolumes ? parseInt(manual.totalVolumes) : null,
      isCompleted: false,
      addedAt: new Date().toISOString(),
      bookType,
    };
    onAdd(s);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={onClose}>
      <div className="w-full max-w-[430px] mx-auto rounded-t-3xl overflow-hidden"
        style={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.08)', maxHeight: '85dvh' }}
        onClick={e => e.stopPropagation()}>

        {/* ハンドル */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.2)' }} />
        </div>

        <div className="px-5 pb-6 overflow-y-auto" style={{ maxHeight: 'calc(85dvh - 40px)' }}>
          <h2 className="text-lg font-bold text-slate-100 mb-4">作品を追加</h2>

          {/* 漫画/書籍 切り替え */}
          <div className="flex rounded-xl overflow-hidden mb-4" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
            {(['manga', 'book'] as BookType[]).map(t => (
              <button key={t} onClick={() => setBookType(t)}
                className="flex-1 py-2 text-sm font-medium transition-all"
                style={bookType === t
                  ? { background: 'linear-gradient(135deg, var(--accent), var(--accent2))', color: '#fff' }
                  : { background: 'transparent', color: 'rgba(255,255,255,0.4)' }}>
                {t === 'manga' ? '漫画' : '書籍'}
              </button>
            ))}
          </div>

          {/* 検索 */}
          <div className="flex gap-2 mb-4">
            <input value={query} onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && search()}
              placeholder="タイトルで検索..."
              className="flex-1 rounded-xl px-4 py-2.5 text-sm text-slate-100 outline-none"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
            <button onClick={search} disabled={loading}
              className="px-4 py-2.5 rounded-xl text-sm font-medium transition-opacity"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #ec4899)', color: '#fff' }}>
              {loading ? '...' : '検索'}
            </button>
          </div>

          {/* 検索結果 */}
          {results.length > 0 && (
            <div className="space-y-2 mb-6">
              <p className="text-xs px-1 pb-1" style={{ color: 'var(--text-muted, #94a3b8)' }}>
                どれか1冊を選んでシリーズ登録 → 詳細ページで巻数を一括追加できます
              </p>
              {results.map((r, i) => (
                <button key={i} onClick={() => pickResult(r)}
                  className="w-full flex gap-3 p-3 rounded-xl text-left transition-all active:scale-98"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  {r.coverUrl
                    ? <img src={r.coverUrl} className="w-10 h-14 object-cover rounded-lg shrink-0" />
                    : <div className="w-10 h-14 rounded-lg flex items-center justify-center text-xl shrink-0"
                        style={{ background: 'rgba(124,58,237,0.3)' }}>📖</div>
                  }
                  <div className="min-w-0">
                    <p className="text-sm text-slate-100 font-medium truncate">{r.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{r.author}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* 手動入力 */}
          <div className="border-t pt-4" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <p className="text-xs text-slate-400 mb-3">見つからない場合は手動で追加</p>
            <div className="space-y-2">
              {[
                { key: 'title',       placeholder: 'タイトル *', type: 'text' },
                { key: 'author',      placeholder: '著者',       type: 'text' },
                { key: 'genre',       placeholder: 'ジャンル',   type: 'text' },
                { key: 'totalVolumes',placeholder: '全巻数（完結の場合）', type: 'number', min: '1' },
                { key: 'coverUrl',    placeholder: '表紙画像URL', type: 'url' },
              ].map(f => (
                <input key={f.key} type={f.type} placeholder={f.placeholder} min={(f as any).min}
                  value={(manual as any)[f.key]}
                  onChange={e => setManual(m => ({ ...m, [f.key]: e.target.value }))}
                  className="w-full rounded-xl px-4 py-2.5 text-sm text-slate-100 outline-none"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
              ))}
              <button onClick={addManual}
                className="w-full py-3 rounded-xl text-sm font-semibold transition-opacity"
                style={{ background: 'rgba(124,58,237,0.3)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.4)' }}>
                追加する
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
