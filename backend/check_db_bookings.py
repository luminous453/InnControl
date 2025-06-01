import sys
from sqlalchemy import text
from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models, schemas
import traceback

def check_db_tables():
    """Проверяет структуру таблиц в базе данных"""
    try:
        # Проверяем, что соединение работает
        with engine.connect() as conn:
            # Выполняем запрос на проверку таблиц
            result = conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema='public'"))
            tables = [row[0] for row in result]
            
            print(f"Найдены таблицы в базе данных: {', '.join(tables)}")
            
            # Проверяем таблицу бронирований
            if 'bookings' in tables:
                print("✅ Таблица bookings существует")
                
                # Проверяем структуру таблицы
                result = conn.execute(text("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='bookings'"))
                columns = [(row[0], row[1]) for row in result]
                
                print("\nСтруктура таблицы bookings:")
                for name, type_ in columns:
                    print(f"  {name}: {type_}")
            else:
                print("❌ Таблица bookings не найдена!")
                
            return True
    except Exception as e:
        print(f"❌ Ошибка при проверке таблиц: {str(e)}")
        traceback.print_exc()
        return False

def extract_bookings():
    """Извлекает данные о бронированиях напрямую через SQL"""
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT * FROM bookings LIMIT 10"))
            bookings = [dict(row._mapping) for row in result]
            
            print(f"\nПолучено {len(bookings)} бронирований через прямой SQL:")
            for booking in bookings:
                print(f"  ID: {booking.get('booking_id')}, Room: {booking.get('room_id')}, " +
                      f"Client: {booking.get('client_id')}, Status: {booking.get('status')}")
            
            return bookings
    except Exception as e:
        print(f"❌ Ошибка при извлечении бронирований через SQL: {str(e)}")
        traceback.print_exc()
        return []

def check_orm_bookings():
    """Проверяет получение бронирований через ORM"""
    db = SessionLocal()
    try:
        # Пробуем получить бронирования через ORM
        bookings = db.query(models.Booking).all()
        
        print(f"\nПолучено {len(bookings)} бронирований через ORM:")
        for booking in bookings:
            print(f"  ID: {booking.booking_id}, Room: {booking.room_id}, " +
                  f"Client: {booking.client_id}, Status: {booking.status}")
        
        return bookings
    except Exception as e:
        print(f"❌ Ошибка при получении бронирований через ORM: {str(e)}")
        traceback.print_exc()
        return []
    finally:
        db.close()

def fix_missing_bookings():
    """Добавляет тестовые бронирования, если их нет в базе"""
    db = SessionLocal()
    try:
        # Проверяем, есть ли бронирования
        count = db.query(models.Booking).count()
        
        if count == 0:
            print("\n⚠️ Бронирования отсутствуют, добавляю тестовые записи...")
            
            # Проверяем, есть ли номера и клиенты
            rooms = db.query(models.Room).limit(3).all()
            clients = db.query(models.Client).limit(3).all()
            
            if not rooms:
                print("❌ Не могу создать бронирования - отсутствуют номера в базе")
                return False
                
            if not clients:
                print("❌ Не могу создать бронирования - отсутствуют клиенты в базе")
                return False
            
            # Создаем тестовые бронирования
            from datetime import date, timedelta
            today = date.today()
            
            for i in range(min(len(rooms), len(clients))):
                booking = models.Booking(
                    room_id=rooms[i].room_id,
                    client_id=clients[i].client_id,
                    check_in_date=today + timedelta(days=i*7),
                    check_out_date=today + timedelta(days=i*7+3),
                    status="Подтверждено"
                )
                db.add(booking)
            
            db.commit()
            print(f"✅ Добавлено {min(len(rooms), len(clients))} тестовых бронирований")
            return True
        else:
            print(f"\n✅ В базе уже есть {count} бронирований")
            return True
    except Exception as e:
        print(f"❌ Ошибка при создании тестовых бронирований: {str(e)}")
        traceback.print_exc()
        db.rollback()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    print("Диагностика бронирований в БД")
    print("=" * 50)
    
    check_db_tables()
    extract_bookings()
    check_orm_bookings()
    fix_missing_bookings()
    
    print("\nПроверяем еще раз после исправлений:")
    check_orm_bookings()
    
    print("\nДиагностика завершена.") 