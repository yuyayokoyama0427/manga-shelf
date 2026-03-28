import { useState, useCallback, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Series, Volume } from '../types/index'

function rowToSeries(row: Record<string, unknown>): Series {
  return {
    id: row.id as string,
    title: row.title as string,
    author: (row.author as string) ?? '',
    coverUrl: (row.cover_url as string) ?? '',
    genre: (row.genre as string) ?? '',
    totalVolumes: row.total_volumes as number | null,
    isCompleted: (row.is_completed as boolean) ?? false,
    addedAt: (row.added_at as string) ?? '',
    bookType: ((row.book_type as string) ?? 'manga') as Series['bookType'],
  }
}

function seriesToRow(s: Series, userId: string) {
  return {
    id: s.id,
    user_id: userId,
    title: s.title,
    author: s.author,
    cover_url: s.coverUrl,
    genre: s.genre,
    total_volumes: s.totalVolumes,
    is_completed: s.isCompleted,
    added_at: s.addedAt,
    book_type: s.bookType,
  }
}

function rowToVolume(row: Record<string, unknown>): Volume {
  return {
    id: row.id as string,
    seriesId: row.series_id as string,
    volumeNumber: row.volume_number as number,
    status: (row.status as Volume['status']) ?? 'owned',
    purchasePrice: row.purchase_price as number | null,
    purchaseDate: row.purchase_date as string | null,
    releaseDate: row.release_date as string | null,
  }
}

function volumeToRow(v: Volume) {
  return {
    id: v.id,
    series_id: v.seriesId,
    volume_number: v.volumeNumber,
    status: v.status,
    purchase_price: v.purchasePrice,
    purchase_date: v.purchaseDate,
    release_date: v.releaseDate,
  }
}

export function useSupabaseStore(userId: string | null) {
  const [series, setSeries] = useState<Series[]>([])
  const [volumes, setVolumes] = useState<Volume[]>([])
  const [dbError, setDbError] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    if (!userId) return
    const [{ data: s }, { data: v }] = await Promise.all([
      supabase.from('series').select('*').eq('user_id', userId),
      supabase.from('volumes').select('*'),
    ])
    if (s) setSeries(s.map(rowToSeries))
    if (v) setVolumes(v.map(rowToVolume))
  }, [userId])

  useEffect(() => { fetchAll() }, [fetchAll])

  const addSeries = useCallback(async (s: Series) => {
    if (!userId) return
    const { error } = await supabase.from('series').insert(seriesToRow(s, userId))
    if (error) { setDbError('シリーズの追加に失敗しました'); return }
    await fetchAll()
  }, [userId, fetchAll])

  const deleteSeries = useCallback(async (id: string) => {
    const { error } = await supabase.from('series').delete().eq('id', id)
    if (error) { setDbError('シリーズの削除に失敗しました'); return }
    await fetchAll()
  }, [fetchAll])

  const updateSeries = useCallback(async (s: Series) => {
    if (!userId) return
    const { error } = await supabase.from('series').upsert(seriesToRow(s, userId))
    if (error) { setDbError('シリーズの更新に失敗しました'); return }
    await fetchAll()
  }, [userId, fetchAll])

  const upsertVolume = useCallback(async (v: Volume) => {
    const { error } = await supabase.from('volumes').upsert(volumeToRow(v))
    if (error) { setDbError('巻データの保存に失敗しました'); return }
    await fetchAll()
  }, [fetchAll])

  const deleteVolume = useCallback(async (id: string) => {
    const { error } = await supabase.from('volumes').delete().eq('id', id)
    if (error) { setDbError('巻データの削除に失敗しました'); return }
    await fetchAll()
  }, [fetchAll])

  const addVolumes = useCallback(async (vs: Volume[]) => {
    const { error } = await supabase.from('volumes').upsert(vs.map(volumeToRow))
    if (error) { setDbError('巻データの一括追加に失敗しました'); return }
    await fetchAll()
  }, [fetchAll])

  const volumesOf = useCallback((seriesId: string) =>
    volumes.filter(v => v.seriesId === seriesId).sort((a, b) => a.volumeNumber - b.volumeNumber),
    [volumes])

  const monthlySpend = useCallback((): Record<string, number> => {
    const map: Record<string, number> = {}
    volumes.forEach(v => {
      if (v.purchaseDate && v.purchasePrice) {
        const key = v.purchaseDate.slice(0, 7)
        map[key] = (map[key] ?? 0) + v.purchasePrice
      }
    })
    return map
  }, [volumes])

  const dailySpend = useCallback((): Record<string, number> => {
    const map: Record<string, number> = {}
    volumes.forEach(v => {
      if (v.purchaseDate && v.purchasePrice) {
        map[v.purchaseDate] = (map[v.purchaseDate] ?? 0) + v.purchasePrice
      }
    })
    return map
  }, [volumes])

  const weeklySpend = useCallback((): Record<string, number> => {
    const map: Record<string, number> = {}
    volumes.forEach(v => {
      if (v.purchaseDate && v.purchasePrice) {
        const d = new Date(v.purchaseDate)
        const sunday = new Date(d)
        sunday.setDate(d.getDate() - d.getDay())
        const key = sunday.toISOString().slice(0, 10)
        map[key] = (map[key] ?? 0) + v.purchasePrice
      }
    })
    return map
  }, [volumes])

  return { series, volumes, dbError, addSeries, deleteSeries, updateSeries, upsertVolume, deleteVolume, addVolumes, volumesOf, monthlySpend, dailySpend, weeklySpend }
}
