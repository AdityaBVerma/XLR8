
Base URL:

```bash
http://localhost:5000
```

---

# USER ROUTES

## 1. Register User

**POST** `/user/register/`

### Full URL

```bash
http://localhost:5000/user/register/
```

### Headers

```http
Content-Type: application/json
```

### Request Body

```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "fullName": "John Doe",
  "password": "123456"
}
```

### Response (201)

```json
{
  "statusCode": 201,
  "data": {
    "_id": "user_id",
    "username": "john_doe",
    "email": "john@example.com",
    "fullName": "John Doe",
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  },
  "message": "User created successfully"
}
```

---

## 2. Login User

**POST** `/user/login/`

### Full URL

```bash
http://localhost:5000/user/login/
```

### Headers

```http
Content-Type: application/json
```

### Request Body

```json
{
  "email": "john@example.com",
  "password": "123456"
}
```

### Cookies Set

```http
Set-Cookie: accessToken=JWT_TOKEN; HttpOnly; Secure
Set-Cookie: refreshToken=JWT_TOKEN; HttpOnly; Secure
```

### Response (200)

```json
{
  "statusCode": 200,
  "data": {
    "user": {
      "_id": "user_id",
      "username": "john_doe",
      "email": "john@example.com",
      "fullName": "John Doe"
    },
    "accessToken": "JWT_TOKEN",
    "refreshToken": "JWT_TOKEN"
  },
  "message": "User logged in successfully"
}
```

---

## 3. Logout User

**POST** `/user/logout/`

### Full URL

```bash
http://localhost:5000/user/logout/
```

### Headers

```http
Cookie: accessToken=JWT_TOKEN; refreshToken=JWT_TOKEN
```

### Cookies Cleared

```http
Set-Cookie: accessToken=; HttpOnly; Secure
Set-Cookie: refreshToken=; HttpOnly; Secure
```

### Response (200)

```json
{
  "statusCode": 200,
  "data": {},
  "message": "User logged out"
}
```

---

## 4. Refresh Token

**POST** `/user/refresh/`

### Full URL

```bash
http://localhost:5000/user/refresh/
```

### Headers

```http
Cookie: refreshToken=JWT_TOKEN
```

### Cookies Set

```http
Set-Cookie: accessToken=NEW_JWT_TOKEN; HttpOnly; Secure
Set-Cookie: refreshToken=NEW_JWT_TOKEN; HttpOnly; Secure
```

### Response (200)

```json
{
  "statusCode": 200,
  "data": {
    "accessToken": "NEW_JWT_TOKEN",
    "refreshToken": "NEW_JWT_TOKEN"
  },
  "message": "Access token refreshed"
}
```

---

## 5. Get Current User

**GET** `/user/current-user/`

### Full URL

```bash
http://localhost:5000/user/current-user/
```

### Headers

```http
Cookie: accessToken=JWT_TOKEN
```

### Response (200)

```json
{
  "statusCode": 200,
  "data": {
    "_id": "user_id",
    "username": "john_doe",
    "email": "john@example.com",
    "fullName": "John Doe"
  },
  "message": "User fetched successfully"
}
```

---

## 6. Change Password

**PATCH** `/user/change-password/`

### Full URL

```bash
http://localhost:5000/user/change-password/
```

### Headers

```http
Content-Type: application/json
Cookie: accessToken=JWT_TOKEN
```

### Request Body

```json
{
  "oldPassword": "123456",
  "newPassword": "new_password"
}
```

### Response (200)

```json
{
  "statusCode": 200,
  "data": {},
  "message": "Password changed successfully"
}
```

---

## 7. Update Account

**PATCH** `/user/update-account/`

### Full URL

```bash
http://localhost:5000/user/update-account/
```

### Headers

```http
Content-Type: application/json
Cookie: accessToken=JWT_TOKEN
```

### Request Body

```json
{
  "fullName": "Updated Name",
  "email": "updated@example.com"
}
```

### Response (200)

```json
{
  "statusCode": 200,
  "data": {
    "_id": "user_id",
    "username": "john_doe",
    "email": "updated@example.com",
    "fullName": "Updated Name"
  },
  "message": "Account updated successfully"
}
```
