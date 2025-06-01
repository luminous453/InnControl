from database import SessionLocal
from models import Hotel

def check_hotels():
    db = SessionLocal()
    try:
        hotels = db.query(Hotel).all()
        if hotels:
            print(f"Найдено гостиниц: {len(hotels)}")
            for hotel in hotels:
                print(f"ID: {hotel.hotel_id}, Название: {hotel.name}, Номеров: {hotel.total_rooms}")
        else:
            print("В базе данных нет гостиниц")
    finally:
        db.close()

if __name__ == "__main__":
    check_hotels() 