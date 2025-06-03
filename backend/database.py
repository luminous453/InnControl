from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv
import logging

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Пытаемся загрузить переменные окружения из .env файла
try:
    load_dotenv()
    logger.info("Файл .env успешно загружен")
except Exception as e:
    logger.warning(f"Ошибка при загрузке файла .env: {str(e)}. Используем значения по умолчанию.")

# Получаем данные для подключения из переменных окружения или используем значения по умолчанию
POSTGRES_USER = os.getenv("POSTGRES_USER", "postgres")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "postgres")
POSTGRES_SERVER = os.getenv("POSTGRES_SERVER", "localhost")
POSTGRES_PORT = os.getenv("POSTGRES_PORT", "5432")
POSTGRES_DB = os.getenv("POSTGRES_DB", "inncontrol")

# Вывод информации о подключении (без пароля)
logger.info(f"Подключение к базе данных: {POSTGRES_USER}@{POSTGRES_SERVER}:{POSTGRES_PORT}/{POSTGRES_DB}")

# Строка подключения к базе данных
SQLALCHEMY_DATABASE_URL = f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_SERVER}:{POSTGRES_PORT}/{POSTGRES_DB}"

# Создаем экземпляр SQLAlchemy engine
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# Создаем фабрику сессий
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Создаем базовый класс для моделей
Base = declarative_base() 