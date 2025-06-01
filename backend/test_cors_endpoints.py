from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn

app = FastAPI(title="CORS Test API")

# Явно указываем все разрешенные источники
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "*"
]

# Настройка CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    max_age=600,  # Кэширование preflight на 10 минут
)

@app.get("/")
def read_root():
    return {"message": "CORS test server is running"}

@app.get("/test")
def test_endpoint():
    return {"cors": "enabled", "status": "ok"}

@app.get("/bookings")
def mock_bookings():
    return [
        {"booking_id": 1, "room_id": 101, "client_id": 1, "status": "Подтверждено"},
        {"booking_id": 2, "room_id": 102, "client_id": 2, "status": "Отменено"}
    ]

@app.options("/{full_path:path}")
async def options_handler(request: Request, full_path: str):
    response = JSONResponse({"detail": "CORS preflight response"})
    return response

if __name__ == "__main__":
    print("Запуск тестового CORS сервера на порту 8001...")
    uvicorn.run("test_cors_endpoints:app", host="0.0.0.0", port=8001, reload=True) 