
import { IndexationResult, UrlGroup, IndexationHistory, ApiSettings } from "@/types";
import { v4 as uuidv4 } from "uuid";

// Ключи для локального хранилища
const RESULTS_KEY = "indexation-results";
const GROUPS_KEY = "url-groups";
const HISTORY_KEY = "indexation-history";
const SETTINGS_KEY = "api-settings";

// Функции для работы с результатами проверки
export const getIndexationResults = (): IndexationResult[] => {
  const stored = localStorage.getItem(RESULTS_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const saveIndexationResults = (results: IndexationResult[]): void => {
  localStorage.setItem(RESULTS_KEY, JSON.stringify(results));
};

export const addIndexationResult = (result: IndexationResult): void => {
  const results = getIndexationResults();
  
  // Проверяем, существует ли уже результат для этого URL
  const existingIndex = results.findIndex(r => r.url === result.url);
  
  if (existingIndex >= 0) {
    // Обновляем существующий результат
    results[existingIndex] = result;
  } else {
    // Добавляем новый результат
    results.push(result);
  }
  
  saveIndexationResults(results);
  
  // Обновляем историю
  addToHistory(result);
};

export const removeIndexationResult = (url: string): void => {
  const results = getIndexationResults().filter(r => r.url !== url);
  saveIndexationResults(results);
};

// Функции для работы с группами URL
export const getUrlGroups = (): UrlGroup[] => {
  const stored = localStorage.getItem(GROUPS_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const saveUrlGroups = (groups: UrlGroup[]): void => {
  localStorage.setItem(GROUPS_KEY, JSON.stringify(groups));
};

export const addUrlGroup = (name: string): UrlGroup => {
  const groups = getUrlGroups();
  const newGroup = {
    id: uuidv4(),
    name,
    urls: []
  };
  
  groups.push(newGroup);
  saveUrlGroups(groups);
  
  return newGroup;
};

export const updateUrlGroup = (id: string, name: string): void => {
  const groups = getUrlGroups();
  const group = groups.find(g => g.id === id);
  
  if (group) {
    group.name = name;
    saveUrlGroups(groups);
  }
};

export const deleteUrlGroup = (id: string): void => {
  const groups = getUrlGroups().filter(g => g.id !== id);
  saveUrlGroups(groups);
};

export const addUrlToGroup = (groupId: string, url: string): void => {
  const groups = getUrlGroups();
  const group = groups.find(g => g.id === groupId);
  
  if (group && !group.urls.includes(url)) {
    group.urls.push(url);
    saveUrlGroups(groups);
  }
};

export const removeUrlFromGroup = (groupId: string, url: string): void => {
  const groups = getUrlGroups();
  const group = groups.find(g => g.id === groupId);
  
  if (group) {
    group.urls = group.urls.filter(u => u !== url);
    saveUrlGroups(groups);
  }
};

export const addUrlsToGroup = (groupId: string, urls: string[]): void => {
  const groups = getUrlGroups();
  const group = groups.find(g => g.id === groupId);
  
  if (group) {
    // Добавляем только уникальные URL
    urls.forEach(url => {
      if (!group.urls.includes(url)) {
        group.urls.push(url);
      }
    });
    
    saveUrlGroups(groups);
  }
};

// Функции для работы с историей индексации
export const getIndexationHistory = (): IndexationHistory[] => {
  const stored = localStorage.getItem(HISTORY_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const saveIndexationHistory = (history: IndexationHistory[]): void => {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
};

export const addToHistory = (result: IndexationResult): void => {
  const history = getIndexationHistory();
  let urlHistory = history.find(h => h.url === result.url);
  
  if (!urlHistory) {
    urlHistory = {
      url: result.url,
      results: []
    };
    history.push(urlHistory);
  }
  
  // Добавляем результат в историю
  urlHistory.results.push({
    date: result.date,
    google: result.google,
    yandex: result.yandex
  });
  
  // Ограничиваем историю до 30 записей для каждого URL
  if (urlHistory.results.length > 30) {
    urlHistory.results = urlHistory.results.slice(-30);
  }
  
  saveIndexationHistory(history);
};

// Функции для работы с настройками API
export const getApiSettings = (): ApiSettings => {
  const stored = localStorage.getItem(SETTINGS_KEY);
  return stored 
    ? JSON.parse(stored) 
    : {
        key: "",
        checkInterval: 24,
        notificationsEnabled: true
      };
};

export const saveApiSettings = (settings: ApiSettings): void => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};
