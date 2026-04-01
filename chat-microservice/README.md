# Chat Microservice

Base URL:

```bash id="t3s1ux"
http://localhost:5000/chat
```

⚠️ All routes are protected (JWT + `x-user` injected by API Gateway)

---

# 💬 CHAT ROUTES

## 1. Create Chat

**POST** `/chat/`

### Full URL

```bash id="o2djpi"
http://localhost:5000/chat/
```

### Headers

```http id="8n6h9u"
Content-Type: application/json
Cookie: accessToken=JWT_TOKEN
x-user: {"_id":"user_id"}
```

### Request Body

```json id="t3n1ks"
{
  "title": "My Chat"
}
```

### Response (201)

```json id="sx3k7b"
{
  "statusCode": 201,
  "data": {
    "_id": "chat_id",
    "userId": "user_id",
    "title": "My Chat",
    "lastMessageAt": "timestamp",
    "metadata": {},
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  },
  "message": "Chat created successfully"
}
```

---

## 2. Get All Chats

**GET** `/chat/`

### Full URL

```bash id="r6m8hx"
http://localhost:5000/chat/
```

### Headers

```http id="d8u4ln"
Cookie: accessToken=JWT_TOKEN
x-user: {"_id":"user_id"}
```

### Response (200)

```json id="8t3xq1"
{
  "statusCode": 200,
  "data": [
    {
      "_id": "chat_id",
      "userId": "user_id",
      "title": "My Chat",
      "lastMessageAt": "timestamp",
      "metadata": {}
    }
  ],
  "message": "Chats fetched successfully"
}
```

---

## 3. Get Chat by ID

**GET** `/chat/:chatId`

### Full URL

```bash id="8l1vpm"
http://localhost:5000/chat/{chatId}
```

### Headers

```http id="n1x0ro"
Cookie: accessToken=JWT_TOKEN
x-user: {"_id":"user_id"}
```

### Response (200)

```json id="y6ztcc"
{
  "statusCode": 200,
  "data": {
    "_id": "chat_id",
    "userId": "user_id",
    "title": "My Chat",
    "lastMessageAt": "timestamp",
    "metadata": {}
  },
  "message": "Chat fetched successfully"
}
```

---

## 4. Ask Chat (Streaming - Core Endpoint)

**POST** `/chat/:chatId/ask`

### Full URL

```bash id="8v4l8r"
http://localhost:5000/chat/{chatId}/ask
```

### Headers

```http id="5rmw7g"
Content-Type: application/json
Cookie: accessToken=JWT_TOKEN
x-user: {"_id":"user_id"}
```

### Request Body

```json id="qzv93z"
{
  "content": "Explain Redis caching"
}
```

### Response (200)

**Type:** `text/event-stream`

### Stream Format

```text id="i9k3s2"
data: {"token":"Redis "}
data: {"token":"is "}
data: {"token":"an in-memory "}
data: {"token":"data store..."}
data: {"done":true}
```

---

## 5. Update Chat Title

**PATCH** `/chat/:chatId`

### Full URL

```bash id="tq2e6h"
http://localhost:5000/chat/{chatId}
```

### Headers

```http id="9r2b1o"
Content-Type: application/json
Cookie: accessToken=JWT_TOKEN
x-user: {"_id":"user_id"}
```

### Request Body

```json id="g7plc9"
{
  "title": "Updated Chat Title"
}
```

### Response (200)

```json id="d0l3kz"
{
  "statusCode": 200,
  "data": {
    "_id": "chat_id",
    "userId": "user_id",
    "title": "Updated Chat Title",
    "lastMessageAt": "timestamp"
  },
  "message": "Chat title updated successfully"
}
```

---

## 6. Delete Chat

**DELETE** `/chat/:chatId`

### Full URL

```bash id="6xhp2m"
http://localhost:5000/chat/{chatId}
```

### Headers

```http id="7dzl5a"
Cookie: accessToken=JWT_TOKEN
x-user: {"_id":"user_id"}
```

### Response (200)

```json id="jv7q0m"
{
  "statusCode": 200,
  "data": {},
  "message": "Chat deleted successfully"
}
```

---

# 🔑 GLOBAL RULES

### Required Headers

```http id="eqv4ks"
Cookie: accessToken=JWT_TOKEN
x-user: USER_OBJECT_JSON
```

---

### Notes

* `x-user` is injected by API Gateway (frontend should NOT send manually)
* `/ask` endpoint:

  * Streams response using **Server-Sent Events (SSE)**
  * Uses:

    * Message Service (chat history)
    * PGVector (RAG retrieval)
    * Gemini (LLM response)
* Chat is scoped per user (`userId` enforced)
