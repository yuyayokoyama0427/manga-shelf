export interface LatestRelease {
  seriesId: string;
  seriesTitle: string;
  coverUrl: string;
  volumeNumber: number;
  releaseDate: string; // YYYY-MM-DD
  price: number | null;
}

export async function fetchLatestRelease(
  seriesId: string,
  seriesTitle: string,
  coverUrl: string,
  ownedVolNums: number[],
): Promise<LatestRelease | null> {
  try {
    const url = `https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(seriesTitle)}&langRestrict=ja&maxResults=20&orderBy=newest&printType=books`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.items) return null;

    const today = new Date().toISOString().slice(0, 10);

    // 巻数・発売日・価格を抽出
    const candidates = data.items.flatMap((item: any) => {
      const info = item.volumeInfo;
      const volMatch = info.title?.match(/(\d+)[巻冊]?\s*$/);
      if (!volMatch) return [];
      const volumeNumber = parseInt(volMatch[1]);
      const raw = info.publishedDate ?? null;
      if (!raw) return [];
      const releaseDate = raw.length === 4 ? `${raw}-01-01` : raw.length === 7 ? `${raw}-01` : raw;
      // 未来日付のみ
      if (releaseDate <= today) return [];
      // すでに所持している巻はスキップ
      if (ownedVolNums.includes(volumeNumber)) return [];
      const price: number | null = item.saleInfo?.listPrice?.amount ?? null;
      return [{ volumeNumber, releaseDate, price }];
    });

    if (candidates.length === 0) return null;

    // 最も巻数が大きいものを最新刊とする
    candidates.sort((a: any, b: any) => b.volumeNumber - a.volumeNumber);
    const latest = candidates[0];

    return {
      seriesId,
      seriesTitle,
      coverUrl,
      volumeNumber: latest.volumeNumber,
      releaseDate: latest.releaseDate,
      price: latest.price,
    };
  } catch {
    return null;
  }
}
