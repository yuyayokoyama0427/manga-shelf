import { useState, useCallback } from 'react';
import { storage } from '../utils/storage';
import type { Series, Volume } from '../types';

export function useStore() {
  const [series, setSeries]   = useState<Series[]>(() => storage.getSeries());
  const [volumes, setVolumes] = useState<Volume[]>(() => storage.getVolumes());

  const refresh = useCallback(() => {
    setSeries(storage.getSeries());
    setVolumes(storage.getVolumes());
  }, []);

  const addSeries     = useCallback((s: Series) => { storage.addSeries(s); refresh(); }, [refresh]);
  const deleteSeries  = useCallback((id: string) => { storage.deleteSeries(id); refresh(); }, [refresh]);
  const upsertVolume  = useCallback((v: Volume) => { storage.upsertVolume(v); refresh(); }, [refresh]);

  // 一括追加
  const addVolumes = useCallback((vs: Volume[]) => {
    const list = storage.getVolumes();
    const merged = [...list];
    vs.forEach(v => {
      const idx = merged.findIndex(x => x.seriesId === v.seriesId && x.volumeNumber === v.volumeNumber);
      if (idx >= 0) merged[idx] = v; else merged.push(v);
    });
    storage.saveVolumes(merged);
    refresh();
  }, [refresh]);

  const volumesOf = useCallback((seriesId: string) =>
    volumes.filter(v => v.seriesId === seriesId).sort((a, b) => a.volumeNumber - b.volumeNumber),
    [volumes]);

  // 月別 { 'YYYY-MM': 金額 }
  const monthlySpend = useCallback((): Record<string, number> => {
    const map: Record<string, number> = {};
    volumes.forEach(v => {
      if (v.purchaseDate && v.purchasePrice) {
        const key = v.purchaseDate.slice(0, 7);
        map[key] = (map[key] ?? 0) + v.purchasePrice;
      }
    });
    return map;
  }, [volumes]);

  // 日別 { 'YYYY-MM-DD': 金額 }
  const dailySpend = useCallback((): Record<string, number> => {
    const map: Record<string, number> = {};
    volumes.forEach(v => {
      if (v.purchaseDate && v.purchasePrice) {
        map[v.purchaseDate] = (map[v.purchaseDate] ?? 0) + v.purchasePrice;
      }
    });
    return map;
  }, [volumes]);

  // 週別 { 'YYYY-MM-DD(日曜日)': 金額 }
  const weeklySpend = useCallback((): Record<string, number> => {
    const map: Record<string, number> = {};
    volumes.forEach(v => {
      if (v.purchaseDate && v.purchasePrice) {
        const d = new Date(v.purchaseDate);
        const sunday = new Date(d);
        sunday.setDate(d.getDate() - d.getDay()); // その週の日曜日
        const key = sunday.toISOString().slice(0, 10);
        map[key] = (map[key] ?? 0) + v.purchasePrice;
      }
    });
    return map;
  }, [volumes]);

  return { series, volumes, addSeries, deleteSeries, upsertVolume, addVolumes, volumesOf, monthlySpend, dailySpend, weeklySpend };
}
