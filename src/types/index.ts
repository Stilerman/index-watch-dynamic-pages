
export interface IndexationResult {
  url: string;
  google: boolean;
  yandex: boolean;
  date: string;
  yandex_indexdate?: string; // Optional field for Yandex first indexation date
}

export interface UrlGroup {
  id: string;
  name: string;
  urls: string[];
}

export interface IndexationHistory {
  date: string;
  google: number;
  yandex: number;
}

export interface ApiSettings {
  key: string;
}
