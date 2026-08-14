# Full Connection of Visitor Registration

A visitor registration system for the University of Northern Philippines (UNP). The project provides a responsive registration page, client-side validation, Philippine address autocomplete, and a PHP/MySQL API for saving visitor records.

## Features

- Visitor registration form for name, phone number, province, municipality, and barangay
- Client-side validation for names and Philippine mobile numbers
- Duplicate visitor detection using last name, first name, and phone number
- Province, municipality, and barangay lookup through the [PSGC API](https://psgc.gitlab.io/api/)
- Toast notifications for success, warning, and error states
- PHP API with prepared SQL statements and JSON responses
- Visitor count API action for future dashboard or counter components

## Requirements

- XAMPP with Apache and MySQL
- PHP with the PDO MySQL extension enabled
- A modern browser with JavaScript enabled
- Node.js and npm are optional; the current project does not define build or start scripts

## Project structure

```text
UNP_Visitor_Registration/
├── visitor-registration.html                 # Main registration page
├── page-load.js                              # Connects the Register button to the form handler
├── src/
│   ├── backend/handle-registration/
│   │   ├── visitorRegistration.php           # JSON API and database operations
│   │   └── db-test.php                       # Basic MySQL connection helper
│   ├── handle-form/
│   │   ├── handle-address/                    # PSGC address autocomplete
│   │   ├── handle-registration/               # Form validation and submission
│   │   ├── hanlde-server/                     # Axios API client and service methods
│   │   └── function/                          # Toast notification helper
│   ├── script/main.js                         # Lucide icon initialization
│   ├── styles/                                # Project styles and Tailwind browser setup
│   └── lib/                                   # Local Axios and Lucide libraries
└── package.json
```

## Local setup

1. Copy or clone this folder into XAMPP's `htdocs` directory:

   ```text
   C:\xampp\htdocs\UNP_Visitor_Registration
   ```

2. Start **Apache** and **MySQL** from the XAMPP Control Panel.

3. Create the database and table in phpMyAdmin or the MySQL client:

   ```sql
   CREATE DATABASE IF NOT EXISTS visitor_managements
     CHARACTER SET utf8mb4
     COLLATE utf8mb4_unicode_ci;

   USE visitor_managements;

   CREATE TABLE IF NOT EXISTS visitor_register (
     id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
     lastName VARCHAR(100) NOT NULL,
     firstName VARCHAR(100) NOT NULL,
     middleName VARCHAR(10) NULL,
     phoneNumber VARCHAR(20) NOT NULL,
     province VARCHAR(150) NOT NULL,
     municipality VARCHAR(150) NOT NULL,
     barangay VARCHAR(150) NOT NULL,
     register_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
     INDEX idx_visitor_identity (lastName, firstName, phoneNumber)
   );
   ```

4. Open the application through github repo.

   [visit the link](https://cjalibin-ops.github.io/UNP_Visitor_Registration/visitor-registration.html)

## Database configuration

By default, the API connects with these values:

| Setting | Default |
|---|---|
| Host | `127.0.0.1` |
| Database | `visitor_managements` |
| User | `root` |
| Password | empty |

The PHP API supports environment variables for overriding the defaults:

```text
VISITOR_DB_HOST
VISITOR_DB_NAME
VISITOR_DB_USER
VISITOR_DB_PASSWORD
VISITOR_ALLOWED_ORIGINS
```

`VISITOR_ALLOWED_ORIGINS` accepts a comma-separated list of allowed origins. If it is not set, local `localhost` and `127.0.0.1` origins are allowed for development.

## API reference

The frontend sends JSON `POST` requests to:

```text
/UNP_Visitor_Registration/src/backend/handle-registration/visitorRegistration.php
```


## Development notes

The frontend currently runs without a bundler. Edit the source files directly and refresh the browser. `npm install` is only needed if you plan to use the Tailwind-related packages in `package.json`; there is currently no npm development command configured.

## License

No license has been specified for this project.
