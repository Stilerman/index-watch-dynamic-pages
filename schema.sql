
-- Схема базы данных для мониторинга индексации
DROP TABLE IF EXISTS indexation_results;
DROP TABLE IF EXISTS url_groups;
DROP TABLE IF EXISTS group_urls;
DROP TABLE IF EXISTS api_settings;

-- Таблица с результатами индексации
CREATE TABLE indexation_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT NOT NULL UNIQUE,
    google BOOLEAN NOT NULL,
    yandex BOOLEAN NOT NULL,
    date TEXT NOT NULL
);

-- Таблица групп URL
CREATE TABLE url_groups (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Связь групп и URL
CREATE TABLE group_urls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id TEXT NOT NULL,
    url TEXT NOT NULL,
    FOREIGN KEY (group_id) REFERENCES url_groups(id),
    UNIQUE(group_id, url)
);

-- Настройки API
CREATE TABLE api_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT NOT NULL,
    check_interval INTEGER NOT NULL DEFAULT 24,
    notifications_enabled BOOLEAN NOT NULL DEFAULT 1
);
