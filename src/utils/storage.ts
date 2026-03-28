import type { Series, Volume } from '../types';

const KEYS = { series: 'manga_series', volumes: 'manga_volumes' };

export const storage = {
  getSeries: (): Series[] => {
    try { return JSON.parse(localStorage.getItem(KEYS.series) ?? '[]') } catch { return [] }
  },
  saveSeries: (data: Series[]) => {
    try { localStorage.setItem(KEYS.series, JSON.stringify(data)) } catch {}
  },

  getVolumes: (): Volume[] => {
    try { return JSON.parse(localStorage.getItem(KEYS.volumes) ?? '[]') } catch { return [] }
  },
  saveVolumes: (data: Volume[]) => {
    try { localStorage.setItem(KEYS.volumes, JSON.stringify(data)) } catch {}
  },

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
  deleteVolume: (id: string) => {
    storage.saveVolumes(storage.getVolumes().filter(v => v.id !== id));
  },
  updateSeries: (s: Series) => {
    const list = storage.getSeries();
    const idx = list.findIndex(x => x.id === s.id);
    if (idx >= 0) { list[idx] = s; storage.saveSeries(list); }
  },
};
