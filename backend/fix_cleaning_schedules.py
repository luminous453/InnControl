import sys
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import SQLAlchemyError

# Добавляем текущую директорию в путь для импорта модулей
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import engine, SessionLocal
import models
from models import CleaningSchedule, Employee

def fix_cleaning_schedules():
    """
    Функция для проверки и исправления данных в таблице cleaning_schedules.
    1. Удаляет записи с NULL в employee_id
    2. Проверяет существование сотрудников для каждой записи
    """
    try:
        # Создаем сессию
        db = SessionLocal()
        
        print("Начинаем проверку и исправление таблицы cleaning_schedules...")
        
        # Находим записи с NULL в employee_id
        null_records = db.query(CleaningSchedule).filter(CleaningSchedule.employee_id.is_(None)).all()
        print(f"Найдено {len(null_records)} записей с NULL в employee_id")
        
        if null_records:
            # Удаляем записи с NULL в employee_id
            for record in null_records:
                print(f"Удаление записи с ID={record.schedule_id}, floor={record.floor}, day={record.day_of_week}")
                db.delete(record)
            
            db.commit()
            print("Записи с NULL в employee_id удалены")
        
        # Проверяем существование сотрудников для каждой записи
        all_schedules = db.query(CleaningSchedule).all()
        invalid_records = []
        
        for schedule in all_schedules:
            employee = db.query(Employee).filter(Employee.employee_id == schedule.employee_id).first()
            if not employee:
                print(f"Сотрудник с ID={schedule.employee_id} не найден для записи schedule_id={schedule.schedule_id}")
                invalid_records.append(schedule)
        
        if invalid_records:
            print(f"Найдено {len(invalid_records)} записей с несуществующими сотрудниками")
            for record in invalid_records:
                print(f"Удаление записи с ID={record.schedule_id}, employee_id={record.employee_id}")
                db.delete(record)
            
            db.commit()
            print("Записи с несуществующими сотрудниками удалены")
        
        print("Проверка и исправление завершены успешно")
        
    except SQLAlchemyError as e:
        print(f"Ошибка SQLAlchemy: {e}")
    except Exception as e:
        print(f"Непредвиденная ошибка: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    fix_cleaning_schedules() 