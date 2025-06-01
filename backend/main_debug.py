from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import models, schemas, crud
from database import engine, SessionLocal
import uvicorn
import logging

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("inncontrol")
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
    finally:
        db.close()

# Вызываем функцию при запуске сервера
create_default_hotel()

app = FastAPI(title="InnControl API", description="API для системы администрирования гостиниц")

# Логирование CORS заголовков
@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"Входящий запрос: {request.method} {request.url}")
    logger.info(f"Заголовки запроса: {request.headers}")
    
    response = await call_next(request)
    
    logger.info(f"Статус ответа: {response.status_code}")
    logger.info(f"Заголовки ответа: {response.headers}")
    
    return response

# Настройка CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Разрешаем запросы с любого источника для тестирования
    allow_credentials=False,  # Отключаем credentials для работы с wildcard origins
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

logger.info("CORS middleware настроен")

# Зависимость для получения сессии БД
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Простой эндпоинт для проверки CORS
@app.get("/cors-test/")
def test_cors():
    logger.info("Вызван тестовый эндпоинт /cors-test/")
    return {"message": "CORS test successful"}

# Эндпоинты для бронирований
@app.get("/bookings/", response_model=List[schemas.Booking])
def read_bookings(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    logger.info(f"Получение списка бронирований с параметрами: skip={skip}, limit={limit}")
    try:
        bookings = crud.get_bookings(db, skip=skip, limit=limit)
        logger.info(f"Найдено {len(bookings)} бронирований")
        return bookings
    except Exception as e:
        logger.error(f"Ошибка при получении бронирований: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Ошибка сервера: {str(e)}")

if __name__ == "__main__":
    logger.info("Запуск сервера...")
    uvicorn.run("main_debug:app", host="0.0.0.0", port=8000, reload=True) 