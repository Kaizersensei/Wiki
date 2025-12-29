
export interface BookPage {
  title: string;
  content: string;
  pageNumber: number;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  url: string;
  pages: BookPage[];
  coverImage?: string;
}

export enum AppState {
  IDLE = 'IDLE',
  FETCHING = 'FETCHING',
  PROCESSING = 'PROCESSING',
  READING = 'READING',
  ERROR = 'ERROR'
}
