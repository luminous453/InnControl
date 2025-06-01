from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import models, schemas, crud
from database import engine, SessionLocal
import uvicorn

# Создание таблиц
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="InnControl API", description="API для системы администрирования гостиниц")

# Настройка CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

@app.get("/hotels/{hotel_id}/rooms/", response_model=List[schemas.Room])
def read_hotel_rooms(hotel_id: int, db: Session = Depends(get_db)):
    db_hotel = crud.get_hotel(db, hotel_id=hotel_id)
    if db_hotel is None:
        raise HTTPException(status_code=404, detail="Гостиница не найдена")
    return crud.get_rooms_by_hotel(db, hotel_id=hotel_id)

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

@app.get("/clients/city/{city}", response_model=List[schemas.Client])
def read_clients_by_city(city: str, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_clients_by_city(db, city=city, skip=skip, limit=limit)

# Эндпоинты для бронирований
@app.get("/bookings/", response_model=List[schemas.Booking])
def read_bookings(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    bookings = crud.get_bookings(db, skip=skip, limit=limit)
    return bookings

@app.get("/bookings/{booking_id}", response_model=schemas.BookingWithDetails)
def read_booking(booking_id: int, db: Session = Depends(get_db)):
    db_booking = crud.get_booking(db, booking_id=booking_id)
    if db_booking is None:
        raise HTTPException(status_code=404, detail="Бронирование не найдено")
    return db_booking

@app.post("/bookings/", response_model=schemas.Booking)
def create_booking(booking: schemas.BookingCreate, db: Session = Depends(get_db)):
    return crud.create_booking(db=db, booking=booking)

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
    return crud.create_employee(db=db, employee=employee)

@app.get("/hotels/{hotel_id}/employees/", response_model=List[schemas.Employee])
def read_hotel_employees(hotel_id: int, db: Session = Depends(get_db)):
    db_hotel = crud.get_hotel(db, hotel_id=hotel_id)
    if db_hotel is None:
        raise HTTPException(status_code=404, detail="Гостиница не найдена")
    return crud.get_employees_by_hotel(db, hotel_id=hotel_id)

@app.put("/employees/{employee_id}/status/", response_model=schemas.Employee)
def update_employee_status(employee_id: int, status: str, db: Session = Depends(get_db)):
    return crud.update_employee_status(db, employee_id=employee_id, status=status)

# Эндпоинты для расписания уборок
@app.get("/cleaning-schedules/", response_model=List[schemas.CleaningSchedule])
def read_cleaning_schedules(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    schedules = crud.get_cleaning_schedules(db, skip=skip, limit=limit)
    return schedules

@app.get("/cleaning-schedules/{schedule_id}", response_model=schemas.CleaningScheduleWithDetails)
def read_cleaning_schedule(schedule_id: int, db: Session = Depends(get_db)):
    db_schedule = crud.get_cleaning_schedule(db, schedule_id=schedule_id)
    if db_schedule is None:
        raise HTTPException(status_code=404, detail="Расписание не найдено")
    return db_schedule

@app.post("/cleaning-schedules/", response_model=schemas.CleaningSchedule)
def create_cleaning_schedule(schedule: schemas.CleaningScheduleCreate, db: Session = Depends(get_db)):
    return crud.create_cleaning_schedule(db=db, schedule=schedule)

@app.get("/employees/{employee_id}/cleaning-schedules/", response_model=List[schemas.CleaningSchedule])
def read_employee_cleaning_schedules(employee_id: int, db: Session = Depends(get_db)):
    db_employee = crud.get_employee(db, employee_id=employee_id)
    if db_employee is None:
        raise HTTPException(status_code=404, detail="Сотрудник не найден")
    return crud.get_cleaning_schedules_by_employee(db, employee_id=employee_id)

@app.get("/cleaning-schedules/day/{day}/", response_model=List[schemas.CleaningSchedule])
def read_cleaning_schedules_by_day(day: str, db: Session = Depends(get_db)):
    return crud.get_cleaning_schedules_by_day(db, day_of_week=day)

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
    return crud.create_cleaning_log(db=db, log=log)

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

# Простой эндпоинт для проверки работы API
@app.get("/")
def read_root():
    return {"message": "Добро пожаловать в API системы управления гостиницей InnControl"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 