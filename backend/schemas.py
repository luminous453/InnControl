from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import date, datetime

# Схемы для Hotel
class HotelBase(BaseModel):
    name: str
    total_rooms: int

class HotelCreate(HotelBase):
    pass

class Hotel(HotelBase):
    hotel_id: int

    class Config:
        orm_mode = True

# Схемы для RoomType
class RoomTypeBase(BaseModel):
    name: str
    capacity: int
    price_per_night: float

class RoomTypeCreate(RoomTypeBase):
    pass

class RoomType(RoomTypeBase):
    type_id: int

    class Config:
        orm_mode = True

# Схемы для Room
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
        orm_mode = True

class RoomWithDetails(Room):
    room_type: RoomType
    hotel: Hotel

    class Config:
        orm_mode = True

# Схемы для Client
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
        orm_mode = True

# Схемы для Booking
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
        orm_mode = True

class BookingWithDetails(Booking):
    client: Client
    room: Room

    class Config:
        orm_mode = True

# Схемы для Employee
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
        orm_mode = True

# Схемы для CleaningSchedule
class CleaningScheduleBase(BaseModel):
    employee_id: int
    floor: int
    day_of_week: str

class CleaningScheduleCreate(CleaningScheduleBase):
    pass

class CleaningSchedule(CleaningScheduleBase):
    schedule_id: int

    class Config:
        orm_mode = True

class CleaningScheduleWithDetails(CleaningSchedule):
    employee: Employee

    class Config:
        orm_mode = True

# Схемы для CleaningLog
class CleaningLogBase(BaseModel):
    room_id: int
    employee_id: int
    cleaning_date: date = Field(default_factory=date.today)

class CleaningLogCreate(CleaningLogBase):
    pass

class CleaningLog(CleaningLogBase):
    log_id: int

    class Config:
        orm_mode = True

class CleaningLogWithDetails(CleaningLog):
    room: Room
    employee: Employee

    class Config:
        orm_mode = True

# Схемы для User (авторизация)
class UserBase(BaseModel):
    username: str
    email: str
    is_active: bool = True
    is_admin: bool = False

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int

    class Config:
        orm_mode = True

# Схема для токена
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None 