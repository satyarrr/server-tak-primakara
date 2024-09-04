Based on the provided `index.js` file, here is a detailed `README.md` for your GitHub repository:

---

# Certificate Management Backend

This repository contains the backend code for managing certificates, users, and related activities using Node.js, Express, and Supabase.

## Table of Contents

- [Features](#features)
- [Technologies Used](#technologies-used)
- [Setup](#setup)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
  - [Admin Upload Certificate](#admin-upload-certificate)
  - [User Certificates and Points](#user-certificates-and-points)
  - [Login](#login)
  - [Update Category](#update-category)
  - [Update Activity](#update-activity)
  - [Update Tag](#update-tag)
  - [Get Mahasiswa](#get-mahasiswa)

## Features

- Upload and manage certificates
- Fetch user certificates and calculate points
- User authentication with JWT
- Manage categories, activities, and tags

## Technologies Used

- Node.js
- Express.js
- Supabase
- Multer
- XLSX
- CORS
- JSON Web Token (JWT)
- Moment.js
- Date-fns
- Lodash

## Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/satyarrr/server-tak-primakara.git
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables (see [Environment Variables](#environment-variables)).

4. Run the server:
   ```bash
   npm start
   ```

## Environment Variables

Create a `.env` file in the root directory and add the following environment variables:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
JWT_SECRET=your_jwt_secret
```

## API Endpoints

### Admin Upload Certificate

Upload a certificate and associated image.

- **URL:** `/admin/upload`
- **Method:** `POST`
- **Headers:**
  - `Content-Type: multipart/form-data`
- **Request Body:**
  - `file` (form-data): The Excel file containing certificate data.
  - `image` (form-data): The image associated with the certificate.
  - `title` (string): The title of the certificate.
  - `tag_id` (string): The tag ID associated with the certificate.
  - `activity_date` (string): The date of the activity.
- **Response:**
  - `200 OK` on success
  - `400 Bad Request` if any required fields are missing
  - `500 Internal Server Error` on server error

### User Certificates and Points

Fetch user certificates and calculate total points.

- **URL:** `/user/:user_id/mahasiswa`
- **Method:** `GET`
- **Parameters:**
  - `user_id` (string): The ID of the user.
- **Response:**
  - `200 OK` with user data and points
  - `400 Bad Request` if user ID is missing
  - `404 Not Found` if user is not found
  - `500 Internal Server Error` on server error

### Login

Authenticate a user and return a JWT.

- **URL:** `/login`
- **Method:** `POST`
- **Request Body:**
  - `nim` (string): The user's NIM.
  - `password` (string): The user's password.
- **Response:**
  - `200 OK` with JWT token and redirect URL
  - `401 Unauthorized` if credentials are invalid
  - `500 Internal Server Error` on server error

### Update Category

Update a category's details.

- **URL:** `/category/:id`
- **Method:** `PUT`
- **Parameters:**
  - `id` (string): The ID of the category.
- **Request Body:**
  - `name` (string): The new name of the category.
  - `min_point` (number): The minimum point of the category.
  - `is_visible` (boolean): The visibility status of the category.
- **Response:**
  - `200 OK` on success
  - `500 Internal Server Error` on server error

### Update Activity

Update an activity's details.

- **URL:** `/activity/:id`
- **Method:** `PUT`
- **Parameters:**
  - `id` (string): The ID of the activity.
- **Request Body:**
  - `name` (string): The new name of the activity.
  - `is_visible` (boolean): The visibility status of the activity.
- **Response:**
  - `200 OK` on success
  - `500 Internal Server Error` on server error

### Update Tag

Update a tag's details.

- **URL:** `/tag/:id`
- **Method:** `PUT`
- **Parameters:**
  - `id` (string): The ID of the tag.
- **Request Body:**
  - `name` (string): The new name of the tag.
  - `value` (number): The value of the tag.
  - `is_visible` (boolean): The visibility status of the tag.
- **Response:**
  - `200 OK` on success
  - `500 Internal Server Error` on server error

### Get Mahasiswa

Get all mahasiswa (students) with their total points and current month points.

- **URL:** `/users/mahasiswa`
- **Method:** `GET`
- **Response:**
  - `200 OK` with the list of mahasiswa
  - `500 Internal Server Error` on server error

### Get Approved Categories and Certificate Statistics

**Retrieve statistics of approved certificates grouped by their categories.**

- **URL:** `/certificates/approved-categories`
- **Method:** `GET`
- **Response:**
  - **200 OK** with the statistics of approved certificates:
    - **Body:**
      - `success` (boolean): Indicates if the request was successful.
      - `totalCategories` (number): Total number of unique categories.
      - `totalCertificates` (number): Total number of approved certificates.
      - `averageCertificates` (number): Average number of certificates per category.
      - `categoryCounts` (object): An object where the keys are category names and the values are the number of certificates in that category.
    - **Example Response:**
      ```json
      {
        "success": true,
        "totalCategories": 3,
        "totalCertificates": 15,
        "averageCertificates": 5,
        "categoryCounts": {
          "Category A": 6,
          "Category B": 4,
          "Category C": 5
        }
      }
      ```
  - **500 Internal Server Error** on server error:
    - **Body:**
      - `success` (boolean): Indicates that an error occurred.
      - `error` (string): A message describing the error.
    - **Example Response:**
      ```json
      {
        "success": false,
        "error": "Internal Server Error"
      }
      ```

### Get All Certificates with User Information

**Retrieve all certificates that are neither approved nor rejected, along with the user information associated with them.**

- **URL:** `/certificates/all-with-users`
- **Method:** `GET`
- **Response:**
  - **200 OK** with the list of certificates and user information:
    - **Body:**
      - `success` (boolean): Indicates if the request was successful.
      - `certificates` (array): An array of certificate objects, each containing:
        - `certificate_id` (string): The unique ID of the certificate.
        - `status` (string): The status of the certificate.
        - `user` (object): An object containing user information, including:
          - `full_name` (string): The full name of the user.
          - `nim` (string): The NIM (student ID number) of the user.
    - **Example Response:**
      ```json
      {
        "success": true,
        "certificates": [
          {
            "certificate_id": "1",
            "status": "pending",
            "user": {
              "full_name": "Jane Doe",
              "nim": "456789"
            }
          },
          {
            "certificate_id": "2",
            "status": "pending",
            "user": {
              "full_name": "John Smith",
              "nim": "123456"
            }
          }
        ]
      }
      ```
  - **500 Internal Server Error** on server error:
    - **Body:**
      - `success` (boolean): Indicates that an error occurred.
      - `error` (string): A message describing the error.
    - **Example Response:**
      ```json
      {
        "success": false,
        "error": "Internal Server Error"
      }
      ```

### Get All Certificates

**Retrieve all certificates in the database.**

- **URL:** `/certificates/all`
- **Method:** `GET`
- **Response:**
  - **200 OK** with the list of all certificates:
    - **Body:**
      - `success` (boolean): Indicates if the request was successful.
      - `certificates` (array): An array of certificate objects.
    - **Example Response:**
      ```json
      {
        "success": true,
        "certificates": [
          {
            "certificate_id": "1",
            "status": "approve",
            ...
          },
          {
            "certificate_id": "2",
            "status": "pending",
            ...
          }
        ]
      }
      ```
  - **500 Internal Server Error** on server error:
    - **Body:**
      - `success` (boolean): Indicates that an error occurred.
      - `error` (string): A message describing the error.
    - **Example Response:**
      ```json
      {
        "success": false,
        "error": "Internal Server Error"
      }
      ```

---


This README should help users understand the purpose and usage of your backend code. You can customize and expand it further as needed.
