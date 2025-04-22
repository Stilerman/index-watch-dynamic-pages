
export interface IndexationResult {
  url: string;
  google: boolean;
  yandex: boolean;
  date: string;
  yandex_indexdate?: string; // Optional field for Yandex first indexation date
}
