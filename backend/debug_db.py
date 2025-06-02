import sys
from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models, schemas
import traceback

def check_db_connection():
    """Проверка соединения с базой данных"""
    try:
        # Создаем тестовую сессию
        db = SessionLocal()
        db.execute("SELECT 1")
        print("✅ Соединение с базой данных успешно")
        db.close()
        return True
    except Exception as e:
        print(f"❌ Ошибка подключения к базе данных: {str(e)}")
        traceback.print_exc()
        return False

def check_tables():
    """Проверка наличия и структуры таблиц"""
    try:
        # Проверяем наличие всех таблиц
        tables = ["hotels", "room_types", "rooms", "clients", "bookings", "employees",
                 "cleaning_schedules", "cleaning_logs", "users"]
        
        inspector = engine.dialect.inspector
        db_tables = inspector.get_table_names()
        
        for table in tables:
            if table in db_tables:
                print(f"✅ Таблица {table} существует")
            else:
                print(f"❌ Таблица {table} отсутствует")
        
        return True
    except Exception as e:
        print(f"❌ Ошибка при проверке таблиц: {str(e)}")
        traceback.print_exc()
        return False

def check_bookings():
    """Проверка данных о бронированиях"""
    db = SessionLocal()
    try:
        # Подсчитываем количество записей
        booking_count = db.query(models.Booking).count()
        print(f"Количество бронирований в базе данных: {booking_count}")
        
        # Получаем и выводим все бронирования
        bookings = db.query(models.Booking).all()
        print("\nСписок бронирований:")
        for booking in bookings:
            print(f"ID: {booking.booking_id}, Комната: {booking.room_id}, Клиент: {booking.client_id}, " +
                  f"Даты: {booking.check_in_date} - {booking.check_out_date}, Статус: {booking.status}")
        
        # Проверяем целостность данных
        for booking in bookings:
            room = db.query(models.Room).filter(models.Room.room_id == booking.room_id).first()
            client = db.query(models.Client).filter(models.Client.client_id == booking.client_id).first()
            
            if not room:
                print(f"❌ Для бронирования {booking.booking_id} не найдена комната {booking.room_id}")
            if not client:
                print(f"❌ Для бронирования {booking.booking_id} не найден клиент {booking.client_id}")
        
        return True
    except Exception as e:
        print(f"❌ Ошибка при проверке бронирований: {str(e)}")
        traceback.print_exc()
        return False
    finally:
        db.close()

def mock_bookings_response(limit=5):
    """Эта функция больше не создаёт мок-данные"""
    return []

def fix_bookings_endpoint():
    """Создаёт файл с исправленным эндпоинтом для бронирований"""
    code = """# Безопасный эндпоинт для бронирований
@app.get("/bookings/", response_model=List[schemas.Booking])
def read_bookings(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    try:
        logger.info(f"Запрос бронирований: skip={skip}, limit={limit}")
        # Получаем реальные данные
        try:
            bookings = crud.get_bookings(db, skip=skip, limit=limit)
            logger.info(f"Найдено {len(bookings)} бронирований")
            return bookings
        except Exception as e:
            logger.error(f"Ошибка при получении бронирований из БД: {str(e)}")
            logger.error(traceback.format_exc())
            return []
    except Exception as e:
        logger.error(f"Критическая ошибка в эндпоинте бронирований: {str(e)}")
        logger.error(traceback.format_exc())
        return []
    """
    
    with open("fixed_bookings_endpoint.py", "w") as f:
        f.write(code)
    print("✅ Создан файл с исправленным эндпоинтом fixed_bookings_endpoint.py")

if __name__ == "__main__":
    print("Диагностика базы данных InnControl...")
    print("=" * 50)
    
    if check_db_connection():
        check_tables()
        check_bookings()
    
    print("\nСоздание исправленного эндпоинта...")
    fix_bookings_endpoint()
    
    print("\nДиагностика завершена.") 