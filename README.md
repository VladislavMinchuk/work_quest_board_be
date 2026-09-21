# 🚀 WorkQuest Board — Backend API & WebSockets

Операційний матричний контроль та командна звітність регламентного обліку первинних документів для 6 спеціалістів.

Бекенд побудовано на **Nest.js**, **WebSockets (Socket.IO)**, **Upstash Redis** та **JWT Auth**.

---

## 🛠 Технологічний стек

* **Фреймворк:** Nest.js (Node.js + TypeScript)
* **Real-time:** WebSockets (`@nestjs/websockets` + Socket.IO)
* **База даних / Стейт:** Upstash Redis (Хмарне Key-Value сховище)
* **Аутентифікація:** JWT (JSON Web Tokens) & Passport.js
* **Деплоймент:** Render / Koyeb / Docker

---

## 📋 Бізнес-логіка та Матриця

1. **Координатна система:** 48 Періодів (12 місяців × 4 тижні) × 6 Учасників (`p1`–`p6`). Всього 288 комірок.
2. **Асиметрія учасників:**
   * `p1`..`p4`: Працюють у двох локаціях (`ppd` та `field`), по 5 завдань у кожній.
   * `p5`: Тільки локація `ppd` (5 завдань).
   * `p6`: Тільки локація `ppd` (3 спеціальні завдання: `scrapping`, `menu_reqs`, `write_off_act`).
3. **Рольова модель (RBAC):**
   * **ADMIN:** Повний доступ до редагування та скидання борду.
   * **EDITOR (`p1`..`p6`):** Доступ тільки до власних комірок (блокування чужих дій на рівні сервера з поверненням 403 Forbidden).
   * **VIEWER:** Гостьовий аудит у режимі реального часу.

---

## ⚙️ Налаштування та Запуск

### 1. Клонування проєкту та встановлення залежностей

```bash
git clone <repository-url>
cd workquest-backend
npm install

📖 WorkQuest Board API Specification
Базовий URL сервера: https://<your-render-app>.onrender.com

Усі контролери вимагають авторизаційного заголовка Authorization: Bearer <accessToken>, окрім роуту входу.

🔑 1. Модуль Авторизації (Auth)
POST /auth/login
Авторизація користувача за email та захешованим паролем.

Аутентифікація: Публічний ендпоінт (токен не потрібен).

Запит (Body):

{
  "email": "p1@workquest.ua",
  "password": "Prod++tt+1"
}
Успішна відповідь (201 Created):

{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_p1",
    "name": "Олександр К.",
    "email": "p1@workquest.ua",
    "role": "editor",
    "participantId": "p1",
    "avatarColor": "from-emerald-500 to-teal-600",
    "avatarIcon": "Zap"
  }
}
Можливі помилки:

401 Unauthorized: "Невірний email або пароль"

📋 2. Модуль Борду (Board REST API)
GET /board
Отримання повного стану матриці борду з Redis.

Заголовки: Authorization: Bearer <accessToken>

Успішна відповідь (200 OK):
Об'єкт, де ключами є cellKey (формат {periodId}_{participantId}, наприклад 1.1_p1), а значенням — об'єкт даних комірки.

{
  "1.1_p1": {
    "periodId": "1.1",
    "participantId": "p1",
    "ppd": {
      "scrapping": "done",
      "invoices_breakdown": "in_progress",
      "report_card": "not_started"
    },
    "field": {
      "waybills": "collecting",
      "write_off_act": "not_started"
    },
    "updatedAt": "2026-09-20T10:44:47.000Z",
    "updatedBy": "user_p1"
  }
}
Можливі помилки:

401 Unauthorized: "Токен авторизації відсутній або має невірний формат" / "Недійсний або прострочений токен"

PATCH /board/task
Оновлення статусу конкретного завдання в комірці борду.

Заголовки: Authorization: Bearer <accessToken>

Запит (Body):

{
  "periodId": "1.1",
  "participantId": "p1",
  "location": "ppd",
  "taskKey": "scrapping",
  "value": "done"
}
Параметри та дозволені значення:

periodId (string): Період у форматі "місяць.тиждень" від "1.1" до "12.4". (Якщо передати "1.1_p1", суфікс відсічеться автоматично).

participantId (string): "p1" | "p2" | "p3" | "p4" | "p5" | "p6".

location (string): "ppd" | "field".

taskKey (string): Одне із стандартних завдань:

Для PPD/Field: "scrapping" | "invoices_breakdown" | "report_card" | "waybills" | "write_off_act".

value (string): Залежить від taskKey:

Для scrapping, invoices_breakdown, report_card: "not_started" | "in_progress" | "done"

Для waybills: "not_started" | "collecting" | "on_desk"

Для write_off_act: "not_started" | "in_progress" | "signed"

Успішна відповідь (200 OK):
Повертає оновлений об'єкт всієї комірки:

{
  "periodId": "1.1",
  "participantId": "p1",
  "ppd": {
    "scrapping": "done",
    "invoices_breakdown": "in_progress",
    "report_card": "not_started"
  },
  "field": {
    "waybills": "collecting",
    "write_off_act": "not_started"
  },
  "updatedAt": "2026-09-20T10:44:47.000Z",
  "updatedBy": "user_p1"
}
Можливі помилки:

400 Bad Request:

"Некоректний період: ... Очікується формат від 1.1 до 12.4"

"Неіснуючий participantId: ..."

"Учасник p5/p6 не має локації 'Поле'"

"Некоректне завдання (taskKey): ... Дозволені ключі: [...]"

"Некоректний статус '...' для завдання '...'. Дозволені значення: [...]"

401 Unauthorized: "Недійсний токен"

403 Forbidden: "Недостатньо прав для редагування картки іншого учасника" (якщо editor намагається змінити чужий participantId)

POST /board/seed-default
Ініціалізація або скидання борду до початкових дефолтних значень (288 комірок).

Заголовки: Authorization: Bearer <accessToken>

Доступ: Тільки для користувачів з роллю admin.

Body: Порожній об'єкт {}.

Успішна відповідь (201 Created):

{
  "message": "Борд успішно ініціалізовано початковими даними",
  "cellsCount": 288
}
Можливі помилки:

403 Forbidden: "Недостатньо прав (потрібна роль admin)"

⚡ 3. Real-time Інтерфейс (WebSockets / Socket.io)
URL для підключення: wss://<your-render-app>.onrender.com

Обов'язкові налаштування клієнта (Socket.io Client):

import { io } from 'socket.io-client';

const socket = io('https://<your-render-app>.onrender.com', {
  transports: ['websocket'], // Обов'язково для стійкості на Render
  auth: {
    token: accessToken // Передаємо токен авторизації при handshake
  }
});
📤 Події, які ВІДПРАВЛЯЄ КЛІЄНТ (Outgoing Events)
UPDATE_TASK
Відправка оновлення завдання в режимі реального часу.

socket.emit('UPDATE_TASK', {
  periodId: '1.1',
  participantId: 'p1',
  location: 'ppd',
  taskKey: 'scrapping',
  value: 'done'
});
📥 Події, які СЛУХАЄ КЛІЄНТ (Incoming Events)
1. TASK_UPDATED
Бродкаст-повідомлення усім підключеним клієнтам про те, що хтось оновив комірку борду.

socket.on('TASK_UPDATED', (data: { cellKey: string; cellData: CellData }) => {
  // Оновити стейт у React/Redux
});
2. BOARD_STATE
Отримання повного стану борду після успішного підключення до сокета.

socket.on('BOARD_STATE', (fullBoardState: Record<string, CellData>) => {
  // Заповнити початковий стейт борду в додатоку
});
3. BOARD_STATE
Обробка помилок WebSocket-аутентифікації або валідації.

socket.on('BOARD_STATE', (error: { status: string; message: string }) => {
  console.error('Помилка WebSocket:', error.message);
});