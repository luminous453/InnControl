from sqlalchemy.orm import Session
from database import engine, SessionLocal, Base
import models, crud, schemas
import logging

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def init_db():
    # Создаем таблицы
    Base.metadata.create_all(bind=engine)
    logger.info("Таблицы созданы успешно")
    
    # Открываем сессию
    db = SessionLocal()
    try:
        # Проверяем, существует ли гостиница "Маяк"
        hotel = db.query(models.Hotel).filter(models.Hotel.name == "Маяк").first()
        if not hotel:
            logger.info("Создаем гостиницу 'Маяк'")
            hotel = models.Hotel(name="Маяк", total_rooms=100)
            db.add(hotel)
            db.commit()
            db.refresh(hotel)
            logger.info(f"Гостиница 'Маяк' создана с ID {hotel.hotel_id}")
        else:
            logger.info(f"Гостиница 'Маяк' уже существует с ID {hotel.hotel_id}")
        
        # Проверяем, существует ли администратор
        admin = db.query(models.User).filter(models.User.username == "admin").first()
        if not admin:
            logger.info("Создаем пользователя 'admin'")
            # Создаем администратора
            admin_schema = schemas.UserCreate(
                username="admin",
                email="admin@inncontrol.com",
                password="admin",
                is_active=True,
                is_admin=True,
                hotel_id=hotel.hotel_id
            )
            admin = crud.create_user(db=db, user=admin_schema)
            logger.info(f"Пользователь 'admin' создан с ID {admin.id}")
            logger.info(f"Хэшированный пароль: {admin.hashed_password}")
        else:
            logger.info(f"Пользователь 'admin' уже существует с ID {admin.id}")
    
    except Exception as e:
        logger.error(f"Ошибка при инициализации базы данных: {e}")
        db.rollback()
        raise
    finally:
        db.close()
        logger.info("Сессия закрыта")

if __name__ == "__main__":
    logger.info("Начало инициализации базы данных...")
    init_db()
    logger.info("Инициализация базы данных завершена успешно!") 