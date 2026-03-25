import type { Series, Volume } from '../types';

const KEYS = { series: 'manga_series', volumes: 'manga_volumes' };

export const storage = {
  getSeries: (): Series[] => JSON.parse(localStorage.getItem(KEYS.series) ?? '[]'),
  saveSeries: (data: Series[]) => localStorage.setItem(KEYS.series, JSON.stringify(data)),

  getVolumes: (): Volume[] => JSON.parse(localStorage.getItem(KEYS.volumes) ?? '[]'),
  saveVolumes: (data: Volume[]) => localStorage.setItem(KEYS.volumes, JSON.stringify(data)),

  addSeries: (s: Series) => {
    const list = storage.getSeries();
    storage.saveSeries([...list, s]);
  },
  deleteSeries: (id: string) => {
    storage.saveSeries(storage.getSeries().filter(s => s.id !== id));
    storage.saveVolumes(storage.getVolumes().filter(v => v.seriesId !== id));
  },
  upsertVolume: (v: Volume) => {
    const list = storage.getVolumes();
    const idx = list.findIndex(x => x.id === v.id);
    if (idx >= 0) list[idx] = v; else list.push(v);
    storage.saveVolumes(list);
  },
};
