import models
from database import SessionLocal, engine

# Добавляем типы номеров
def create_default_room_types(db):
    print("Проверка типов номеров...")
    
    # Проверяем, есть ли уже типы номеров
    existing_types = db.query(models.RoomType).all()
    if existing_types:
        print(f"Типы номеров уже существуют ({len(existing_types)} типов)")
        return existing_types
        
    print("Создание типов номеров...")
    # Стандарт
    standard = models.RoomType(
        name="Стандарт",
        capacity=2,
        price_per_night=3000.0
    )
    db.add(standard)
    
    # Люкс
    lux = models.RoomType(
        name="Люкс",
        capacity=3,
        price_per_night=5000.0
    )
    db.add(lux)
    
    # Семейный
    family = models.RoomType(
        name="Семейный",
        capacity=4,
        price_per_night=6000.0
    )
    db.add(family)
    
    db.commit()
    print("Типы номеров созданы")
    return db.query(models.RoomType).all()

# Добавляем номера
def create_default_rooms(db, hotel_id):
    print(f"Проверка номеров для гостиницы {hotel_id}...")
    
    # Проверяем, есть ли уже номера
    existing_rooms = db.query(models.Room).filter(models.Room.hotel_id == hotel_id).all()
    if existing_rooms:
        print(f"Номера уже существуют ({len(existing_rooms)} номеров)")
        return existing_rooms
    
    print(f"Создание номеров для гостиницы {hotel_id}...")
    
    # Получаем типы номеров
    room_types = db.query(models.RoomType).all()
    if not room_types:
        print("Типы номеров не найдены, сначала создайте типы номеров")
        return []
    
    # Номера первого этажа
    for i in range(1, 6):
        room = models.Room(
            hotel_id=hotel_id,
            type_id=room_types[0].type_id,  # Стандарт
            floor=1,
            room_number=f"101-{i}",
            status="Свободен"
        )
        db.add(room)
    
    # Номера второго этажа
    for i in range(1, 4):
        room = models.Room(
            hotel_id=hotel_id,
            type_id=room_types[1].type_id,  # Люкс
            floor=2,
            room_number=f"201-{i}",
            status="Свободен"
        )
        db.add(room)
    
    # Номера третьего этажа
    for i in range(1, 3):
        room = models.Room(
            hotel_id=hotel_id,
            type_id=room_types[2].type_id,  # Семейный
            floor=3,
            room_number=f"301-{i}",
            status="Свободен"
        )
        db.add(room)
    
    db.commit()
    print("Номера созданы")
    return db.query(models.Room).all()

# Добавляем клиентов
def create_default_clients(db):
    print("Проверка клиентов...")
    
    # Проверяем, есть ли уже клиенты
    existing_clients = db.query(models.Client).all()
    if existing_clients:
        print(f"Клиенты уже существуют ({len(existing_clients)} клиентов)")
        return existing_clients
    
    print("Создание клиентов...")
    
    clients = [
        models.Client(
            first_name="Иван",
            last_name="Петров",
            passport_number="1234 567890",
            city="Москва"
        ),
        models.Client(
            first_name="Анна",
            last_name="Иванова",
            passport_number="2345 678901",
            city="Санкт-Петербург"
        ),
        models.Client(
            first_name="Сергей",
            last_name="Сидоров",
            passport_number="3456 789012",
            city="Казань"
        ),
        models.Client(
            first_name="Елена",
            last_name="Смирнова",
            passport_number="4567 890123",
            city="Новосибирск"
        )
    ]
    
    for client in clients:
        db.add(client)
    
    db.commit()
    print("Клиенты созданы")
    return db.query(models.Client).all()

# Добавляем сотрудников
def create_default_employees(db, hotel_id):
    print(f"Проверка сотрудников для гостиницы {hotel_id}...")
    
    # Проверяем, есть ли уже сотрудники
    existing_employees = db.query(models.Employee).filter(models.Employee.hotel_id == hotel_id).all()
    if existing_employees:
        print(f"Сотрудники уже существуют ({len(existing_employees)} сотрудников)")
        return existing_employees
    
    print(f"Создание сотрудников для гостиницы {hotel_id}...")
    
    employees = [
        models.Employee(
            hotel_id=hotel_id,
            first_name="Мария",
            last_name="Кузнецова",
            status="Активен"
        ),
        models.Employee(
            hotel_id=hotel_id,
            first_name="Алексей",
            last_name="Попов",
            status="Активен"
        ),
        models.Employee(
            hotel_id=hotel_id,
            first_name="Ольга",
            last_name="Соколова",
            status="Активен"
        )
    ]
    
    for employee in employees:
        db.add(employee)
    
    db.commit()
    print("Сотрудники созданы")
    return db.query(models.Employee).all()

# Добавляем бронирования
def create_default_bookings(db):
    print("Проверка бронирований...")
    
    # Проверяем, есть ли уже бронирования
    existing_bookings = db.query(models.Booking).all()
    if existing_bookings:
        print(f"Бронирования уже существуют ({len(existing_bookings)} бронирований)")
        return existing_bookings
    
    print("Создание бронирований...")
    
    # Получаем клиентов
    clients = db.query(models.Client).all()
    if not clients:
        print("Клиенты не найдены, сначала создайте клиентов")
        return []
    
    # Получаем номера
    rooms = db.query(models.Room).all()
    if not rooms:
        print("Номера не найдены, сначала создайте номера")
        return []
    
    # Даты для бронирований
    from datetime import date, timedelta
    today = date.today()
    tomorrow = today + timedelta(days=1)
    next_week = today + timedelta(days=7)
    two_weeks = today + timedelta(days=14)
    
    bookings = [
        models.Booking(
            room_id=rooms[0].room_id,
            client_id=clients[0].client_id,
            check_in_date=today,
            check_out_date=tomorrow + timedelta(days=3),
            status="Подтверждено"
        ),
        models.Booking(
            room_id=rooms[1].room_id,
            client_id=clients[1].client_id,
            check_in_date=next_week,
            check_out_date=next_week + timedelta(days=5),
            status="Подтверждено"
        ),
        models.Booking(
            room_id=rooms[2].room_id,
            client_id=clients[2].client_id,
            check_in_date=tomorrow,
            check_out_date=tomorrow + timedelta(days=2),
            status="Подтверждено"
        ),
        models.Booking(
            room_id=rooms[3].room_id,
            client_id=clients[3].client_id,
            check_in_date=two_weeks,
            check_out_date=two_weeks + timedelta(days=7),
            status="Подтверждено"
        )
    ]
    
    for booking in bookings:
        db.add(booking)
        # Обновляем статус номера на "Занят" для активных бронирований
        if booking.check_in_date <= today <= booking.check_out_date:
            room = db.query(models.Room).filter(models.Room.room_id == booking.room_id).first()
            if room:
                room.status = "Занят"
    
    db.commit()
    print("Бронирования созданы")
    return db.query(models.Booking).all()

# Добавляем записи журнала уборок
def create_default_cleaning_logs(db):
    print("Проверка записей журнала уборок...")
    
    # Проверяем, есть ли уже записи журнала уборок
    existing_logs = db.query(models.CleaningLog).all()
    if existing_logs:
        print(f"Записи журнала уборок уже существуют ({len(existing_logs)} записей)")
        return existing_logs
    
    print("Создание записей журнала уборок...")
    
    # Получаем номера и сотрудников
    rooms = db.query(models.Room).all()
    employees = db.query(models.Employee).all()
    
    if not rooms or not employees:
        print("Номера или сотрудники не найдены, сначала создайте их")
        return []
    
    # Даты для уборок
    from datetime import date, timedelta
    today = date.today()
    yesterday = today - timedelta(days=1)
    tomorrow = today + timedelta(days=1)
    
    logs = [
        models.CleaningLog(
            room_id=rooms[0].room_id,
            employee_id=employees[0].employee_id,
            cleaning_date=yesterday,
            status="Завершена"
        ),
        models.CleaningLog(
            room_id=rooms[1].room_id,
            employee_id=employees[1].employee_id,
            cleaning_date=today,
            status="В процессе"
        ),
        models.CleaningLog(
            room_id=rooms[2].room_id,
            employee_id=employees[2].employee_id,
            cleaning_date=today,
            status="Ожидает"
        ),
        models.CleaningLog(
            room_id=rooms[3].room_id,
            employee_id=employees[0].employee_id,
            cleaning_date=tomorrow,
            status="Ожидает"
        )
    ]
    
    for log in logs:
        db.add(log)
    
    db.commit()
    print("Записи журнала уборок созданы")
    return db.query(models.CleaningLog).all()

# Функция для инициализации базы данных тестовыми данными
def initialize_db():
    from database import SessionLocal, engine
    import models
    
    print("Инициализация базы данных...")
    
    # Создаем таблицы
    models.Base.metadata.create_all(bind=engine)
    
    # Открываем сессию
    db = SessionLocal()
    
    try:
        # Создаем гостиницу по умолчанию
        hotel = db.query(models.Hotel).filter(models.Hotel.hotel_id == 1).first()
        if not hotel:
            print("Создание гостиницы по умолчанию...")
            hotel = models.Hotel(hotel_id=1, name="Гостиница по умолчанию", total_rooms=50)
            db.add(hotel)
            db.commit()
            print("Гостиница по умолчанию создана")
        else:
            print(f"Гостиница по умолчанию уже существует: {hotel.name}")
        
        hotel_id = hotel.hotel_id
        
        # Создаем остальные данные
        create_default_room_types(db)
        create_default_rooms(db, hotel_id)
        create_default_clients(db)
        create_default_employees(db, hotel_id)
        create_default_bookings(db)
        create_default_cleaning_logs(db)
        
        print("База данных успешно инициализирована")
    except Exception as e:
        db.rollback()
        print(f"Ошибка при инициализации базы данных: {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    initialize_db() 