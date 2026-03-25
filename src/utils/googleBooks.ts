export interface BookResult {
  title: string;
  author: string;
  coverUrl: string;
  volumeNumber: number | null;
  publishedDate: string | null;
  price: number | null;
}

export async function searchManga(query: string): Promise<BookResult[]> {
  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&langRestrict=ja&maxResults=10&printType=books`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  if (!data.items) return [];

  return data.items.map((item: any) => {
    const info = item.volumeInfo;
    const cover = info.imageLinks?.thumbnail?.replace('http:', 'https:') ?? '';
    const volMatch = info.title?.match(/(\d+)[巻冊]?\s*$/);
    // publishedDate は "2023-04-04" or "2023-04" or "2023" の形式で返る
    const raw = info.publishedDate ?? null;
    const publishedDate = raw ? (raw.length === 4 ? `${raw}-01-01` : raw.length === 7 ? `${raw}-01` : raw) : null;
    const price: number | null = item.saleInfo?.listPrice?.amount ?? null;
    return {
      title: info.title ?? '',
      author: (info.authors ?? []).join(', '),
      coverUrl: cover,
      volumeNumber: volMatch ? parseInt(volMatch[1]) : null,
      publishedDate,
      price,
    };
  });
}
