from sqlalchemy.orm import Session
from database import SessionLocal, engine, Base
import models
import schemas
import crud
from datetime import date, timedelta

# Пересоздаем таблицы
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)

# Создаем сессию для заполнения данных
db = SessionLocal()

# Заполняем данные о гостинице
hotel = schemas.HotelCreate(
    name="Маяк",
    total_rooms=30
)
db_hotel = crud.create_hotel(db, hotel)
print(f"Создана гостиница: {db_hotel.name}, ID: {db_hotel.hotel_id}")

# Создаем типы номеров
room_types = [
    schemas.RoomTypeCreate(name="Стандарт", capacity=2, price_per_night=3000),
    schemas.RoomTypeCreate(name="Комфорт", capacity=2, price_per_night=4500),
    schemas.RoomTypeCreate(name="Люкс", capacity=3, price_per_night=7000),
    schemas.RoomTypeCreate(name="Апартаменты", capacity=4, price_per_night=10000)
]

db_room_types = []
for room_type in room_types:
    db_room_type = crud.create_room_type(db, room_type)
    db_room_types.append(db_room_type)
    print(f"Создан тип номера: {db_room_type.name}, ID: {db_room_type.type_id}")

# Создаем номера для гостиницы
rooms = []
floor_count = 5  # 5 этажей
rooms_per_floor = 6  # 6 номеров на этаже

for floor in range(1, floor_count + 1):
    for room_num in range(1, rooms_per_floor + 1):
        room_number = f"{floor}0{room_num}"
        type_id = ((floor - 1) * rooms_per_floor + room_num - 1) % len(db_room_types) + 1
        
        # Статус "Занят" для некоторых номеров
        status = "Занят" if room_num % 3 == 0 else "Свободен"
        
        room = schemas.RoomCreate(
            hotel_id=db_hotel.hotel_id,
            type_id=type_id,
            floor=floor,
            room_number=room_number,
            status=status
        )
        db_room = crud.create_room(db, room)
        rooms.append(db_room)
        print(f"Создан номер: {db_room.room_number}, статус: {db_room.status}")

# Создаем клиентов
clients = [
    schemas.ClientCreate(
        first_name="Иван",
        last_name="Иванов",
        middle_name="Иванович",
        passport_series="1234",
        passport_number="567890",
        date_of_birth=date(1985, 5, 15),
        address="г. Москва, ул. Ленина, д.10, кв. 15",
        phone="+7(900)123-45-67",
        email="ivanov@example.com",
        city="Москва"
    ),
    schemas.ClientCreate(
        first_name="Петр",
        last_name="Петров",
        middle_name="Петрович",
        passport_series="2345",
        passport_number="678901",
        date_of_birth=date(1990, 8, 20),
        address="г. Санкт-Петербург, ул. Невская, д.5, кв. 42",
        phone="+7(900)234-56-78",
        email="petrov@example.com",
        city="Санкт-Петербург"
    ),
    schemas.ClientCreate(
        first_name="Анна",
        last_name="Сидорова",
        middle_name="Владимировна",
        passport_series="3456",
        passport_number="789012",
        date_of_birth=date(1988, 3, 10),
        address="г. Казань, ул. Баумана, д.7, кв. 21",
        phone="+7(900)345-67-89",
        email="sidorova@example.com",
        city="Казань"
    )
]

db_clients = []
for client in clients:
    db_client = crud.create_client(db, client)
    db_clients.append(db_client)
    print(f"Создан клиент: {db_client.last_name} {db_client.first_name}")

# Создаем сотрудников
employees = [
    schemas.EmployeeCreate(
        hotel_id=db_hotel.hotel_id,
        first_name="Алексей",
        last_name="Смирнов",
        middle_name="Дмитриевич",
        position="Администратор",
        phone="+7(900)111-22-33",
        email="admin@hotel.com",
        date_of_birth=date(1982, 7, 12),
        hire_date=date(2018, 3, 15),
        status="Активен"
    ),
    schemas.EmployeeCreate(
        hotel_id=db_hotel.hotel_id,
        first_name="Елена",
        last_name="Козлова",
        middle_name="Сергеевна",
        position="Горничная",
        phone="+7(900)222-33-44",
        email="maid1@hotel.com",
        date_of_birth=date(1975, 11, 22),
        hire_date=date(2019, 6, 10),
        status="Активен"
    ),
    schemas.EmployeeCreate(
        hotel_id=db_hotel.hotel_id,
        first_name="Ирина",
        last_name="Новикова",
        middle_name="Петровна",
        position="Горничная",
        phone="+7(900)333-44-55",
        email="maid2@hotel.com",
        date_of_birth=date(1980, 4, 5),
        hire_date=date(2020, 2, 3),
        status="Активен"
    ),
    schemas.EmployeeCreate(
        hotel_id=db_hotel.hotel_id,
        first_name="Сергей",
        last_name="Кузнецов",
        middle_name="Александрович",
        position="Техник",
        phone="+7(900)444-55-66",
        email="tech@hotel.com",
        date_of_birth=date(1978, 9, 15),
        hire_date=date(2017, 8, 20),
        status="Активен"
    ),
    schemas.EmployeeCreate(
        hotel_id=db_hotel.hotel_id,
        first_name="Мария",
        last_name="Волкова",
        middle_name="Игоревна",
        position="Менеджер",
        phone="+7(900)555-66-77",
        email="manager@hotel.com",
        date_of_birth=date(1985, 12, 3),
        hire_date=date(2018, 10, 5),
        status="В отпуске"
    )
]

db_employees = []
for employee in employees:
    db_employee = crud.create_employee(db, employee)
    db_employees.append(db_employee)
    print(f"Создан сотрудник: {db_employee.last_name} {db_employee.first_name}, должность: {db_employee.position}")

# Создаем бронирования
today = date.today()
bookings = [
    schemas.BookingCreate(
        room_id=rooms[0].room_id,
        client_id=db_clients[0].client_id,
        check_in_date=today + timedelta(days=1),
        check_out_date=today + timedelta(days=5),
        status="Подтверждено"
    ),
    schemas.BookingCreate(
        room_id=rooms[5].room_id,
        client_id=db_clients[1].client_id,
        check_in_date=today + timedelta(days=3),
        check_out_date=today + timedelta(days=7),
        status="Оплачено"
    ),
    schemas.BookingCreate(
        room_id=rooms[10].room_id,
        client_id=db_clients[2].client_id,
        check_in_date=today - timedelta(days=2),
        check_out_date=today + timedelta(days=2),
        status="Подтверждено"
    )
]

for booking in bookings:
    try:
        db_booking = models.Booking(**booking.dict())
        db.add(db_booking)
        db.commit()
        db.refresh(db_booking)
        print(f"Создано бронирование: номер {db_booking.room_id}, клиент {db_booking.client_id}")
    except Exception as e:
        print(f"Ошибка при создании бронирования: {e}")
        db.rollback()

# Создаем расписание уборок
days_of_week = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота", "Воскресенье"]
for i, day in enumerate(days_of_week):
    employee_id = db_employees[i % 3 + 1].employee_id  # Берем только горничных (индексы 1 и 2)
    floor = (i % 5) + 1
    
    schedule = schemas.CleaningScheduleCreate(
        employee_id=employee_id,
        day_of_week=day,
        floor=floor,
        start_time="09:00:00" if i % 2 == 0 else "13:00:00",
        end_time="13:00:00" if i % 2 == 0 else "17:00:00"
    )
    
    db_schedule = crud.create_cleaning_schedule(db, schedule)
    print(f"Создано расписание уборки: день {db_schedule.day_of_week}, этаж {db_schedule.floor}")

# Создаем журнал уборок
today = date.today()
cleaning_logs = [
    schemas.CleaningLogCreate(
        room_id=rooms[2].room_id,
        employee_id=db_employees[1].employee_id,
        cleaning_date=today,
        start_time="09:00:00",
        end_time="09:30:00",
        status="Завершена"
    ),
    schemas.CleaningLogCreate(
        room_id=rooms[7].room_id,
        employee_id=db_employees[1].employee_id,
        cleaning_date=today,
        start_time="10:00:00",
        end_time="10:30:00",
        status="Завершена"
    ),
    schemas.CleaningLogCreate(
        room_id=rooms[12].room_id,
        employee_id=db_employees[2].employee_id,
        cleaning_date=today,
        start_time="11:00:00",
        end_time=None,
        status="В процессе"
    ),
    schemas.CleaningLogCreate(
        room_id=rooms[17].room_id,
        employee_id=db_employees[2].employee_id,
        cleaning_date=today,
        start_time="14:00:00",
        end_time=None,
        status="Ожидает"
    )
]

for log in cleaning_logs:
    db_log = crud.create_cleaning_log(db, log)
    print(f"Создана запись в журнале уборок: номер {db_log.room_id}, статус {db_log.status}")

print("База данных успешно инициализирована!")

# Закрываем сессию
db.close() 