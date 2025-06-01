import psycopg2
import os
from dotenv import load_dotenv

# Загрузка переменных окружения
load_dotenv()

# Параметры подключения к базе данных
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "inn_control")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASS = os.getenv("DB_PASSWORD", "postgres")

# SQL запрос для проверки существования колонки
check_column_sql = """
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'cleaning_logs' AND column_name = 'status';
"""

# SQL запрос для добавления колонки
add_column_sql = """
ALTER TABLE cleaning_logs 
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Ожидает';
"""

try:
    # Подключение к базе данных
    conn = psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        database=DB_NAME,
        user=DB_USER,
        password=DB_PASS
    )
    
    # Создание курсора
    cur = conn.cursor()
    
    # Проверка существования колонки
    cur.execute(check_column_sql)
    column_exists = cur.fetchone() is not None
    
    if column_exists:
        print("Колонка 'status' уже существует в таблице cleaning_logs")
    else:
        # Добавление колонки
        cur.execute(add_column_sql)
        conn.commit()
        print("Колонка 'status' типа VARCHAR(50) успешно добавлена в таблицу cleaning_logs")
    
    # Закрытие курсора и соединения
    cur.close()
    conn.close()
    
    print("Операция завершена")
    
except Exception as e:
    print(f"Произошла ошибка: {e}") 