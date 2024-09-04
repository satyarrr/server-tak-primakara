
---

# Certificate Management Backend

This repository contains the backend code for managing certificates, users, and related activities using Node.js, Express, and Supabase.

## Table of Contents

- [Features](#features)
- [Technologies Used](#technologies-used)
- [Setup](#setup)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)

## Features

- Upload and manage certificates
- Fetch user certificates and calculate points
- User authentication with JWT
- Manage categories, activities, sub_activites, tag, and users

## Technologies Used

- [Node.js](https://nodejs.org/)
- [Express.js](https://expressjs.com/)
- [Supabase](https://supabase.com/)
- [Multer](https://www.npmjs.com/package/multer)
- [XLSX](https://www.npmjs.com/package/xlsx)
- [CORS](https://www.npmjs.com/package/cors)
- [JSON Web Token (JWT)](https://www.npmjs.com/package/jsonwebtoken)
- [Moment.js](https://www.npmjs.com/package/moment)
- [Date-fns](https://www.npmjs.com/package/date-fns)
- [Lodash](https://www.npmjs.com/package/lodash)

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
   ```bash
   npm run dev 
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
### Update Certificate Status

**Update the status and reason for a specific certificate.**

- **URL:** `/certificate/:id`
- **Method:** `PATCH`
- **Request Body:**
  - `status` (string): The new status of the certificate (e.g., "approve", "reject").
  - `reason` (string, optional): The reason for the status update.
- **Response:**
  - **200 OK** when the certificate is successfully updated:
    - **Body:**
      - `success` (boolean): Indicates if the request was successful.
      - `data` (object): The updated certificate data.
    - **Example Response:**
      ```json
      {
        "success": true,
        "data": [
          {
            "cert_id": "1",
            "status": "approve",
            "reason": "All criteria met",
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

### Get Management Data

**Retrieve all categories, their associated activities, and the tags related to those activities.**

- **URL:** `/management`
- **Method:** `GET`
- **Response:**
  - **200 OK** with the combined data:
    - **Body:**
      - An array of category objects, each containing:
        - `id` (string): The unique ID of the category.
        - `name` (string): The name of the category.
        - `min_point` (number): The minimum points required for the category.
        - `is_visible` (boolean): Indicates if the category is visible.
        - `activities` (array): An array of activity objects, each containing:
          - `id` (string): The unique ID of the activity.
          - `name` (string): The name of the activity.
          - `is_visible` (boolean): Indicates if the activity is visible.
          - `tags` (array): An array of tag objects, each containing:
            - `id` (string): The unique ID of the tag.
            - `name` (string): The name of the tag.
            - `value` (string): The value associated with the tag.
            - `is_visible` (boolean): Indicates if the tag is visible.
    - **Example Response:**
      ```json
      [
        {
          "id": "1",
          "name": "Category A",
          "min_point": 50,
          "is_visible": true,
          "activities": [
            {
              "id": "10",
              "name": "Activity A1",
              "is_visible": true,
              "tags": [
                {
                  "id": "100",
                  "name": "Tag A1",
                  "value": "Value A1",
                  "is_visible": true
                }
              ]
            }
          ]
        }
      ]
      ```
  - **500 Internal Server Error** on server error:
    - **Body:**
      - `error` (string): A message describing the error.
    - **Example Response:**
      ```json
      {
        "error": "Internal Server Error"
      }
      ```

### Get All Categories

**Retrieve all categories sorted by name.**

- **URL:** `/categories`
- **Method:** `GET`
- **Response:**
  - **200 OK** with the list of categories:
    - **Body:**
      - An array of category objects, each containing:
        - `id` (string): The unique ID of the category.
        - `name` (string): The name of the category.
        - `min` (number): The minimum points required for the category.
        - `is_visible` (boolean): Indicates if the category is visible.
    - **Example Response:**
      ```json
      [
        {
          "id": "1",
          "name": "Category A",
          "min": 50,
          "is_visible": true
        },
        {
          "id": "2",
          "name": "Category B",
          "min": 30,
          "is_visible": false
        }
      ]
      ```
  - **500 Internal Server Error** on server error:
    - **Body:**
      - `error` (string): A message describing the error.
    - **Example Response:**
      ```json
      {
        "error": "Internal Server Error"
      }
      ```
### Get User Certificates

**Retrieve all certificates associated with a specific user.**

- **URL:** `/certificates/:user_id`
- **Method:** `GET`
- **URL Params:**
  - `user_id` (string): The ID of the user whose certificates are being requested.
- **Response:**
  - **200 OK** with the user's certificates:
    - **Body:**
      - `success` (boolean): Indicates if the request was successful.
      - `certificates` (array): An array of certificate objects.
    - **Example Response:**
      ```json
      {
        "success": true,
        "certificates": [
          {
            "cert_id": "1",
            "user_id": "123",
            "title": "Certificate A",
            "status": "approve",
            "tag_id": "10",
            "activity_date": "2024-09-01T00:00:00Z",
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

### Delete Certificate

**Delete a specific certificate by its ID.**

- **URL:** `/certificates/:cert_id`
- **Method:** `DELETE`
- **URL Params:**
  - `cert_id` (string): The ID of the certificate to delete.
- **Response:**
  - **200 OK** when the certificate is successfully deleted:
    - **Body:**
      - `success` (boolean): Indicates if the request was successful.
      - `message` (string): Confirmation message indicating successful deletion.
    - **Example Response:**
      ```json
      {
        "success": true,
        "message": "Certificate deleted successfully"
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

### Upload Certificate

**Upload a new certificate for a user.**

- **URL:** `/upload`
- **Method:** `POST`
- **Request:**
  - **Body:**
    - `file` (file): The certificate file to upload.
    - `user_id` (string): The ID of the user associated with the certificate.
    - `title` (string): The title of the certificate.
    - `status` (string, optional): The status of the certificate (default is "pending").
    - `tag_id` (string): The ID of the tag associated with the certificate.
    - `activity_date` (string): The date of the activity, formatted as ISO 8601.
- **Response:**
  - **200 OK** when the certificate is successfully uploaded:
    - **Body:**
      - `success` (boolean): Indicates if the request was successful.
      - `data` (object): Contains the public URL of the uploaded certificate.
      - `insertedCertificate` (object): The inserted certificate data.
    - **Example Response:**
      ```json
      {
        "success": true,
        "data": {
          "publicUrl": "https://storage.supabase.io/certificates/user_id/certificate.pdf"
        },
        "insertedCertificate": {
          "cert_id": "1",
          "user_id": "123",
          "title": "Certificate A",
          "file_path": "https://storage.supabase.io/certificates/user_id/certificate.pdf",
          "status": "pending",
          "tag_id": "10",
          "activity_date": "2024-09-01T00:00:00Z",
          ...
        }
      }
      ```
  - **400 Bad Request** when required fields are missing or certificate already exists:
    - **Body:**
      - `success` (boolean): Indicates that the request failed.
      - `error` (string): A message describing the error.
    - **Example Response:**
      ```json
      {
        "success": false,
        "error": "Missing required fields"
      }
      ```
      ```json
      {
        "success": false,
        "error": "Certificate with the same tag on the same activity date already exists"
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
### Create Category

**Create a new category with a minimum point requirement.**

- **URL:** `/categories`
- **Method:** `POST`
- **Request:**
  - **Body:**
    - `name` (string): The name of the category.
    - `min_point` (integer): The minimum points required for the category.
- **Response:**
  - **201 Created** when the category is successfully created:
    - **Body:**
      - `success` (boolean): Indicates if the request was successful.
      - `message` (string): Confirmation message indicating successful creation.
    - **Example Response:**
      ```json
      {
        "success": true,
        "message": "Category created successfully"
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

### Create Tag

**Create a new tag associated with a specific category and activity.**

- **URL:** `/tags`
- **Method:** `POST`
- **Request:**
  - **Body:**
    - `category_id` (string): The ID of the category associated with the tag.
    - `activity_id` (string): The ID of the activity associated with the tag.
    - `value` (integer): The value of the tag.
    - `name` (string): The name of the tag.
- **Response:**
  - **201 Created** when the tag is successfully created:
    - **Body:**
      - `success` (boolean): Indicates if the request was successful.
      - `data` (object): The created tag object.
    - **Example Response:**
      ```json
      {
        "success": true,
        "data": {
          "id": "1",
          "category_id": "123",
          "activity_id": "456",
          "value": 10,
          "name": "Tag Name"
        }
      }
      ```
  - **400 Bad Request** when required fields are missing:
    - **Body:**
      - `success` (boolean): Indicates that the request failed.
      - `error` (string): A message describing the error.
    - **Example Response:**
      ```json
      {
        "success": false,
        "error": "All fields are required"
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

### Create Activity

**Create a new activity under a specific category.**

- **URL:** `/activities`
- **Method:** `POST`
- **Request:**
  - **Body:**
    - `category_id` (string): The ID of the category associated with the activity.
    - `name` (string): The name of the activity.
- **Response:**
  - **201 Created** when the activity is successfully created:
    - **Body:**
      - `success` (boolean): Indicates if the request was successful.
      - `data` (object): The created activity object.
    - **Example Response:**
      ```json
      {
        "success": true,
        "data": {
          "id": "1",
          "category_id": "123",
          "name": "Activity Name"
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

### Get Tags by Category

**Retrieve all tags associated with a specific category.**

- **URL:** `/categories/:category_id/tags`
- **Method:** `GET`
- **URL Params:**
  - `category_id` (string): The ID of the category for which tags are being requested.
- **Response:**
  - **200 OK** with the list of tags associated with the category:
    - **Body:**
      - `id` (string): The ID of the tag.
      - `name` (string): The name of the tag.
      - `value` (integer): The value of the tag.
      - `category_id` (string): The ID of the associated category.
    - **Example Response:**
      ```json
      [
        {
          "id": "1",
          "name": "Tag Name",
          "value": 10,
          "category_id": "123"
        }
      ]
      ```
  - **400 Bad Request** when the category ID is not provided:
    - **Body:**
      - `error` (string): A message indicating that the category ID is required.
    - **Example Response:**
      ```json
      {
        "error": "Category ID is required"
      }
      ```
  - **500 Internal Server Error** on server error:
    - **Body:**
      - `error` (string): A message describing the error.
    - **Example Response:**
      ```json
      {
        "error": "Internal Server Error"
      }
      ```
### Get Activities by Category

**Retrieve all activities associated with a specific category.**

- **URL:** `/categories/:categoryId/activities`
- **Method:** `GET`
- **URL Params:**
  - `categoryId` (string): The ID of the category for which activities are being requested.
- **Response:**
  - **200 OK** with the list of activities associated with the category:
    - **Body:**
      - `id` (string): The ID of the activity.
      - `name` (string): The name of the activity.
      - `category_id` (string): The ID of the associated category.
      - `is_visible` (boolean): Indicates if the activity is visible.
    - **Example Response:**
      ```json
      [
        {
          "id": "1",
          "name": "Activity Name",
          "category_id": "123",
          "is_visible": true
        }
      ]
      ```
  - **500 Internal Server Error** on server error:
    - **Body:**
      - `error` (string): A message describing the error.
    - **Example Response:**
      ```json
      {
        "error": "Internal Server Error"
      }
      ```

### Get Tags by Activity

**Retrieve all tags associated with a specific activity.**

- **URL:** `/activities/:activityId/tags`
- **Method:** `GET`
- **URL Params:**
  - `activityId` (string): The ID of the activity for which tags are being requested.
- **Response:**
  - **200 OK** with the list of tags associated with the activity:
    - **Body:**
      - `id` (string): The ID of the tag.
      - `name` (string): The name of the tag.
      - `value` (integer): The value of the tag.
      - `activity_id` (string): The ID of the associated activity.
      - `is_visible` (boolean): Indicates if the tag is visible.
    - **Example Response:**
      ```json
      [
        {
          "id": "1",
          "name": "Tag Name",
          "value": 10,
          "activity_id": "456",
          "is_visible": true
        }
      ]
      ```
  - **500 Internal Server Error** on server error:
    - **Body:**
      - `error` (string): A message describing the error.
    - **Example Response:**
      ```json
      {
        "error": "Internal Server Error"
      }
      ```

### Get All Tags

**Retrieve all tags available in the system.**

- **URL:** `/tags`
- **Method:** `GET`
- **Response:**
  - **200 OK** with the list of all tags:
    - **Body:**
      - `id` (string): The ID of the tag.
      - `name` (string): The name of the tag.
      - `value` (integer): The value of the tag.
      - `category_id` (string): The ID of the associated category.
      - `activity_id` (string): The ID of the associated activity.
    - **Example Response:**
      ```json
      [
        {
          "id": "1",
          "name": "Tag Name",
          "value": 10,
          "category_id": "123",
          "activity_id": "456"
        }
      ]
      ```
  - **500 Internal Server Error** on server error:
    - **Body:**
      - `error` (string): A message describing the error.
    - **Example Response:**
      ```json
      {
        "error": "Internal Server Error"
      }
      ```
### Get All Activities

**Retrieve all activities from the system.**

- **URL:** `/activities`
- **Method:** `GET`
- **Response:**
  - **200 OK** with the list of activities:
    - **Body:**
      - `id` (string): The ID of the activity.
      - `name` (string): The name of the activity.
      - `category_id` (string): The ID of the associated category.
    - **Example Response:**
      ```json
      [
        {
          "id": "1",
          "name": "Activity Name",
          "category_id": "123"
        }
      ]
      ```
  - **500 Internal Server Error** on server error:
    - **Body:**
      - `error` (string): A message describing the error.
    - **Example Response:**
      ```json
      {
        "error": "Internal Server Error"
      }
      ```

### Get All Tags

**Retrieve all tags from the system.**

- **URL:** `/tagsall`
- **Method:** `GET`
- **Response:**
  - **200 OK** with the list of tags:
    - **Body:**
      - `id` (string): The ID of the tag.
      - `name` (string): The name of the tag.
      - `value` (integer): The value of the tag.
      - `category_id` (string): The ID of the associated category.
      - `activity_id` (string): The ID of the associated activity.
    - **Example Response:**
      ```json
      [
        {
          "id": "1",
          "name": "Tag Name",
          "value": 10,
          "category_id": "123",
          "activity_id": "456"
        }
      ]
      ```
  - **500 Internal Server Error** on server error:
    - **Body:**
      - `error` (string): A message describing the error.
    - **Example Response:**
      ```json
      {
        "error": "Internal Server Error"
      }
      ```

---


This README should help users understand the purpose and usage of your backend code. You can customize and expand it further as needed.
