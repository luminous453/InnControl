import os
import subprocess
import sys

def main():
    print("Обновление структуры таблицы cleaning_logs и статусов уборки...")
    
    # Путь к файлу базы данных
    db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "hotel.db")
    print(f"Используемый файл базы данных: {db_path}")
    
    # Проверяем, существует ли файл базы данных
    if not os.path.exists(db_path):
        print(f"Ошибка: файл базы данных {db_path} не найден.")
        return
    
    # SQL-команды для выполнения
    sql_commands = [
        # 1. Создаем временную таблицу без полей start_time и end_time
        """
        CREATE TABLE cleaning_logs_temp (
            log_id INTEGER PRIMARY KEY AUTOINCREMENT,
            room_id INTEGER NOT NULL,
            employee_id INTEGER NOT NULL,
            cleaning_date DATE NOT NULL,
            status VARCHAR(50) NOT NULL DEFAULT 'Не начато',
            FOREIGN KEY (room_id) REFERENCES rooms (room_id),
            FOREIGN KEY (employee_id) REFERENCES employees (employee_id)
        );
        """,
        
        # 2. Копируем данные из старой таблицы во временную, обновляя статусы
        """
        INSERT INTO cleaning_logs_temp (log_id, room_id, employee_id, cleaning_date, status)
        SELECT 
            log_id, 
            room_id, 
            employee_id, 
            cleaning_date,
            CASE 
                WHEN status IN ('Ожидает', 'В процессе') THEN 'Не начато'
                WHEN status IN ('Завершена', 'Пропущена') THEN 'Завершена'
                ELSE 'Не начато'
            END
        FROM cleaning_logs;
        """,
        
        # 3. Удаляем старую таблицу
        "DROP TABLE cleaning_logs;",
        
        # 4. Переименовываем временную таблицу
        "ALTER TABLE cleaning_logs_temp RENAME TO cleaning_logs;",
        
        # 5. Получаем статистику по статусам
        "SELECT status, COUNT(*) FROM cleaning_logs GROUP BY status;"
    ]
    
    # Создаем временный файл с SQL-командами
    temp_sql_file = "temp_update_script.sql"
    with open(temp_sql_file, "w", encoding="utf-8") as f:
        f.write("\n".join(sql_commands))
    
    try:
        # Запускаем sqlite3 с нашим скриптом
        print("Выполнение SQL-команд...")
        result = subprocess.run(["sqlite3", db_path, ".read temp_update_script.sql"], 
                               capture_output=True, text=True, encoding="utf-8")
        
        # Выводим результат
        if result.stdout:
            print("\nСтатистика статусов уборки:")
            for line in result.stdout.splitlines():
                if line.strip():
                    status, count = line.split('|')
                    print(f"  {status}: {count} записей")
        
        if result.stderr:
            print(f"Ошибка SQLite: {result.stderr}")
        else:
            print("Структура таблицы cleaning_logs успешно обновлена.")
            
    except Exception as e:
        print(f"Ошибка при выполнении команд: {e}")
    finally:
        # Удаляем временный файл
        if os.path.exists(temp_sql_file):
            os.remove(temp_sql_file)

if __name__ == "__main__":
    main() 