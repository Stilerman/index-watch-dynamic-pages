
from flask import Flask, render_template, request, jsonify, redirect, url_for, flash
import sqlite3
import json
import os
import requests
from datetime import datetime
import uuid
from urllib.parse import urlparse
import re

app = Flask(__name__)
app.config['SECRET_KEY'] = os.urandom(24)
DATABASE = 'indexation_monitor.db'

# Функция для подключения к базе данных
def get_db_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

# Инициализация базы данных
def init_db():
    with app.app_context():
        conn = get_db_connection()
        with open('schema.sql') as f:
            conn.executescript(f.read())
        conn.commit()
        conn.close()

# Проверка индексации URL
def check_indexation(url):
    try:
        api_key = get_api_key()
        if not api_key:
            return {"error": "API ключ не указан"}
        
        # Имитация проверки индексации (в реальном приложении здесь был бы запрос к API)
        # Для демонстрации просто возвращаем случайные результаты
        import random
        return {
            "google": random.choice([True, False]),
            "yandex": random.choice([True, False])
        }
    except Exception as e:
        print(f"Ошибка при проверке индексации: {e}")
        return {"error": str(e)}

# Пакетная проверка URLs
def batch_check_indexation(urls):
    results = []
    current_date = datetime.now().isoformat()
    
    for url in urls:
        try:
            result = check_indexation(url)
            if "error" not in result:
                results.append({
                    "url": url,
                    "google": result["google"],
                    "yandex": result["yandex"],
                    "date": current_date
                })
            else:
                results.append({
                    "url": url,
                    "google": False,
                    "yandex": False,
                    "date": current_date,
                    "error": result["error"]
                })
        except Exception as e:
            results.append({
                "url": url,
                "google": False,
                "yandex": False,
                "date": current_date,
                "error": str(e)
            })
    
    return results

# Получение API ключа из базы данных
def get_api_key():
    conn = get_db_connection()
    row = conn.execute('SELECT key FROM api_settings LIMIT 1').fetchone()
    conn.close()
    if row:
        return row['key']
    return None

# Главная страница (дашборд)
@app.route('/')
def index():
    conn = get_db_connection()
    results = conn.execute('SELECT * FROM indexation_results').fetchall()
    groups = conn.execute('SELECT * FROM url_groups').fetchall()
    
    # Получение URLs для каждой группы
    group_data = []
    for group in groups:
        urls = conn.execute('SELECT url FROM group_urls WHERE group_id = ?', 
                          (group['id'],)).fetchall()
        group_data.append({
            'id': group['id'],
            'name': group['name'],
            'urls': [url['url'] for url in urls]
        })
    
    conn.close()
    
    # Преобразование результатов в список словарей
    results_data = []
    for r in results:
        results_data.append({
            'url': r['url'],
            'google': bool(r['google']),
            'yandex': bool(r['yandex']),
            'date': r['date']
        })
    
    # Расчет статистики
    total_urls = len(results_data)
    indexed_in_google = sum(1 for r in results_data if r['google'])
    indexed_in_yandex = sum(1 for r in results_data if r['yandex'])
    not_indexed_total = sum(1 for r in results_data if not r['google'] or not r['yandex'])
    
    return render_template('dashboard.html', 
                          results=results_data, 
                          groups=group_data,
                          total_urls=total_urls,
                          indexed_in_google=indexed_in_google,
                          indexed_in_yandex=indexed_in_yandex,
                          not_indexed_total=not_indexed_total)

# История индексации
@app.route('/history')
def history():
    conn = get_db_connection()
    # Используем более простой запрос вместо GROUP_CONCAT для совместимости
    urls = conn.execute('SELECT DISTINCT url FROM indexation_results').fetchall()
    
    history_list = []
    for url_row in urls:
        url = url_row['url']
        results = conn.execute('SELECT date, google, yandex FROM indexation_results WHERE url = ? ORDER BY date DESC', 
                              (url,)).fetchall()
        
        history_list.append({
            'url': url,
            'results': [{
                'date': r['date'],
                'google': bool(r['google']),
                'yandex': bool(r['yandex'])
            } for r in results]
        })
    
    conn.close()
    
    return render_template('history.html', history=history_list)

# Страница групп URL
@app.route('/groups')
def groups():
    conn = get_db_connection()
    groups = conn.execute('SELECT * FROM url_groups').fetchall()
    
    group_data = []
    for group in groups:
        urls = conn.execute('SELECT url FROM group_urls WHERE group_id = ?', 
                          (group['id'],)).fetchall()
        group_data.append({
            'id': group['id'],
            'name': group['name'],
            'urls': [url['url'] for url in urls]
        })
    
    conn.close()
    return render_template('groups.html', groups=group_data)

# Настройки
@app.route('/settings', methods=['GET', 'POST'])
def settings():
    if request.method == 'POST':
        api_key = request.form['api_key']
        check_interval = request.form['check_interval']
        notifications_enabled = 'notifications_enabled' in request.form
        
        conn = get_db_connection()
        # Проверяем, существуют ли уже настройки
        existing = conn.execute('SELECT COUNT(*) as count FROM api_settings').fetchone()
        
        if existing and existing['count'] > 0:
            conn.execute('''
                UPDATE api_settings 
                SET key = ?, check_interval = ?, notifications_enabled = ?
            ''', (api_key, check_interval, notifications_enabled))
        else:
            conn.execute('''
                INSERT INTO api_settings (key, check_interval, notifications_enabled)
                VALUES (?, ?, ?)
            ''', (api_key, check_interval, notifications_enabled))
            
        conn.commit()
        conn.close()
        
        flash('Настройки успешно сохранены')
        return redirect(url_for('settings'))
    
    conn = get_db_connection()
    settings = conn.execute('SELECT * FROM api_settings LIMIT 1').fetchone()
    conn.close()
    
    if not settings:
        settings = {
            'key': '',
            'check_interval': 24,
            'notifications_enabled': True
        }
        
    return render_template('settings.html', settings=settings)

# API для добавления URL
@app.route('/api/add_urls', methods=['POST'])
def add_urls():
    data = request.get_json()
    urls = data.get('urls', [])
    group_id_or_name = data.get('groupIdOrName')
    
    conn = get_db_connection()
    group_id = None
    
    # Обработка группы
    if group_id_or_name:
        # Проверяем, существует ли группа
        existing_group = conn.execute('SELECT id FROM url_groups WHERE id = ?', 
                                    (group_id_or_name,)).fetchone()
        
        if existing_group:
            group_id = existing_group['id']
        else:
            # Создаем новую группу
            new_id = str(uuid.uuid4())
            conn.execute('INSERT INTO url_groups (id, name) VALUES (?, ?)', 
                        (new_id, group_id_or_name))
            group_id = new_id
    
    # Проверка индексации URLs
    results = batch_check_indexation(urls)
    
    # Сохранение результатов
    for result in results:
        conn.execute('''
            INSERT OR REPLACE INTO indexation_results (url, google, yandex, date)
            VALUES (?, ?, ?, ?)
        ''', (result['url'], result['google'], result['yandex'], result['date']))
        
        # Если указана группа, добавляем URL в эту группу
        if group_id:
            conn.execute('''
                INSERT OR IGNORE INTO group_urls (group_id, url)
                VALUES (?, ?)
            ''', (group_id, result['url']))
    
    conn.commit()
    conn.close()
    
    return jsonify({
        'success': True,
        'message': f'Добавлено {len(results)} URL для мониторинга',
        'results': results
    })

# API для удаления URL
@app.route('/api/delete_url', methods=['POST'])
def delete_url():
    data = request.get_json()
    url = data.get('url')
    
    if not url:
        return jsonify({'success': False, 'message': 'URL не указан'})
    
    conn = get_db_connection()
    # Удаление из результатов индексации
    conn.execute('DELETE FROM indexation_results WHERE url = ?', (url,))
    
    # Удаление из групп
    conn.execute('DELETE FROM group_urls WHERE url = ?', (url,))
    
    conn.commit()
    conn.close()
    
    return jsonify({
        'success': True,
        'message': 'URL успешно удален из мониторинга'
    })

# API для проверки конкретного URL
@app.route('/api/check_url', methods=['POST'])
def check_url_api():
    data = request.get_json()
    url = data.get('url')
    
    if not url:
        return jsonify({'success': False, 'message': 'URL не указан'})
    
    results = batch_check_indexation([url])
    
    if not results:
        return jsonify({'success': False, 'message': 'Ошибка при проверке URL'})
    
    result = results[0]
    
    conn = get_db_connection()
    conn.execute('''
        INSERT OR REPLACE INTO indexation_results (url, google, yandex, date)
        VALUES (?, ?, ?, ?)
    ''', (result['url'], result['google'], result['yandex'], result['date']))
    conn.commit()
    conn.close()
    
    return jsonify({
        'success': True,
        'message': 'Индексация URL успешно проверена',
        'result': result
    })

# API для обновления всех URLs
@app.route('/api/refresh_all', methods=['POST'])
def refresh_all():
    conn = get_db_connection()
    urls = [row['url'] for row in conn.execute('SELECT url FROM indexation_results').fetchall()]
    
    if not urls:
        return jsonify({'success': False, 'message': 'Нет URL для проверки'})
    
    results = batch_check_indexation(urls)
    
    for result in results:
        conn.execute('''
            INSERT OR REPLACE INTO indexation_results (url, google, yandex, date)
            VALUES (?, ?, ?, ?)
        ''', (result['url'], result['google'], result['yandex'], result['date']))
    
    conn.commit()
    conn.close()
    
    return jsonify({
        'success': True,
        'message': f'Проверено {len(results)} URL',
        'results': results
    })

# Импортируем и регистрируем API роуты
from api import register_api
register_api(app)

# Запуск приложения
if __name__ == '__main__':
    if not os.path.exists(DATABASE):
        init_db()
    app.run(debug=True)
