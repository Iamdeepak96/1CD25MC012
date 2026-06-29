# Notification System Design

# Stage 1

## Objective

The notification system should allow students to receive updates related to placements, events, and results. It should also allow administrators to create and manage notifications. Students should receive notifications instantly whenever possible.

## Core APIs

### 1. Login

**POST** `/api/auth/login`

**Request**

```json
{
  "email": "student@example.com",
  "password": "password123"
}
```

**Response**

```json
{
  "token": "JWT_TOKEN",
  "studentId": 1042,
  "name": "John Doe"
}
```

---

### 2. Get all notifications

**GET** `/api/notifications`

**Headers**

```
Authorization: Bearer <token>
```

**Response**

```json
[
  {
    "notificationId": 1,
    "title": "Placement Drive",
    "message": "Amazon hiring for SDE role",
    "notificationType": "Placement",
    "isRead": false,
    "createdAt": "2026-06-29T09:30:00Z"
  }
]
```

---

### 3. Get unread notifications

**GET** `/api/notifications/unread`

Returns only the unread notifications of the logged-in student.

---

### 4. Mark notification as read

**PATCH** `/api/notifications/{notificationId}/read`

**Response**

```json
{
  "message": "Notification marked as read"
}
```

---

### 5. Mark all notifications as read

**PATCH** `/api/notifications/read-all`

Marks every unread notification of the current student as read.

---

### 6. Create notification

**POST** `/api/notifications`

**Request**

```json
{
  "title": "Placement Update",
  "message": "Microsoft drive starts tomorrow.",
  "notificationType": "Placement",
  "recipientIds": [101,102,103]
}
```

---

### 7. Notify all students

**POST** `/api/notifications/broadcast`

This endpoint sends the same notification to every student.

---

### 8. Delete notification

**DELETE** `/api/notifications/{notificationId}`

Used only by administrators to remove notifications if required.

---

## Real-time Notifications

For instant delivery, I would use **WebSockets (Socket.IO)**.

Whenever an administrator creates a notification, it is first stored in the database and then pushed to all connected students through WebSockets. If a student is offline, the notification remains stored in the database and will be displayed the next time they log in.

---

# Stage 2

## Database Choice

I would choose **PostgreSQL** for this application because the data is highly structured and relationships between students and notifications are important. PostgreSQL also provides good indexing, reliable transactions, and performs well even when handling large datasets.

---

## Database Schema

### Students

| Column       | Type        |
| ------------ | ----------- |
| studentId    | BIGINT (PK) |
| name         | VARCHAR     |
| email        | VARCHAR     |
| passwordHash | VARCHAR     |

### Notifications

| Column           | Type                            |
| ---------------- | ------------------------------- |
| notificationId   | BIGINT (PK)                     |
| title            | VARCHAR                         |
| message          | TEXT                            |
| notificationType | ENUM (Placement, Event, Result) |
| createdAt        | TIMESTAMP                       |

### StudentNotifications

| Column         | Type        |
| -------------- | ----------- |
| id             | BIGINT (PK) |
| studentId      | BIGINT (FK) |
| notificationId | BIGINT (FK) |
| isRead         | BOOLEAN     |

This separate mapping table allows the same notification to be delivered to multiple students while maintaining each student's read status independently.

---

## Challenges as Data Grows

As the number of students and notifications increases, queries may become slower and database storage requirements will increase. Sending notifications to thousands of students simultaneously can also increase server load.

---

## Possible Improvements

* Create indexes on frequently searched columns such as `studentId`, `notificationId`, and `createdAt`.
* Fetch notifications using pagination instead of loading everything at once.
* Archive very old notifications.
* Use Redis to cache frequently accessed data.
* Use a message queue for sending bulk notifications without blocking the application.

---

## Sample SQL Queries

### Fetch all notifications of a student

```sql
SELECT n.notificationId,
       n.title,
       n.message,
       n.notificationType,
       sn.isRead,
       n.createdAt
FROM StudentNotifications sn
JOIN Notifications n
ON sn.notificationId = n.notificationId
WHERE sn.studentId = 1042
ORDER BY n.createdAt DESC;
```

### Fetch unread notifications

```sql
SELECT n.*
FROM StudentNotifications sn
JOIN Notifications n
ON sn.notificationId = n.notificationId
WHERE sn.studentId = 1042
AND sn.isRead = FALSE;
```

### Mark a notification as read

```sql
UPDATE StudentNotifications
SET isRead = TRUE
WHERE studentId = 1042
AND notificationId = 15;
```

### Create a notification

```sql
INSERT INTO Notifications
(title, message, notificationType, createdAt)
VALUES
('Placement Update',
 'Google hiring for Software Engineer.',
 'Placement',
 NOW());
```
# Stage 3

## Query Analysis

The given query is:

```sql
SELECT *
FROM notifications
WHERE studentId = 1042
AND isRead = false
ORDER BY createdAt DESC;
```

The query is correct if the `studentId` and `isRead` fields are present in the `notifications` table. However, in the schema designed earlier, the read status is maintained in the `StudentNotifications` table. In that case, the query should retrieve data using a JOIN.

### Why is the query slow?

With around 5 million notifications, the database has to scan a large number of records if proper indexes are not available. Sorting the results by `createdAt` also becomes expensive when many rows match the condition.

### Improvements

* Create a composite index on `(studentId, isRead, createdAt DESC)`.
* Fetch notifications using pagination (`LIMIT` and `OFFSET`).
* Archive old notifications if they are no longer required.

An optimized query would be:

```sql
SELECT n.*
FROM StudentNotifications sn
JOIN Notifications n
ON sn.notificationId = n.notificationId
WHERE sn.studentId = 1042
AND sn.isRead = FALSE
ORDER BY n.createdAt DESC
LIMIT 20;
```

### Should every column be indexed?

No.

Adding indexes on every column is not a good practice because indexes consume additional storage and slow down INSERT, UPDATE, and DELETE operations. Indexes should only be created on columns that are frequently used in filtering, sorting, or joins.

### Query to find students who received Placement notifications in the last 7 days

```sql
SELECT DISTINCT s.studentId,
       s.name,
       s.email
FROM Students s
JOIN StudentNotifications sn
ON s.studentId = sn.studentId
JOIN Notifications n
ON sn.notificationId = n.notificationId
WHERE n.notificationType = 'Placement'
AND n.createdAt >= NOW() - INTERVAL '7 days';
```
# Stage 4

## Improving Notification Performance

Currently, notifications are fetched from the database every time a student loads a page. As the number of users grows, this creates unnecessary load on the database and increases response time.

### Solution 1: Use Redis Cache

Store recently accessed notifications in Redis. When a student opens the application, the server first checks Redis. If the data is available, it is returned immediately without querying the database.

**Pros**

* Very fast response time
* Reduces database load

**Cons**

* Extra memory usage
* Cache invalidation needs to be handled properly

---

### Solution 2: Pagination

Instead of loading every notification, return only a limited number (for example, 20 notifications per request).

**Pros**

* Smaller queries
* Faster page loading
* Lower database load

**Cons**

* Requires multiple API calls to load older notifications

---

### Solution 3: Real-Time Notifications

Use WebSockets (Socket.IO) so new notifications are pushed directly to connected users instead of repeatedly requesting them from the server.

**Pros**

* Instant notification delivery
* Fewer unnecessary API requests

**Cons**

* Requires maintaining active socket connections
* Slightly higher server memory usage

---

### Solution 4: Database Indexing

Create indexes on commonly searched columns such as `studentId`, `isRead`, and `createdAt`.

**Pros**

* Faster search operations
* Improved query performance

**Cons**

* Additional storage
* Slightly slower INSERT and UPDATE operations

---

## Recommended Approach

I would combine:

* Redis for caching
* WebSockets for real-time delivery
* Pagination for API responses
* Proper database indexing

This combination provides good performance while keeping the system scalable as the number of students and notifications increases.
# Stage 5

## Problems with the Given Approach

The proposed pseudocode sends notifications one student at a time. This approach has several drawbacks:

* Sending emails sequentially is slow for a large number of students.
* If the process stops midway, some students may never receive the notification.
* There is no retry mechanism if email delivery fails.
* The application remains busy until all notifications are processed.

## What if Email Fails for 200 Students?

The failed emails should not be ignored. Instead, they should be added to a retry queue. The system can automatically retry sending those emails after a short delay. If the retries continue to fail, the failures should be logged so that an administrator can investigate.

## Better Design

I would separate the work into two parts:

1. Save all notifications in the database.
2. Send emails and in-app notifications asynchronously using a message queue (RabbitMQ, Kafka, or a similar queue).

This makes the system faster because the API can respond immediately while background workers handle notification delivery.

## Should Saving to the Database and Sending Emails Happen Together?

No.

Saving the notification and sending emails should be independent operations.

The notification should first be stored successfully in the database. Once stored, a background worker can read the queued tasks and send emails. This ensures that notifications are not lost even if the email service is temporarily unavailable.

## Improved Pseudocode

```text
function notifyAllStudents(message):

    notificationId = saveNotification(message)

    for each student in studentList:
        addToQueue(student.id, notificationId)

worker():

    while queue is not empty:

        task = getNextTask()

        saveStudentNotification(task.studentId, task.notificationId)

        try:
            sendEmail(task.studentId)
            sendInAppNotification(task.studentId)
        catch:
            retry(task)
```

## Benefits

* Faster response to the user.
* Reliable delivery using retries.
* Scales well for thousands of students.
* Easier to monitor and maintain.
