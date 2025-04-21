
// Типы данных для приложения

// Тип для результата проверки индексации
export interface IndexationResult {
  url: string;
  google: boolean;
  yandex: boolean;
  date: string;
}

// Тип для группы URL (папки)
export interface UrlGroup {
  id: string;
  name: string;
  urls: string[];
}

// Тип для истории индексации
export interface IndexationHistory {
  url: string;
  results: {
    date: string;
    google: boolean;
    yandex: boolean;
  }[];
}

// Настройки API
export interface ApiSettings {
  key: string;
  checkInterval: number; // в часах
  notificationsEnabled: boolean;
}
