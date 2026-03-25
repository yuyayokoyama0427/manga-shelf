export type ReadStatus = 'reading' | 'owned' | 'want' | 'backlog';

export type BookType = 'manga' | 'book';

export interface Series {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  genre: string;
  totalVolumes: number | null; // null = 連載中
  isCompleted: boolean;
  addedAt: string;
  bookType: BookType;
}

export interface Volume {
  id: string;
  seriesId: string;
  volumeNumber: number;
  status: ReadStatus;
  purchasePrice: number | null;
  purchaseDate: string | null; // YYYY-MM-DD
  releaseDate: string | null;  // YYYY-MM-DD
}

export interface Purchase {
  date: string;   // YYYY-MM
  amount: number;
}
