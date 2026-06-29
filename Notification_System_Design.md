# Notification System Design

# Stage 1

## Objective

Design REST APIs for a Campus Notification Platform where students receive notifications related to Placements, Events, and Results.

---

## Core Actions

- Student Login
- Fetch Notifications
- Fetch Unread Notifications
- Mark Notification as Read
- Mark All Notifications as Read
- Create Notification (Admin)
- Broadcast Notification to All Students
- Delete Notification
- Real-time Notification Delivery

---

# API Design

## 1. Student Login

**POST** `/api/v1/auth/login`

### Headers

```http
Content-Type: application/json
```

### Request

```json
{
  "email": "student@example.com",
  "password": "password123"
}
```

### Response

```json
{
  "token": "jwt_token",
  "studentId": 1042,
  "name": "John Doe"
}
```

---

## 2. Get All Notifications

**GET** `/api/v1/notifications`

### Headers

```http
Authorization: Bearer <JWT>
```

### Response

```json
[
  {
    "notificationId": 1,
    "title": "Placement Drive",
    "message": "Google hiring for SDE",
    "notificationType": "Placement",
    "isRead": false,
    "createdAt": "2026-06-29T09:00:00Z"
  }
]
```

---

## 3. Get Unread Notifications

**GET** `/api/v1/notifications/unread`

### Headers

```http
Authorization: Bearer <JWT>
```

### Response

```json
[
  {
    "notificationId": 3,
    "title": "Semester Result",
    "message": "Results have been published.",
    "notificationType": "Result",
    "isRead": false
  }
]
```

---

## 4. Mark Notification as Read

**PATCH** `/api/v1/notifications/{notificationId}/read`

### Headers

```http
Authorization: Bearer <JWT>
```

### Response

```json
{
  "message": "Notification marked as read."
}
```

---

## 5. Mark All Notifications as Read

**PATCH** `/api/v1/notifications/read-all`

### Response

```json
{
  "message": "All notifications marked as read."
}
```

---

## 6. Create Notification (Admin)

**POST** `/api/v1/notifications`

### Headers

```http
Authorization: Bearer <JWT>
Content-Type: application/json
```

### Request

```json
{
  "title": "Amazon Placement Drive",
  "message": "Drive starts tomorrow.",
  "notificationType": "Placement",
  "recipientIds": [101,102,103]
}
```

### Response

```json
{
  "notificationId": 501,
  "status": "Created"
}
```

---

## 7. Broadcast Notification

**POST** `/api/v1/notifications/broadcast`

### Request

```json
{
  "title": "Holiday Notice",
  "message": "College will remain closed tomorrow.",
  "notificationType": "Event"
}
```

### Response

```json
{
  "message": "Notification sent successfully."
}
```

---

## 8. Delete Notification

**DELETE** `/api/v1/notifications/{notificationId}`

### Response

```json
{
  "message": "Notification deleted successfully."
}
```

---

# Real-Time Notification Mechanism

The application will use **WebSockets (Socket.IO)** for instant notification delivery.

### Flow

1. Student logs in and authenticates using JWT.
2. Client establishes a WebSocket connection.
3. Server maps the student's socket connection.
4. Whenever an admin creates a notification:
   - Save the notification in the database.
   - Push it instantly through the WebSocket connection.
5. If a student is offline, the notification is stored in the database and fetched when they log in later.