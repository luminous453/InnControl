import uvicorn
from backend import init_db
import logging

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

if __name__ == "__main__":
    try:
        # Инициализируем базу данных перед запуском сервера
        logger.info("Инициализация базы данных...")
        init_db.init_db()
        logger.info("База данных инициализирована")
        
        # Запускаем сервер
        logger.info("Запуск основного сервера на порту 8000...")
        uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
    except Exception as e:
        logger.error(f"Ошибка при запуске сервера: {str(e)}")
        raise 