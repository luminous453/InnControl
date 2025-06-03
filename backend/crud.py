from sqlalchemy.orm import Session, joinedload
import models, schemas
from datetime import date, datetime
from fastapi import HTTPException, status
from passlib.context import CryptContext

# Настройка шифрования паролей
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Функция для проверки пароля
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

# Функция для хеширования пароля
def get_password_hash(password):
    return pwd_context.hash(password)

# Вспомогательная функция для получения соединения с БД
def get_db():
    db = models.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Функции для работы с гостиницами
def get_hotel(db: Session, hotel_id: int):
    return db.query(models.Hotel).filter(models.Hotel.hotel_id == hotel_id).first()

def get_hotels(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Hotel).offset(skip).limit(limit).all()

def create_hotel(db: Session, hotel: schemas.HotelCreate):
    db_hotel = models.Hotel(**hotel.dict())
    db.add(db_hotel)
    db.commit()
    db.refresh(db_hotel)
    return db_hotel

# Функции для работы с типами номеров
def get_room_type(db: Session, type_id: int):
    return db.query(models.RoomType).filter(models.RoomType.type_id == type_id).first()

def get_room_types(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.RoomType).offset(skip).limit(limit).all()

def create_room_type(db: Session, room_type: schemas.RoomTypeCreate):
    db_room_type = models.RoomType(**room_type.dict())
    db.add(db_room_type)
    db.commit()
    db.refresh(db_room_type)
    return db_room_type

# Функции для работы с номерами
def get_room(db: Session, room_id: int):
    return db.query(models.Room).filter(models.Room.room_id == room_id).first()

def get_rooms(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Room).offset(skip).limit(limit).all()

def get_rooms_by_hotel(db: Session, hotel_id: int):
    return db.query(models.Room).filter(models.Room.hotel_id == hotel_id).all()

def get_rooms_by_type(db: Session, type_id: int):
    return db.query(models.Room).filter(models.Room.type_id == type_id).all()

def get_available_rooms(db: Session, check_in_date: date, check_out_date: date):
    # Получаем идентификаторы комнат, которые заняты в указанный период
    booked_room_ids = db.query(models.Booking.room_id).filter(
        (models.Booking.check_in_date <= check_out_date) & 
        (models.Booking.check_out_date >= check_in_date)
    ).all()
    
    # Преобразуем список кортежей в плоский список
    booked_room_ids = [room_id for (room_id,) in booked_room_ids]
    
    # Получаем доступные комнаты
    return db.query(models.Room).filter(
        (models.Room.room_id.notin_(booked_room_ids)) &
        (models.Room.status == "Свободен")
    ).all()

def create_room(db: Session, room: schemas.RoomCreate):
    db_room = models.Room(**room.dict())
    db.add(db_room)
    db.commit()
    db.refresh(db_room)
    return db_room

def update_room_status(db: Session, room_id: int, status: str):
    db_room = get_room(db, room_id)
    if not db_room:
        raise HTTPException(status_code=404, detail="Номер не найден")
    db_room.status = status
    db.commit()
    db.refresh(db_room)
    return db_room

# Функции для работы с клиентами
def get_client(db: Session, client_id: int):
    return db.query(models.Client).filter(models.Client.client_id == client_id).first()

def get_clients(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Client).offset(skip).limit(limit).all()

def get_clients_by_city(db: Session, city: str, skip: int = 0, limit: int = 100):
    return db.query(models.Client).filter(models.Client.city == city).offset(skip).limit(limit).all()

def create_client(db: Session, client: schemas.ClientCreate):
    db_client = models.Client(**client.dict())
    db.add(db_client)
    db.commit()
    db.refresh(db_client)
    return db_client

# Функции для работы с бронированиями
def get_booking(db: Session, booking_id: int):
    return db.query(models.Booking).filter(models.Booking.booking_id == booking_id).first()

def get_bookings(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Booking).offset(skip).limit(limit).all()

def get_bookings_by_client(db: Session, client_id: int, skip: int = 0, limit: int = 100):
    return db.query(models.Booking).filter(models.Booking.client_id == client_id).offset(skip).limit(limit).all()

def get_bookings_by_room(db: Session, room_id: int, skip: int = 0, limit: int = 100):
    return db.query(models.Booking).filter(models.Booking.room_id == room_id).offset(skip).limit(limit).all()

def create_booking(db: Session, booking: schemas.BookingCreate):
    # Проверяем, доступен ли номер в указанные даты
    conflicts = db.query(models.Booking).filter(
        models.Booking.room_id == booking.room_id,
        models.Booking.check_in_date <= booking.check_out_date,
        models.Booking.check_out_date >= booking.check_in_date,
        models.Booking.status.notin_(["Отменено", "Выселен"])
    ).first()
    
    if conflicts:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Номер уже забронирован на указанные даты"
        )
    
    db_booking = models.Booking(**booking.dict())
    db.add(db_booking)
    db.commit()
    db.refresh(db_booking)
    
    # Обновляем статус номера в зависимости от дат бронирования
    update_room_status_based_on_bookings(db, booking.room_id)
    
    return db_booking

# Функция для автоматического обновления статуса номера на основе бронирований
def update_room_status_based_on_bookings(db: Session, room_id: int):
    # Получаем номер
    room = get_room(db, room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Номер не найден")
    
    # Получаем текущую дату
    today = date.today()
    
    # Проверяем, есть ли активные бронирования на текущую дату
    active_booking = db.query(models.Booking).filter(
        models.Booking.room_id == room_id,
        models.Booking.check_in_date <= today,
        models.Booking.check_out_date >= today,
        models.Booking.status.notin_(["Отменено", "Выселен"])
    ).first()
    
    # Устанавливаем статус в зависимости от наличия активного бронирования
    new_status = "Занят" if active_booking else "Свободен"
    
    # Если статус изменился, обновляем его
    if room.status != new_status:
        room.status = new_status
        db.commit()
        db.refresh(room)
    
    return room

# Функция для обновления статусов всех номеров
def update_all_room_statuses(db: Session):
    # Получаем все номера
    rooms = get_rooms(db)
    
    updated_rooms = []
    
    # Получаем текущую дату
    today = date.today()
    
    for room in rooms:
        # Проверяем, есть ли активные бронирования на текущую дату
        active_booking = db.query(models.Booking).filter(
            models.Booking.room_id == room.room_id,
            models.Booking.check_in_date <= today,
            models.Booking.check_out_date >= today,
            models.Booking.status.notin_(["Отменено", "Выселен"])
        ).first()
        
        # Устанавливаем статус в зависимости от наличия активного бронирования
        new_status = "Занят" if active_booking else "Свободен"
        
        # Если статус изменился, обновляем его
        if room.status != new_status:
            room.status = new_status
            db.commit()
            db.refresh(room)
            updated_rooms.append(room)
    
    return updated_rooms

# Функции для работы с сотрудниками
def get_employee(db: Session, employee_id: int):
    return db.query(models.Employee).filter(models.Employee.employee_id == employee_id).first()

def get_employees(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Employee).offset(skip).limit(limit).all()

def get_employees_by_hotel(db: Session, hotel_id: int):
    return db.query(models.Employee).filter(models.Employee.hotel_id == hotel_id).all()

def get_active_employees(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Employee).filter(models.Employee.status == "Активен").offset(skip).limit(limit).all()

def create_employee(db: Session, employee: schemas.EmployeeCreate):
    db_employee = models.Employee(**employee.dict())
    db.add(db_employee)
    db.commit()
    db.refresh(db_employee)
    return db_employee

def update_employee_status(db: Session, employee_id: int, status: str):
    db_employee = get_employee(db, employee_id)
    if not db_employee:
        raise HTTPException(status_code=404, detail="Сотрудник не найден")
    
    db_employee.status = status
    db.commit()
    db.refresh(db_employee)
    return db_employee

# Функции для работы с расписанием уборок
def get_cleaning_schedule(db: Session, schedule_id: int):
    return db.query(models.CleaningSchedule).filter(models.CleaningSchedule.schedule_id == schedule_id).first()

def get_cleaning_schedules(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.CleaningSchedule).offset(skip).limit(limit).all()

def get_cleaning_schedules_with_details(db: Session, skip: int = 0, limit: int = 100):
    schedules = db.query(models.CleaningSchedule).options(
        joinedload(models.CleaningSchedule.employee)
    ).offset(skip).limit(limit).all()
    
    # Фильтруем записи с None employee_id, чтобы избежать ошибок
    return [schedule for schedule in schedules if schedule.employee_id is not None]

def get_cleaning_schedules_by_employee(db: Session, employee_id: int):
    return db.query(models.CleaningSchedule).filter(models.CleaningSchedule.employee_id == employee_id).all()

def get_cleaning_schedules_by_day(db: Session, day_of_week: str):
    return db.query(models.CleaningSchedule).filter(models.CleaningSchedule.day_of_week == day_of_week).all()

def get_cleaning_schedules_by_day_with_details(db: Session, day_of_week: str):
    schedules = db.query(models.CleaningSchedule).options(
        joinedload(models.CleaningSchedule.employee)
    ).filter(models.CleaningSchedule.day_of_week == day_of_week).all()
    
    # Фильтруем записи с None employee_id, чтобы избежать ошибок
    return [schedule for schedule in schedules if schedule.employee_id is not None]

def create_cleaning_schedule(db: Session, schedule: schemas.CleaningScheduleCreate):
    db_schedule = models.CleaningSchedule(**schedule.dict())
    db.add(db_schedule)
    db.commit()
    db.refresh(db_schedule)
    return db_schedule

# Функции для работы с журналом уборок
def get_cleaning_log(db: Session, log_id: int):
    return db.query(models.CleaningLog).filter(models.CleaningLog.log_id == log_id).first()

def get_cleaning_logs(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.CleaningLog).offset(skip).limit(limit).all()

def get_cleaning_logs_by_employee(db: Session, employee_id: int):
    return db.query(models.CleaningLog).filter(models.CleaningLog.employee_id == employee_id).all()

def get_cleaning_logs_by_date(db: Session, cleaning_date: date):
    return db.query(models.CleaningLog).filter(models.CleaningLog.cleaning_date == cleaning_date).all()

def get_cleaning_logs_by_date_and_floor(db: Session, cleaning_date: date, floor_id: int):
    return db.query(models.CleaningLog).filter(
        models.CleaningLog.cleaning_date == cleaning_date,
        models.CleaningLog.floor_id == floor_id
    ).all()

def create_cleaning_log(db: Session, log: schemas.CleaningLogCreate):
    db_log = models.CleaningLog(**log.dict())
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log

def complete_cleaning(db: Session, log_id: int):
    db_log = get_cleaning_log(db, log_id)
    if not db_log:
        raise HTTPException(status_code=404, detail="Запись не найдена")
    
    db_log.status = "Завершена"
    db.commit()
    db.refresh(db_log)
    return db_log

# Функции для работы с пользователями
def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()

def get_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.User).offset(skip).limit(limit).all()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = get_password_hash(user.password)
    db_user = models.User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password,
        is_active=user.is_active,
        is_admin=user.is_admin,
        hotel_id=user.hotel_id
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user 