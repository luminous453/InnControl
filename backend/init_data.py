import sys
import os
from sqlalchemy.exc import SQLAlchemyError, IntegrityError

# Добавляем текущую директорию в путь для импорта модулей
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
import models
from models import CleaningSchedule, Employee

def create_demo_employees():
    """Создание демо-сотрудников, если их еще нет"""
    try:
        db = SessionLocal()
        
        # Проверяем, есть ли уже сотрудники
        existing_employees = db.query(Employee).count()
        if existing_employees > 0:
            print(f"В базе уже есть {existing_employees} сотрудников. Пропускаем создание.")
            return
        
        # Создаем демо-сотрудников
        employees = [
            {"employee_id": 1, "hotel_id": 1, "first_name": "Елена", "last_name": "Смирнова", "status": "Активен"},
            {"employee_id": 2, "hotel_id": 1, "first_name": "Иван", "last_name": "Петров", "status": "Активен"},
            {"employee_id": 3, "hotel_id": 1, "first_name": "Анна", "last_name": "Козлова", "status": "Активен"},
            {"employee_id": 4, "hotel_id": 1, "first_name": "Михаил", "last_name": "Иванов", "status": "Активен"},
            {"employee_id": 5, "hotel_id": 1, "first_name": "Ольга", "last_name": "Сидорова", "status": "Активен"}
        ]
        
        for emp_data in employees:
            employee = Employee(**emp_data)
            db.add(employee)
            
        db.commit()
        print(f"Создано {len(employees)} демо-сотрудников")
        
    except IntegrityError as e:
        db.rollback()
        print(f"Ошибка целостности данных: {e}")
    except SQLAlchemyError as e:
        db.rollback()
        print(f"Ошибка SQLAlchemy: {e}")
    except Exception as e:
        db.rollback()
        print(f"Непредвиденная ошибка: {e}")
    finally:
        db.close()

def create_demo_cleaning_schedules():
    """Создание демо-расписания уборок, если их еще нет"""
    try:
        db = SessionLocal()
        
        # Проверяем, есть ли уже расписания
        existing_schedules = db.query(CleaningSchedule).count()
        if existing_schedules > 0:
            print(f"В базе уже есть {existing_schedules} расписаний. Пропускаем создание.")
            return
        
        # Создаем демо-расписания
        schedules = [
            {"schedule_id": 1, "employee_id": 1, "floor": 1, "day_of_week": "Понедельник"},
            {"schedule_id": 2, "employee_id": 2, "floor": 2, "day_of_week": "Понедельник"},
            {"schedule_id": 3, "employee_id": 1, "floor": 3, "day_of_week": "Вторник"},
            {"schedule_id": 4, "employee_id": 3, "floor": 1, "day_of_week": "Среда"},
            {"schedule_id": 5, "employee_id": 2, "floor": 2, "day_of_week": "Среда"},
            {"schedule_id": 6, "employee_id": 3, "floor": 3, "day_of_week": "Четверг"},
            {"schedule_id": 7, "employee_id": 1, "floor": 1, "day_of_week": "Пятница"}
        ]
        
        for schedule_data in schedules:
            schedule = CleaningSchedule(**schedule_data)
            db.add(schedule)
            
        db.commit()
        print(f"Создано {len(schedules)} демо-расписаний уборок")
        
    except IntegrityError as e:
        db.rollback()
        print(f"Ошибка целостности данных: {e}")
    except SQLAlchemyError as e:
        db.rollback()
        print(f"Ошибка SQLAlchemy: {e}")
    except Exception as e:
        db.rollback()
        print(f"Непредвиденная ошибка: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    print("Инициализация демо-данных...")
    create_demo_employees()
    create_demo_cleaning_schedules()
    print("Инициализация завершена") 