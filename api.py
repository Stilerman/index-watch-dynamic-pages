
# Дополнительные API эндпоинты для управления группами URL и другими функциями

from flask import Blueprint, jsonify, request
import sqlite3
import uuid
from app import get_db_connection

api_bp = Blueprint('api', __name__)

# API для добавления группы
@api_bp.route('/add_group', methods=['POST'])
def add_group():
    data = request.get_json()
    name = data.get('name')
    
    if not name:
        return jsonify({
            'success': False,
            'message': 'Название группы не указано'
        })
    
    conn = get_db_connection()
    group_id = str(uuid.uuid4())
    
    try:
        conn.execute('INSERT INTO url_groups (id, name) VALUES (?, ?)', 
                    (group_id, name))
        conn.commit()
        
        return jsonify({
            'success': True,
            'message': 'Группа успешно создана',
            'id': group_id,
            'name': name
        })
    except sqlite3.Error as e:
        return jsonify({
            'success': False,
            'message': f'Ошибка при создании группы: {str(e)}'
        })
    finally:
        conn.close()

# API для обновления группы
@api_bp.route('/update_group', methods=['POST'])
def update_group():
    data = request.get_json()
    group_id = data.get('id')
    name = data.get('name')
    
    if not group_id or not name:
        return jsonify({
            'success': False,
            'message': 'ID группы и название должны быть указаны'
        })
    
    conn = get_db_connection()
    
    try:
        conn.execute('UPDATE url_groups SET name = ? WHERE id = ?', 
                    (name, group_id))
        conn.commit()
        
        if conn.total_changes == 0:
            return jsonify({
                'success': False,
                'message': 'Группа не найдена'
            })
        
        return jsonify({
            'success': True,
            'message': 'Группа успешно обновлена'
        })
    except sqlite3.Error as e:
        return jsonify({
            'success': False,
            'message': f'Ошибка при обновлении группы: {str(e)}'
        })
    finally:
        conn.close()

# API для удаления группы
@api_bp.route('/delete_group', methods=['POST'])
def delete_group():
    data = request.get_json()
    group_id = data.get('id')
    
    if not group_id:
        return jsonify({
            'success': False,
            'message': 'ID группы должен быть указан'
        })
    
    conn = get_db_connection()
    
    try:
        # Удаляем связи URL с группой
        conn.execute('DELETE FROM group_urls WHERE group_id = ?', (group_id,))
        
        # Удаляем саму группу
        conn.execute('DELETE FROM url_groups WHERE id = ?', (group_id,))
        conn.commit()
        
        return jsonify({
            'success': True,
            'message': 'Группа успешно удалена'
        })
    except sqlite3.Error as e:
        return jsonify({
            'success': False,
            'message': f'Ошибка при удалении группы: {str(e)}'
        })
    finally:
        conn.close()

# Регистрация API Blueprint
def register_api(app):
    app.register_blueprint(api_bp, url_prefix='/api')
