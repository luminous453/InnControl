import requests
import json

def test_cors_endpoint():
    print("Тестирование CORS для простого эндпоинта /cors-test/")
    
    # URL бэкенд API
    url = "http://localhost:8000/cors-test/"
    
    # Заголовки, имитирующие запрос с другого источника
    headers = {
        "Origin": "http://localhost:3000"
    }
    
    try:
        # Выполняем запрос
        response = requests.get(url, headers=headers)
        
        # Проверяем заголовки CORS в ответе
        print(f"Статус ответа: {response.status_code}")
        print("Все заголовки ответа:")
        
        for header, value in response.headers.items():
            print(f"  {header}: {value}")
        
        # Проверка наличия обязательного заголовка CORS
        if "Access-Control-Allow-Origin" in response.headers:
            print("\n✅ CORS настроен правильно!")
        else:
            print("\n❌ CORS не настроен! Отсутствует заголовок Access-Control-Allow-Origin")
        
        # Показываем тело ответа для проверки
        if response.status_code == 200:
            data = response.json()
            print("\nТело ответа:")
            print(json.dumps(data, indent=2, ensure_ascii=False))
    
    except requests.exceptions.ConnectionError:
        print("❌ Ошибка соединения. Убедитесь, что бэкенд сервер запущен.")
    except Exception as e:
        print(f"❌ Ошибка при выполнении запроса: {str(e)}")

if __name__ == "__main__":
    test_cors_endpoint() 