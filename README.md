# AI-Powered Task Management API Backend

A production-grade, highly secure RESTful API for managing tasks, built using **Nest.js**, **TypeScript**, and **PostgreSQL**. This system scales from standard CRUD operations into an intelligent platform featuring automated AI execution checklists, robust validation pipelines, automated output sanitization, real email delivery workflows, and Google OAuth2 social authentication.

---

## ✨ Features Engineered

### 🔐 Advanced Authentication & Security
* **Dual Authentication Paths:** Traditional email/password authentication alongside seamless **Google OAuth2 Social Sign-In**.
* **Active Boundary Verification:** Strict email verification workflow. Users are blocked from signing in until they confirm their account via a secure, single-use token sent to their email.
* **Secure Password Recovery:** Automated password reset lifecycle utilizing expiration-checked secure tokens (valid for 1 hour).
* **Cryptographic Hashing:** Advanced multi-round password salting and encryption via `bcrypt`.
* **Route Protection (Guards):** Granular token parsing via Passport JWT strategies to shield sensitive workspace resources.

### 📋 Intelligent Task Management & Data Isolation
* **Data Isolation (Multi-Tenant Behavior):** Strict relational database mapping (`One-to-Many`). Users securely own their tasks. Users can search, read, modify, or delete *only* the specific database rows they created.
* **Dynamic Search & Filtering:** On-the-fly SQL compilation using TypeORM `QueryBuilder` to parse partial text keyword lookups and status enumerations simultaneously.
* **Database Pagination:** Performance-focused data slicing utilizing SQL `LIMIT` and `OFFSET` calculated dynamically via `page` and `limit` URL query filters.

### 🤖 AI Integration & System Architecture
* **Google Gemini AI Assistant:** Dedicated external service integration that passes task concepts to the `gemini-1.5-flash` model, parsing raw JSON string arrays to automatically generate an actionable execution checklist stored directly in PostgreSQL.
* **Automated Output Serialization:** Global interceptor pipes that automatically sanitize outgoing data structures (e.g., completely removing user passwords, system entity relationships, and tokens from JSON outputs using class serialization decorators).
* **Self-Documenting API (OpenAPI/Swagger):** Fully interactive, live route testing portal mapped directly out of code attributes, including customized server response codes (`201 Created`, `401 Unauthorized`, `409 Conflict`).

---

## 🛠️ Tech Stack & Dependencies

* **Core Framework:** [NestJS (v10+)](https://nestjs.com/) & TypeScript
* **Database ORM:** [TypeORM](https://typeorm.io/) & PostgreSQL
* **Authentication:** Passport.js, JWT (`@nestjs/jwt`), and Google OAuth2 (`passport-google-oauth20`)
* **Mailing Engine:** Nodemailer (`@nestjs-modules/mailer`)
* **AI Integration:** Google Generative AI REST Engine (Gemini API)
* **Validation & Transformation:** `class-validator` & `class-transformer`

---

## 🚀 Installation & Local Environment Setup

### 1. Prerequisites
Ensure you have **Node.js (v18+)** and a local instance of **PostgreSQL** running on your system.

### 2. Clone and Install Dependencies

```bash
git clone <your-repository-url>
cd task-management-backend
npm install
```
### 3. Environment Variables Configuration
Create a `.env` file in the root directory of the project (at the same level as `package.json`) and paste the following configuration structure:

```ini
# Database Settings
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_secure_postgresql_password
DB_NAME=task_management_db

# JWT Configurations
JWT_SECRET=use_a_highly_secure_random_string_here

# Google Gemini AI Config
GEMINI_API_KEY=your_google_ai_studio_api_key

# Mailer Configurations (SMTP via Mailtrap Testing Sandbox)
MAIL_HOST=sandbox.smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USER=your_mailtrap_credential_username
MAIL_PASS=your_mailtrap_credential_password

# Google OAuth2 Credentials
GOOGLE_CLIENT_ID=your_google_cloud_console_client_id
GOOGLE_CLIENT_SECRET=your_google_cloud_console_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
```

⚠️ **Note:** You must manually create an empty schema database named `task_management_db` in your local PostgreSQL client before launching.

---

## 🏃 Running the Application

### Local Development Mode (With Auto-Reload)

```bash
npm run start:dev
```

The server will boot up and automatically configure your PostgreSQL tables. It will start listening for requests at: `http://localhost:3000`

### Interactive API Documentation Portal

Once the application is running, open your browser and navigate to:
👉 [http://localhost:3000/docs](http://localhost:3000/docs)

Through this live Swagger dashboard, you can register accounts, paste authorization headers, execute queries, test pagination constraints, and run AI generation models.

--- 

## 🗺️ API Endpoint Reference Map

#### 🔐 Authentication Resource Set (`/auth`)
#### 📋 Task Workspace Resource Set (`/tasks`) — All Routes Below Require Authorization Bearer Header

---

## 📝 License
This project is open-source and free for development testing and portfolio applications.