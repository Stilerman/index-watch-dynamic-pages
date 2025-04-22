
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
  url: string;
  results: Array<{
    date: string;
    google: boolean;
    yandex: boolean;
  }>;
}

export interface ApiSettings {
  key: string;
}
