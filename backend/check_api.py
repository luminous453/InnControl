import requests

def check_api():
    try:
        print("Проверка API...")
        base_url = "http://localhost:8000"
        
        # Проверка доступности API
        print("\nПроверка доступности API:")
        response = requests.get(f"{base_url}/")
        print(f"Статус: {response.status_code}")
        
        # Проверка получения гостиниц
        print("\nПроверка получения гостиниц:")
        response = requests.get(f"{base_url}/hotels/")
        print(f"Статус: {response.status_code}")
        hotels = response.json()
        print(f"Получено {len(hotels)} гостиниц:")
        for hotel in hotels:
            print(f"ID: {hotel['hotel_id']}, Имя: {hotel.get('name', 'Нет имени')}, Номеров: {hotel.get('total_rooms', 0)}")
        
        # Если есть гостиницы, проверим статистику для первой
        if hotels:
            hotel_id = hotels[0]['hotel_id']
            print(f"\nПроверка статистики для гостиницы ID={hotel_id}:")
            
            # Статистика по номерам
            print("\n- Номера гостиницы:")
            response = requests.get(f"{base_url}/hotels/{hotel_id}/rooms/")
            if response.status_code == 200:
                rooms = response.json()
                print(f"  Получено {len(rooms)} номеров")
                for room in rooms[:3]:  # Показываем только первые 3 для краткости
                    print(f"  ID: {room.get('room_id')}, Номер: {room.get('room_number')}, Статус: {room.get('status')}")
            else:
                print(f"  Ошибка при получении номеров: {response.status_code}")
            
            # Статистика по сотрудникам
            print("\n- Сотрудники гостиницы:")
            response = requests.get(f"{base_url}/hotels/{hotel_id}/employees/")
            if response.status_code == 200:
                employees = response.json()
                print(f"  Получено {len(employees)} сотрудников")
                for employee in employees[:3]:  # Показываем только первые 3 для краткости
                    print(f"  ID: {employee.get('employee_id')}, Имя: {employee.get('first_name')} {employee.get('last_name')}")
            else:
                print(f"  Ошибка при получении сотрудников: {response.status_code}")
        
        # Проверка доступа к бронированиям
        print("\nПроверка доступа к бронированиям:")
        response = requests.get(f"{base_url}/bookings/")
        if response.status_code == 200:
            bookings = response.json()
            print(f"Получено {len(bookings)} бронирований")
        else:
            print(f"Ошибка при получении бронирований: {response.status_code}")
        
        # Проверка доступа к клиентам
        print("\nПроверка доступа к клиентам:")
        response = requests.get(f"{base_url}/clients/")
        if response.status_code == 200:
            clients = response.json()
            print(f"Получено {len(clients)} клиентов")
        else:
            print(f"Ошибка при получении клиентов: {response.status_code}")
        
        print("\nПроверка API завершена.")
        
    except requests.RequestException as e:
        print(f"Ошибка при обращении к API: {e}")
    except Exception as e:
        print(f"Общая ошибка: {e}")

if __name__ == "__main__":
    check_api() 