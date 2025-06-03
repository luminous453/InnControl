from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import date, datetime

# Пользователи (для авторизации)
class UserBase(BaseModel):
    username: str
    email: Optional[str] = None
    is_active: bool = True
    is_admin: bool = False

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# Схемы для гостиниц
class HotelBase(BaseModel):
    name: str
    total_rooms: int

class HotelCreate(HotelBase):
    pass

class Hotel(HotelBase):
    hotel_id: int

    class Config:
        from_attributes = True

# Схемы для типов номеров
class RoomTypeBase(BaseModel):
    name: str
    capacity: int
    price_per_night: float

class RoomTypeCreate(RoomTypeBase):
    pass

class RoomType(RoomTypeBase):
    type_id: int

    class Config:
        from_attributes = True

# Схемы для номеров
class RoomBase(BaseModel):
    hotel_id: int
    type_id: int
    floor: int
    room_number: str
    status: str = "Свободен"

class RoomCreate(RoomBase):
    pass

class Room(RoomBase):
    room_id: int

    class Config:
        from_attributes = True

class RoomWithDetails(Room):
    hotel: Hotel
    room_type: RoomType

# Схемы для клиентов
class ClientBase(BaseModel):
    first_name: str
    last_name: str
    passport_number: str
    city: str

class ClientCreate(ClientBase):
    pass

class Client(ClientBase):
    client_id: int

    class Config:
        from_attributes = True

# Схемы для бронирований
class BookingBase(BaseModel):
    room_id: int
    client_id: int
    check_in_date: date
    check_out_date: date
    status: str = "Подтверждено"

class BookingCreate(BookingBase):
    pass

class Booking(BookingBase):
    booking_id: int

    class Config:
        from_attributes = True

class BookingWithDetails(Booking):
    room: Room
    client: Client

class BookingStatusUpdate(BaseModel):
    status: str

# Схемы для сотрудников
class EmployeeBase(BaseModel):
    hotel_id: int
    first_name: str
    last_name: str
    status: str = "Активен"

class EmployeeCreate(EmployeeBase):
    pass

class Employee(EmployeeBase):
    employee_id: int

    class Config:
        from_attributes = True

class EmployeeStatusUpdate(BaseModel):
    status: str

# Схемы для расписания уборок
class CleaningScheduleBase(BaseModel):
    employee_id: int
    floor: int
    day_of_week: str

class CleaningScheduleCreate(CleaningScheduleBase):
    pass

class CleaningSchedule(CleaningScheduleBase):
    schedule_id: int

    class Config:
        from_attributes = True

class CleaningScheduleWithDetails(CleaningSchedule):
    employee: Employee

# Схемы для журнала уборок
class CleaningLogBase(BaseModel):
    floor_id: int
    employee_id: int
    cleaning_date: date
    status: Optional[str] = "Не начата"

class CleaningLogCreate(CleaningLogBase):
    pass

class CleaningLog(CleaningLogBase):
    log_id: int

    class Config:
        from_attributes = True

class CleaningLogWithDetails(CleaningLog):
    employee: Employee

class CleaningLogStatusUpdate(BaseModel):
    status: str

class RoomStatusUpdate(BaseModel):
    status: str 