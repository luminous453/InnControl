import requests
import json

def test_bookings_endpoint():
    print("Тестирование CORS для эндпоинта /bookings/")
    
    # URL бэкенд API
    url = "http://localhost:8000/bookings/"
    
    # Заголовки, имитирующие запрос с другого источника
    headers = {
        "Origin": "http://localhost:3000"
    }
    
    try:
        # Выполняем запрос
        response = requests.get(url, headers=headers)
        
        # Проверяем заголовки CORS в ответе
        cors_headers = {
            "Access-Control-Allow-Origin": response.headers.get("Access-Control-Allow-Origin"),
            "Access-Control-Allow-Methods": response.headers.get("Access-Control-Allow-Methods"),
            "Access-Control-Allow-Headers": response.headers.get("Access-Control-Allow-Headers")
        }
        
        print(f"Статус ответа: {response.status_code}")
        print("CORS заголовки:")
        for header, value in cors_headers.items():
            print(f"  {header}: {value}")
        
        # Проверка наличия обязательного заголовка CORS
        if cors_headers["Access-Control-Allow-Origin"]:
            print("\n✅ CORS настроен правильно!")
        else:
            print("\n❌ CORS не настроен! Отсутствует заголовок Access-Control-Allow-Origin")
        
        # Показываем начало ответа для проверки
        if response.status_code == 200:
            data = response.json()
            print(f"\nПолучено {len(data)} записей")
            if data:
                print("Пример первой записи:")
                print(json.dumps(data[0], indent=2, ensure_ascii=False))
    
    except requests.exceptions.ConnectionError:
        print("❌ Ошибка соединения. Убедитесь, что бэкенд сервер запущен.")
    except Exception as e:
        print(f"❌ Ошибка при выполнении запроса: {str(e)}")

if __name__ == "__main__":
    test_bookings_endpoint() 