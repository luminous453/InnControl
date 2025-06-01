from database import SessionLocal, engine
from sqlalchemy import text

# SQL-запрос для добавления колонки, если она не существует
sql = text("""
ALTER TABLE cleaning_logs 
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Ожидает';
""")

try:
    # Используем engine напрямую для выполнения SQL
    with engine.begin() as conn:
        conn.execute(sql)
    print("Операция выполнена успешно. Колонка 'status' добавлена или уже существует.")
except Exception as e:
    print(f"Ошибка при выполнении операции: {e}") 