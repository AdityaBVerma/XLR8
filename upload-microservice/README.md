Upload microservice

Base URL:

```bash
http://localhost:5000
```

---

#  UPLOAD ROUTES

## 1. Upload Document

**POST** `/upload/doc`

### Full URL

```bash
http://localhost:5000/upload/doc
```

### Headers

```http
Content-Type: multipart/form-data
Cookie: accessToken=JWT_TOKEN
x-user: {"_id":"user_id","email":"user@example.com","username":"john_doe","fullName":"John Doe"}
```

### Request Body (Form Data)

```bash
docs: <FILE>        // required (PDF file)
title: "My Doc"     // required
```

### Response (201)

```json
{
  "statusCode": 201,
  "data": {
    "_id": "doc_id",
    "title": "My Doc",
    "ownerId": "user_id",
    "docfile": {
      "url": "https://cloudinary-url",
      "public_id": "cloudinary_public_id"
    },
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  },
  "message": "Doc uploaded successfully"
}
```

---

## 2. Get Document by ID

**GET** `/upload/:docId`

### Full URL

```bash
http://localhost:5000/upload/{docId}
```

### Headers

```http
Cookie: accessToken=JWT_TOKEN
x-user: {"_id":"user_id"}
```

### Response (200)

```json
{
  "statusCode": 200,
  "data": {
    "_id": "doc_id",
    "title": "My Doc",
    "ownerId": "user_id",
    "docfile": {
      "url": "https://cloudinary-url",
      "public_id": "cloudinary_public_id"
    },
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  },
  "message": "Doc fetched successfully"
}
```

---

## 3. Delete Document

**DELETE** `/upload/:docId`

### Full URL

```bash
http://localhost:5000/upload/{docId}
```

### Headers

```http
Cookie: accessToken=JWT_TOKEN
x-user: {"_id":"user_id"}
```

### Response (200)

```json
{
  "statusCode": 200,
  "data": {},
  "message": "Doc deleted successfully"
}
```

---

# 🔑 GLOBAL RULES

### Required Headers (Protected Routes)

```http
Cookie: accessToken=JWT_TOKEN
x-user: USER_OBJECT_JSON
```

---

### Notes

* `x-user` header is injected by API Gateway (frontend should NOT manually set it)
* File upload must use `multipart/form-data`
* Only PDF files are expected (`upload.single("docs")`)
* Upload triggers:

  * Cloudinary storage
  * PDF parsing
  * Chunking
  * Embedding generation
  * Storage in PGVector

