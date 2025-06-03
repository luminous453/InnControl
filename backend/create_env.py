"""
Скрипт для создания файла .env с правильной кодировкой UTF-8
"""
import os

# Содержимое файла .env
env_content = """POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_SERVER=localhost
POSTGRES_PORT=5432
POSTGRES_DB=inncontrol
"""

# Записываем файл в кодировке UTF-8
with open(os.path.join(os.path.dirname(__file__), ".env"), "w", encoding="utf-8") as f:
    f.write(env_content)

print("Файл .env успешно создан с кодировкой UTF-8") 