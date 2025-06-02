import sqlite3
import os

# Путь к файлу базы данных
DB_FILE = "hotel.db"

def migrate_cleaning_logs():
    """Мигрирует таблицу cleaning_logs, удаляя поля start_time и end_time"""
    print("Миграция таблицы cleaning_logs...")
    
    # Проверяем, существует ли файл базы данных
    if not os.path.exists(DB_FILE):
        print(f"Ошибка: файл базы данных {DB_FILE} не найден.")
        return
    
    try:
        # Подключаемся к базе данных
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        
        # Проверяем наличие столбцов start_time и end_time
        cursor.execute("PRAGMA table_info(cleaning_logs)")
        columns = [col[1] for col in cursor.fetchall()]
        
        if 'start_time' in columns or 'end_time' in columns:
            # Начинаем транзакцию
            conn.execute("BEGIN TRANSACTION")
            
            # 1. Создаем временную таблицу без полей start_time и end_time
            cursor.execute("""
            CREATE TABLE cleaning_logs_temp (
                log_id INTEGER PRIMARY KEY AUTOINCREMENT,
                room_id INTEGER NOT NULL,
                employee_id INTEGER NOT NULL,
                cleaning_date DATE NOT NULL,
                status VARCHAR(50) NOT NULL DEFAULT 'Не начато',
                FOREIGN KEY (room_id) REFERENCES rooms (room_id),
                FOREIGN KEY (employee_id) REFERENCES employees (employee_id)
            )
            """)
            
            # 2. Копируем данные из старой таблицы во временную
            cursor.execute("""
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
            FROM cleaning_logs
            """)
            
            # 3. Удаляем старую таблицу
            cursor.execute("DROP TABLE cleaning_logs")
            
            # 4. Переименовываем временную таблицу
            cursor.execute("ALTER TABLE cleaning_logs_temp RENAME TO cleaning_logs")
            
            # Применяем изменения
            conn.commit()
            print("Таблица cleaning_logs успешно мигрирована.")
        else:
            print("Таблица cleaning_logs уже мигрирована.")
        
        # Получаем количество записей по статусам
        cursor.execute("SELECT status, COUNT(*) FROM cleaning_logs GROUP BY status")
        status_counts = cursor.fetchall()
        
        print("\nСтатистика статусов уборки:")
        for status, count in status_counts:
            print(f"  {status}: {count} записей")
            
    except sqlite3.Error as e:
        print(f"Ошибка SQLite: {e}")
        # Откатываем изменения в случае ошибки
        if conn:
            conn.rollback()
    finally:
        # Закрываем соединение
        if conn:
            conn.close()

# Выполняем миграцию при импорте этого модуля
migrate_cleaning_logs()

from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Float, Date, DateTime, Enum, Time
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from database import Base
from datetime import date

# Перечисление для статуса номера
class RoomStatus(str, enum.Enum):
    AVAILABLE = "Свободен"
    OCCUPIED = "Занят"
    CLEANING = "Уборка"
    MAINTENANCE = "Техобслуживание"

# Перечисление для дней недели
class Weekday(str, enum.Enum):
    MONDAY = "Понедельник"
    TUESDAY = "Вторник"
    WEDNESDAY = "Среда"
    THURSDAY = "Четверг"
    FRIDAY = "Пятница"
    SATURDAY = "Суббота"
    SUNDAY = "Воскресенье"

# Перечисление для статуса уборки
class CleaningStatus(str, enum.Enum):
    NOT_STARTED = "Не начато"
    COMPLETED = "Завершена"

# Модель гостиницы
class Hotel(Base):
    __tablename__ = "hotels"

    hotel_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True)
    total_rooms = Column(Integer)
    
    # Отношения
    rooms = relationship("Room", back_populates="hotel")
    employees = relationship("Employee", back_populates="hotel")

# Модель типа номера
class RoomType(Base):
    __tablename__ = "room_types"

    type_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), index=True)
    capacity = Column(Integer)
    price_per_night = Column(Float)
    
    # Отношения
    rooms = relationship("Room", back_populates="room_type")

# Модель номера
class Room(Base):
    __tablename__ = "rooms"

    room_id = Column(Integer, primary_key=True, index=True)
    hotel_id = Column(Integer, ForeignKey("hotels.hotel_id"))
    type_id = Column(Integer, ForeignKey("room_types.type_id"))
    floor = Column(Integer)
    room_number = Column(String(10), index=True)
    status = Column(String(20), default="Свободен")
    
    # Отношения
    hotel = relationship("Hotel", back_populates="rooms")
    room_type = relationship("RoomType", back_populates="rooms")
    bookings = relationship("Booking", back_populates="room")
    cleaning_logs = relationship("CleaningLog", back_populates="room")

# Модель клиента
class Client(Base):
    __tablename__ = "clients"

    client_id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(50), index=True)
    last_name = Column(String(50), index=True)
    passport_number = Column(String(20))
    city = Column(String(100))
    
    # Отношения
    bookings = relationship("Booking", back_populates="client")

# Модель бронирования
class Booking(Base):
    __tablename__ = "bookings"

    booking_id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("rooms.room_id"))
    client_id = Column(Integer, ForeignKey("clients.client_id"))
    check_in_date = Column(Date)
    check_out_date = Column(Date)
    status = Column(String(20), default="Подтверждено")
    
    # Отношения
    room = relationship("Room", back_populates="bookings")
    client = relationship("Client", back_populates="bookings")

# Модель сотрудника
class Employee(Base):
    __tablename__ = "employees"

    employee_id = Column(Integer, primary_key=True, index=True)
    hotel_id = Column(Integer, ForeignKey("hotels.hotel_id"))
    first_name = Column(String(50), index=True)
    last_name = Column(String(50), index=True)
    status = Column(String(20), default="Активен")
    
    # Отношения
    hotel = relationship("Hotel", back_populates="employees")
    cleaning_schedules = relationship("CleaningSchedule", back_populates="employee")
    cleaning_logs = relationship("CleaningLog", back_populates="employee")

# Модель расписания уборок
class CleaningSchedule(Base):
    __tablename__ = "cleaning_schedules"

    schedule_id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.employee_id"))
    floor = Column(Integer)
    day_of_week = Column(String(20))
    
    # Отношения
    employee = relationship("Employee", back_populates="cleaning_schedules")

# Модель журнала уборок
class CleaningLog(Base):
    __tablename__ = "cleaning_logs"

    log_id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("rooms.room_id"))
    employee_id = Column(Integer, ForeignKey("employees.employee_id"))
    cleaning_date = Column(Date, default=date.today)
    status = Column(String(50), default="Не начато")
    
    # Отношения
    room = relationship("Room", back_populates="cleaning_logs")
    employee = relationship("Employee", back_populates="cleaning_logs")

# Модель пользователя (для авторизации)
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False) 