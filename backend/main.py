from fastapi import FastAPI, Depends, HTTPException, status, Request, Response, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import models, schemas, crud
from database import engine, SessionLocal
import uvicorn
import logging
import traceback
from datetime import date, timedelta, datetime
from fastapi.security import OAuth2PasswordRequestForm

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("uvicorn")
logger.setLevel(logging.DEBUG)

# Создание таблиц
models.Base.metadata.create_all(bind=engine)

# Создание гостиницы по умолчанию, если она не существует
def create_default_hotel():
    db = SessionLocal()
    try:
        # Проверяем, есть ли гостиница с ID 1
        hotel = db.query(models.Hotel).filter(models.Hotel.hotel_id == 1).first()
        if not hotel:
            logger.info("Создание гостиницы по умолчанию...")
            default_hotel = models.Hotel(hotel_id=1, name="Гостиница по умолчанию", total_rooms=50)
            db.add(default_hotel)
            db.commit()
            logger.info("Гостиница по умолчанию успешно создана")
        else:
            logger.info(f"Гостиница по умолчанию уже существует: {hotel.name}")
    except Exception as e:
        logger.error(f"Ошибка при создании гостиницы по умолчанию: {str(e)}")
        logger.error(traceback.format_exc())
    finally:
        db.close()

# Вызываем функцию при запуске сервера
create_default_hotel()

# Создание приложения FastAPI
app = FastAPI(title="InnControl API", description="API для системы администрирования гостиниц")

# Настройка CORS для работы с фронтендом
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Разрешаем запросы с любого источника
    allow_credentials=False,  # Не используем credentials, чтобы разрешить '*' для origins
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],  # Разрешаем любые заголовки
    expose_headers=["Content-Length", "Access-Control-Allow-Origin"],
    max_age=600,  # Время кеширования предзапросов (в секундах)
)

# Специальный мидлвар для добавления CORS заголовков к каждому ответу
@app.middleware("http")
async def add_cors_headers(request, call_next):
    response = await call_next(request)
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
    response.headers["Access-Control-Allow-Headers"] = "*"
    return response

# Тестовый эндпоинт для проверки CORS
@app.get("/api-test")
def test_api():
    return {"message": "API работает корректно!", "cors": "настроен"}

# Зависимость для получения сессии БД
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Эндпоинты для гостиниц
@app.get("/hotels/", response_model=List[schemas.Hotel])
def read_hotels(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    hotels = crud.get_hotels(db, skip=skip, limit=limit)
    return hotels

@app.get("/hotels/{hotel_id}", response_model=schemas.Hotel)
def read_hotel(hotel_id: int, db: Session = Depends(get_db)):
    db_hotel = crud.get_hotel(db, hotel_id=hotel_id)
    if db_hotel is None:
        raise HTTPException(status_code=404, detail="Гостиница не найдена")
    return db_hotel

@app.post("/hotels/", response_model=schemas.Hotel)
def create_hotel(hotel: schemas.HotelCreate, db: Session = Depends(get_db)):
    return crud.create_hotel(db=db, hotel=hotel)

# Эндпоинты для типов номеров
@app.get("/room-types/", response_model=List[schemas.RoomType])
def read_room_types(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    room_types = crud.get_room_types(db, skip=skip, limit=limit)
    return room_types

@app.get("/room-types/{type_id}", response_model=schemas.RoomType)
def read_room_type(type_id: int, db: Session = Depends(get_db)):
    db_room_type = crud.get_room_type(db, type_id=type_id)
    if db_room_type is None:
        raise HTTPException(status_code=404, detail="Тип номера не найден")
    return db_room_type

@app.post("/room-types/", response_model=schemas.RoomType)
def create_room_type(room_type: schemas.RoomTypeCreate, db: Session = Depends(get_db)):
    return crud.create_room_type(db=db, room_type=room_type)

# Эндпоинты для номеров
@app.get("/rooms/", response_model=List[schemas.Room])
def read_rooms(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    rooms = crud.get_rooms(db, skip=skip, limit=limit)
    return rooms

@app.get("/rooms/{room_id}", response_model=schemas.RoomWithDetails)
def read_room(room_id: int, db: Session = Depends(get_db)):
    db_room = crud.get_room(db, room_id=room_id)
    if db_room is None:
        raise HTTPException(status_code=404, detail="Номер не найден")
    return db_room

@app.post("/rooms/", response_model=schemas.Room)
def create_room(room: schemas.RoomCreate, db: Session = Depends(get_db)):
    return crud.create_room(db=db, room=room)

@app.put("/rooms/{room_id}", response_model=schemas.Room)
def update_room(room_id: int, room: schemas.RoomCreate, db: Session = Depends(get_db)):
    db_room = crud.get_room(db, room_id=room_id)
    if db_room is None:
        raise HTTPException(status_code=404, detail="Номер не найден")
    
    # Обновляем поля номера
    db_room.hotel_id = room.hotel_id
    db_room.type_id = room.type_id
    db_room.floor = room.floor
    db_room.room_number = room.room_number
    
    # Сохраняем текущий статус, он должен меняться только автоматически
    # в зависимости от бронирований
    
    db.commit()
    db.refresh(db_room)
    return db_room

@app.delete("/rooms/{room_id}", response_model=schemas.Room)
def delete_room(room_id: int, db: Session = Depends(get_db)):
    db_room = crud.get_room(db, room_id=room_id)
    if db_room is None:
        raise HTTPException(status_code=404, detail="Номер не найден")
    
    # Проверяем, есть ли у номера активные бронирования
    room_bookings = crud.get_bookings_by_room(db, room_id=room_id)
    active_bookings = [b for b in room_bookings if b.status in ["Активно", "Подтверждено"]]
    
    if active_bookings:
        raise HTTPException(
            status_code=400, 
            detail="Невозможно удалить номер с активными бронированиями"
        )
    
    # Удаляем номер
    db.delete(db_room)
    db.commit()
    return db_room

@app.get("/hotels/{hotel_id}/rooms/", response_model=List[schemas.Room])
def read_hotel_rooms(hotel_id: int, db: Session = Depends(get_db)):
    db_hotel = crud.get_hotel(db, hotel_id=hotel_id)
    if db_hotel is None:
        raise HTTPException(status_code=404, detail="Гостиница не найдена")
    return crud.get_rooms_by_hotel(db, hotel_id=hotel_id)

@app.get("/hotels/{hotel_id}/employees/", response_model=List[schemas.Employee])
def read_hotel_employees(hotel_id: int, db: Session = Depends(get_db)):
    db_hotel = crud.get_hotel(db, hotel_id=hotel_id)
    if db_hotel is None:
        raise HTTPException(status_code=404, detail="Гостиница не найдена")
    return crud.get_employees_by_hotel(db, hotel_id=hotel_id)

@app.get("/available-rooms/", response_model=List[schemas.Room])
def read_available_rooms(check_in_date: str, check_out_date: str, db: Session = Depends(get_db)):
    from datetime import date, datetime
    
    try:
        check_in = date.fromisoformat(check_in_date)
        check_out = date.fromisoformat(check_out_date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Неверный формат даты. Используйте формат YYYY-MM-DD")
    
    return crud.get_available_rooms(db, check_in_date=check_in, check_out_date=check_out)

# Эндпоинты для клиентов
@app.get("/clients/", response_model=List[schemas.Client])
def read_clients(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    clients = crud.get_clients(db, skip=skip, limit=limit)
    return clients

@app.get("/clients/{client_id}", response_model=schemas.Client)
def read_client(client_id: int, db: Session = Depends(get_db)):
    db_client = crud.get_client(db, client_id=client_id)
    if db_client is None:
        raise HTTPException(status_code=404, detail="Клиент не найден")
    return db_client

@app.post("/clients/", response_model=schemas.Client)
def create_client(client: schemas.ClientCreate, db: Session = Depends(get_db)):
    return crud.create_client(db=db, client=client)

@app.put("/clients/{client_id}", response_model=schemas.Client)
def update_client(client_id: int, client: schemas.ClientCreate, db: Session = Depends(get_db)):
    db_client = crud.get_client(db, client_id=client_id)
    if db_client is None:
        raise HTTPException(status_code=404, detail="Клиент не найден")
    
    # Обновляем поля клиента
    db_client.first_name = client.first_name
    db_client.last_name = client.last_name
    db_client.passport_number = client.passport_number
    db_client.city = client.city
    
    db.commit()
    db.refresh(db_client)
    return db_client

@app.delete("/clients/{client_id}", response_model=schemas.Client)
def delete_client(client_id: int, db: Session = Depends(get_db)):
    db_client = crud.get_client(db, client_id=client_id)
    if db_client is None:
        raise HTTPException(status_code=404, detail="Клиент не найден")
    
    # Получаем все бронирования клиента
    client_bookings = crud.get_bookings_by_client(db, client_id=client_id)
    
    # Удаляем все бронирования клиента
    for booking in client_bookings:
        # Если номер был занят этим бронированием, обновляем его статус
        room = crud.get_room(db, room_id=booking.room_id)
        if room and room.status == "Занят":
            # Проверяем, есть ли другие активные бронирования для этого номера
            other_bookings = db.query(models.Booking).filter(
                models.Booking.room_id == booking.room_id,
                models.Booking.booking_id != booking.booking_id,
                models.Booking.status.in_(["Активно", "Подтверждено"])
            ).first()
            
            if not other_bookings:
                room.status = "Свободен"
                db.commit()
        
        # Удаляем бронирование
        db.delete(booking)
    
    # Удаляем клиента
    db.delete(db_client)
    db.commit()
    
    return db_client

@app.get("/clients/city/{city}", response_model=List[schemas.Client])
def read_clients_by_city(city: str, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_clients_by_city(db, city=city, skip=skip, limit=limit)

# Эндпоинт для получения бронирований из БД с обработкой ошибок и фильтрацией
@app.get("/bookings/", response_model=List[schemas.Booking])
def read_bookings(
    skip: int = 0, 
    limit: int = 100, 
    status: Optional[str] = Query(None, description="Фильтр по статусу бронирования: Заселен, Подтверждено, Выселен, Отменено"),
    db: Session = Depends(get_db)
):
    try:
        logger.info(f"Запрос бронирований из БД: skip={skip}, limit={limit}, status={status}")
        
        if status:
            # Если указан статус, фильтруем по нему
            bookings = db.query(models.Booking).filter(models.Booking.status == status).offset(skip).limit(limit).all()
            logger.info(f"Найдено {len(bookings)} бронирований со статусом '{status}'")
        else:
            # Иначе возвращаем все бронирования
            bookings = crud.get_bookings(db, skip=skip, limit=limit)
            logger.info(f"Успешно получено {len(bookings)} бронирований из БД")
        
        return bookings
    except Exception as e:
        logger.error(f"Ошибка при получении бронирований из БД: {str(e)}")
        logger.error(traceback.format_exc())
        # В случае ошибки возвращаем пустой список вместо HTTP ошибки
        return []

@app.get("/bookings/{booking_id}", response_model=schemas.BookingWithDetails)
def read_booking(booking_id: int, db: Session = Depends(get_db)):
    db_booking = crud.get_booking(db, booking_id=booking_id)
    if db_booking is None:
        raise HTTPException(status_code=404, detail="Бронирование не найдено")
    return db_booking

@app.post("/bookings/", response_model=schemas.Booking)
def create_booking(booking: schemas.BookingCreate, db: Session = Depends(get_db)):
    # Проверяем доступность номера
    try:
        # Проверяем, существует ли номер
        room = crud.get_room(db, room_id=booking.room_id)
        if not room:
            raise HTTPException(status_code=404, detail="Указанный номер не найден")
            
        # Проверяем, существует ли клиент
        client = crud.get_client(db, client_id=booking.client_id)
        if not client:
            raise HTTPException(status_code=404, detail="Указанный клиент не найден")
            
        # Создаем бронирование
        return crud.create_booking(db=db, booking=booking)
    except HTTPException as e:
        # Пробрасываем исключение дальше
        raise e
    except Exception as e:
        # Логируем непредвиденную ошибку
        print(f"Ошибка при создании бронирования: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Не удалось создать бронирование: {str(e)}")

@app.put("/bookings/{booking_id}", response_model=schemas.Booking)
def update_booking(booking_id: int, booking: schemas.BookingCreate, db: Session = Depends(get_db)):
    db_booking = crud.get_booking(db, booking_id=booking_id)
    if db_booking is None:
        raise HTTPException(status_code=404, detail="Бронирование не найдено")
    
    # Проверяем, не конфликтует ли новое бронирование с существующими
    if booking.room_id != db_booking.room_id or booking.check_in_date != db_booking.check_in_date or booking.check_out_date != db_booking.check_out_date:
        conflicts = db.query(models.Booking).filter(
            models.Booking.room_id == booking.room_id,
            models.Booking.booking_id != booking_id,
            models.Booking.check_in_date <= booking.check_out_date,
            models.Booking.check_out_date >= booking.check_in_date,
            models.Booking.status.notin_(["Отменено", "Выселен"])
        ).first()
        
        if conflicts:
            raise HTTPException(
                status_code=400,
                detail="Номер уже забронирован на указанные даты"
            )
    
    # Сохраняем старый ID номера для обновления статуса
    old_room_id = db_booking.room_id
    
    # Обновляем поля бронирования
    db_booking.room_id = booking.room_id
    db_booking.client_id = booking.client_id
    db_booking.check_in_date = booking.check_in_date
    db_booking.check_out_date = booking.check_out_date
    db_booking.status = booking.status
    
    db.commit()
    db.refresh(db_booking)
    
    # Если изменился номер, обновляем статусы обоих номеров
    if old_room_id != booking.room_id:
        crud.update_room_status_based_on_bookings(db, old_room_id)
    
    # Обновляем статус нового/текущего номера
    crud.update_room_status_based_on_bookings(db, booking.room_id)
    
    return db_booking

@app.put("/bookings/{booking_id}/status", response_model=schemas.Booking)
def update_booking_status(booking_id: int, status: schemas.BookingStatusUpdate, db: Session = Depends(get_db)):
    db_booking = crud.get_booking(db, booking_id=booking_id)
    if db_booking is None:
        raise HTTPException(status_code=404, detail="Бронирование не найдено")
    
    # Обновляем статус бронирования
    db_booking.status = status.status
    db.commit()
    db.refresh(db_booking)
    
    # Обновляем статус номера в зависимости от статуса бронирования и текущей даты
    crud.update_room_status_based_on_bookings(db, db_booking.room_id)
    
    return db_booking

@app.delete("/bookings/{booking_id}", response_model=schemas.Booking)
def delete_booking(booking_id: int, db: Session = Depends(get_db)):
    db_booking = crud.get_booking(db, booking_id=booking_id)
    if db_booking is None:
        raise HTTPException(status_code=404, detail="Бронирование не найдено")
    
    room_id = db_booking.room_id
    
    # Удаляем бронирование
    db.delete(db_booking)
    db.commit()
    
    # Обновляем статус номера после удаления бронирования
    crud.update_room_status_based_on_bookings(db, room_id)
    
    return db_booking

@app.get("/clients/{client_id}/bookings/", response_model=List[schemas.Booking])
def read_client_bookings(client_id: int, db: Session = Depends(get_db)):
    db_client = crud.get_client(db, client_id=client_id)
    if db_client is None:
        raise HTTPException(status_code=404, detail="Клиент не найден")
    return crud.get_bookings_by_client(db, client_id=client_id)

@app.get("/rooms/{room_id}/bookings/", response_model=List[schemas.Booking])
def read_room_bookings(room_id: int, db: Session = Depends(get_db)):
    db_room = crud.get_room(db, room_id=room_id)
    if db_room is None:
        raise HTTPException(status_code=404, detail="Номер не найден")
    return crud.get_bookings_by_room(db, room_id=room_id)

# Эндпоинты для сотрудников
@app.get("/employees/", response_model=List[schemas.Employee])
def read_employees(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    employees = crud.get_employees(db, skip=skip, limit=limit)
    return employees

@app.get("/employees/{employee_id}", response_model=schemas.Employee)
def read_employee(employee_id: int, db: Session = Depends(get_db)):
    db_employee = crud.get_employee(db, employee_id=employee_id)
    if db_employee is None:
        raise HTTPException(status_code=404, detail="Сотрудник не найден")
    return db_employee

@app.post("/employees/", response_model=schemas.Employee)
def create_employee(employee: schemas.EmployeeCreate, db: Session = Depends(get_db)):
    # Расширенное логирование
    print(f"Попытка создать сотрудника: {employee.dict()}")
    
    # Проверка обязательных полей
    if not employee.first_name or not employee.last_name:
        raise HTTPException(status_code=400, detail="Имя и фамилия являются обязательными полями")
    
    # Проверка существования гостиницы
    hotel = crud.get_hotel(db, hotel_id=employee.hotel_id)
    if not hotel:
        raise HTTPException(status_code=404, detail=f"Гостиница с ID {employee.hotel_id} не найдена")
    
    try:
        created_employee = crud.create_employee(db=db, employee=employee)
        print(f"Сотрудник успешно создан: {created_employee.__dict__}")
        return created_employee
    except Exception as e:
        print(f"Ошибка при создании сотрудника: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Ошибка сервера при создании сотрудника: {str(e)}")

@app.put("/employees/{employee_id}", response_model=schemas.Employee)
def update_employee(employee_id: int, employee: schemas.EmployeeCreate, db: Session = Depends(get_db)):
    db_employee = crud.get_employee(db, employee_id=employee_id)
    if db_employee is None:
        raise HTTPException(status_code=404, detail="Сотрудник не найден")
    
    # Обновляем поля сотрудника
    db_employee.hotel_id = employee.hotel_id
    db_employee.first_name = employee.first_name
    db_employee.last_name = employee.last_name
    db_employee.status = employee.status
    
    db.commit()
    db.refresh(db_employee)
    return db_employee

@app.put("/employees/{employee_id}/status/", response_model=schemas.Employee)
def update_employee_status(employee_id: int, status: schemas.EmployeeStatusUpdate, db: Session = Depends(get_db)):
    return crud.update_employee_status(db, employee_id=employee_id, status=status.status)

@app.delete("/employees/{employee_id}", response_model=schemas.Employee)
def delete_employee(employee_id: int, db: Session = Depends(get_db)):
    db_employee = crud.get_employee(db, employee_id=employee_id)
    if db_employee is None:
        raise HTTPException(status_code=404, detail="Сотрудник не найден")
    
    # Получаем все записи расписания уборок для сотрудника
    cleaning_schedules = crud.get_cleaning_schedules_by_employee(db, employee_id=employee_id)
    # Удаляем все записи расписания
    for schedule in cleaning_schedules:
        db.delete(schedule)
    
    # Получаем все записи журнала уборок для сотрудника
    cleaning_logs = crud.get_cleaning_logs_by_employee(db, employee_id=employee_id)
    # Удаляем все записи журнала
    for log in cleaning_logs:
        db.delete(log)
    
    # Удаляем сотрудника
    db.delete(db_employee)
    db.commit()
    return db_employee

# Эндпоинты для расписания уборок
@app.get("/cleaning-schedules/", response_model=List[schemas.CleaningSchedule])
def read_cleaning_schedules(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    schedules = crud.get_cleaning_schedules_with_details(db, skip=skip, limit=limit)
    return schedules

@app.get("/cleaning-schedules/{schedule_id}", response_model=schemas.CleaningScheduleWithDetails)
def read_cleaning_schedule(schedule_id: int, db: Session = Depends(get_db)):
    db_schedule = crud.get_cleaning_schedule(db, schedule_id=schedule_id)
    if db_schedule is None:
        raise HTTPException(status_code=404, detail="Расписание не найдено")
    return db_schedule

@app.delete("/cleaning-schedules/{schedule_id}", response_model=schemas.CleaningSchedule)
def delete_cleaning_schedule(schedule_id: int, db: Session = Depends(get_db)):
    db_schedule = crud.get_cleaning_schedule(db, schedule_id=schedule_id)
    if db_schedule is None:
        raise HTTPException(status_code=404, detail="Расписание не найдено")
    
    # Удаляем расписание
    db.delete(db_schedule)
    db.commit()
    return db_schedule

@app.post("/cleaning-schedules/", response_model=schemas.CleaningSchedule)
def create_cleaning_schedule(schedule: schemas.CleaningScheduleCreate, db: Session = Depends(get_db)):
    return crud.create_cleaning_schedule(db=db, schedule=schedule)

@app.put("/cleaning-schedules/{schedule_id}", response_model=schemas.CleaningSchedule)
def update_cleaning_schedule(schedule_id: int, schedule: schemas.CleaningScheduleCreate, db: Session = Depends(get_db)):
    db_schedule = crud.get_cleaning_schedule(db, schedule_id=schedule_id)
    if db_schedule is None:
        raise HTTPException(status_code=404, detail="Расписание не найдено")
    
    # Обновляем поля расписания
    db_schedule.employee_id = schedule.employee_id
    db_schedule.floor = schedule.floor
    db_schedule.day_of_week = schedule.day_of_week
    
    db.commit()
    db.refresh(db_schedule)
    return db_schedule

@app.get("/employees/{employee_id}/cleaning-schedules/", response_model=List[schemas.CleaningSchedule])
def read_employee_cleaning_schedules(employee_id: int, db: Session = Depends(get_db)):
    db_employee = crud.get_employee(db, employee_id=employee_id)
    if db_employee is None:
        raise HTTPException(status_code=404, detail="Сотрудник не найден")
    return crud.get_cleaning_schedules_by_employee(db, employee_id=employee_id)

@app.get("/cleaning-schedules/day/{day}/", response_model=List[schemas.CleaningSchedule])
def read_cleaning_schedules_by_day(day: str, db: Session = Depends(get_db)):
    return crud.get_cleaning_schedules_by_day_with_details(db, day_of_week=day)

# Эндпоинты для журнала уборок
@app.get("/cleaning-logs/", response_model=List[schemas.CleaningLog])
def read_cleaning_logs(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    logs = crud.get_cleaning_logs(db, skip=skip, limit=limit)
    return logs

@app.get("/cleaning-logs/{log_id}", response_model=schemas.CleaningLogWithDetails)
def read_cleaning_log(log_id: int, db: Session = Depends(get_db)):
    db_log = crud.get_cleaning_log(db, log_id=log_id)
    if db_log is None:
        raise HTTPException(status_code=404, detail="Запись не найдена")
    return db_log

@app.post("/cleaning-logs/", response_model=schemas.CleaningLog)
def create_cleaning_log(log: schemas.CleaningLogCreate, db: Session = Depends(get_db)):
    # Проверяем, нет ли уже записей по этому этажу на эту дату
    existing_logs = crud.get_cleaning_logs_by_date_and_floor(db, cleaning_date=log.cleaning_date, floor_id=log.floor_id)
    if existing_logs:
        raise HTTPException(
            status_code=400, 
            detail="На этот этаж уже назначен другой сотрудник в этот день"
        )
    
    return crud.create_cleaning_log(db=db, log=log)

@app.put("/cleaning-logs/{log_id}", response_model=schemas.CleaningLog)
def update_cleaning_log(log_id: int, log: schemas.CleaningLogCreate, db: Session = Depends(get_db)):
    db_log = crud.get_cleaning_log(db, log_id=log_id)
    if db_log is None:
        raise HTTPException(status_code=404, detail="Запись не найдена")
    
    # Обновляем поля журнала уборок
    db_log.floor_id = log.floor_id
    db_log.employee_id = log.employee_id
    db_log.cleaning_date = log.cleaning_date
    db_log.status = log.status
    
    db.commit()
    db.refresh(db_log)
    return db_log

@app.put("/cleaning-logs/{log_id}/status", response_model=schemas.CleaningLog)
def update_cleaning_log_status(log_id: int, status: schemas.CleaningLogStatusUpdate, db: Session = Depends(get_db)):
    db_log = crud.get_cleaning_log(db, log_id=log_id)
    if db_log is None:
        raise HTTPException(status_code=404, detail="Запись не найдена")
    
    db_log.status = status.status
    db.commit()
    db.refresh(db_log)
    return db_log

@app.delete("/cleaning-logs/{log_id}", response_model=schemas.CleaningLog)
def delete_cleaning_log(log_id: int, db: Session = Depends(get_db)):
    db_log = crud.get_cleaning_log(db, log_id=log_id)
    if db_log is None:
        raise HTTPException(status_code=404, detail="Запись не найдена")
    
    # Удаляем запись журнала уборок
    db.delete(db_log)
    db.commit()
    return db_log

@app.get("/rooms/{room_id}/cleaning-logs/", response_model=List[schemas.CleaningLog])
def read_room_cleaning_logs(room_id: int, db: Session = Depends(get_db)):
    db_room = crud.get_room(db, room_id=room_id)
    if db_room is None:
        raise HTTPException(status_code=404, detail="Номер не найден")
    return crud.get_cleaning_logs_by_room(db, room_id=room_id)

@app.get("/employees/{employee_id}/cleaning-logs/", response_model=List[schemas.CleaningLog])
def read_employee_cleaning_logs(employee_id: int, db: Session = Depends(get_db)):
    db_employee = crud.get_employee(db, employee_id=employee_id)
    if db_employee is None:
        raise HTTPException(status_code=404, detail="Сотрудник не найден")
    return crud.get_cleaning_logs_by_employee(db, employee_id=employee_id)

@app.get("/cleaning-logs/date/{date}/", response_model=List[schemas.CleaningLog])
def read_cleaning_logs_by_date(date: str, db: Session = Depends(get_db)):
    from datetime import date as date_type
    
    try:
        cleaning_date = date_type.fromisoformat(date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Неверный формат даты. Используйте формат YYYY-MM-DD")
    
    return crud.get_cleaning_logs_by_date(db, cleaning_date=cleaning_date)

@app.post("/cleaning-logs/{log_id}/complete/", response_model=schemas.CleaningLog)
def complete_cleaning_log(log_id: int, db: Session = Depends(get_db)):
    return crud.complete_cleaning(db, log_id=log_id)

# Простой эндпоинт для авторизации
@app.post("/token")
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # Получаем пользователя из базы данных
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    
    # Проверяем, что пользователь существует и пароль верный
    if not user or not crud.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверное имя пользователя или пароль"
        )
    
    # Создаем простой токен (не JWT)
    access_token = f"{user.username}_{user.id}"
    
    return {"access_token": access_token, "token_type": "bearer"}

# Эндпоинт для проверки текущего пользователя
@app.get("/users/me", response_model=schemas.User)
async def read_users_me(db: Session = Depends(get_db)):
    # Просто возвращаем фиксированного пользователя admin для совместимости
    user = db.query(models.User).filter(models.User.username == "admin").first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    return user

# Простой эндпоинт для проверки работы API
@app.get("/")
def read_root():
    return {"message": "Добро пожаловать в API системы управления гостиницей"}

# Новый эндпоинт для автоматического обновления статусов номеров
@app.post("/update-room-statuses/")
def update_room_statuses(db: Session = Depends(get_db)):
    updated_rooms = crud.update_all_room_statuses(db)
    return {"updated_rooms_count": len(updated_rooms)}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 