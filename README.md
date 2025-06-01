# InnControl - Система администрирования гостиниц

Проект представляет собой веб-приложение для администрирования гостиницы. Система позволяет управлять номерным фондом, бронированиями, клиентами, персоналом и расписанием уборок.

## Структура проекта

Проект разделен на две части:
- **frontend** - клиентская часть, разработанная на Next.js с использованием React и Tailwind CSS
- **backend** - серверная часть, разработанная на FastAPI с использованием SQLAlchemy для работы с базой данных PostgreSQL

## Технологии

### Frontend
- Next.js 14
- React 18
- Tailwind CSS
- TypeScript
- Axios для HTTP-запросов

### Backend
- FastAPI
- SQLAlchemy
- PostgreSQL
- Python 3.9+

## Установка и запуск

### Подготовка базы данных
1. Установите и настройте PostgreSQL
2. Создайте базу данных с именем `inncontrol`
   ```sql
   CREATE DATABASE inncontrol;
   ```

### Запуск Backend
1. Перейдите в директорию backend
   ```bash
   cd backend
   ```

2. Создайте и активируйте виртуальное окружение Python
   ```bash
   python -m venv venv
   # Windows
   venv\Scripts\activate
   # Linux/Mac
   source venv/bin/activate
   ```

3. Установите зависимости
   ```bash
   pip install -r requirements.txt
   ```

4. Создайте файл .env в директории backend со следующим содержимым:
   ```
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=postgres
   POSTGRES_SERVER=PostgreSQL 17
   POSTGRES_PORT=5432
   POSTGRES_DB=inncontrol
   SECRET_KEY=09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   ```


5. Запустите сервер
   ```bash
   python main.py
   ```
   Сервер будет доступен по адресу http://localhost:8000

### Запуск Frontend
1. Перейдите в директорию frontend
   ```bash
   cd frontend
   ```

2. Установите зависимости
   ```bash
   npm install
   ```

3. Запустите сервер разработки
   ```bash
   npm run dev
   ```
   Клиентское приложение будет доступно по адресу http://localhost:3000

## Тестовый доступ

Для входа в систему используйте:
- Логин: `admin`
- Пароль: `admin`

## Функциональность

- Управление номерным фондом (добавление, редактирование, просмотр номеров)
- Управление бронированиями (создание, редактирование, отмена бронирований)
- Управление клиентами (регистрация, поиск, просмотр истории)
- Управление персоналом (добавление, увольнение, назначение обязанностей)
- Управление уборками (расписание, журнал выполненных работ)
- Формирование отчетов (заполняемость, доходность) 