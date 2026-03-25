import type { Series, Volume } from '../types';

const STATUS_LABEL: Record<string, string> = {
  owned:   '所持',
  reading: '読了',
  want:    '欲しい',
  backlog: '積読',
};

export function exportCSV(series: Series[], volumes: Volume[]): void {
  const headers = ['タイトル', '著者', 'ジャンル', '種類', '巻数', 'ステータス', '購入価格（円）', '購入日', '発売日'];

  const rows = volumes.map(v => {
    const s = series.find(x => x.id === v.seriesId);
    if (!s) return null;
    return [
      s.title,
      s.author,
      s.genre,
      s.bookType === 'manga' ? '漫画' : '書籍',
      String(v.volumeNumber),
      STATUS_LABEL[v.status] ?? v.status,
      v.purchasePrice != null ? String(v.purchasePrice) : '',
      v.purchaseDate ?? '',
      v.releaseDate ?? '',
    ];
  }).filter(Boolean) as string[][];

  const escape = (s: string) => `"${s.replace(/"/g, '""')}"`;
  const csv = [headers, ...rows].map(row => row.map(escape).join(',')).join('\r\n');

  const bom = '\uFEFF'; // Excelで文字化けしないようにBOM付きUTF-8
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `manga-shelf_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
