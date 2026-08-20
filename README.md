# Meknos Backend API

A robust, modular Node.js & TypeScript backend service for the **Meknos** platform, powered by Express v5, MongoDB (Mongoose), and Google Gemini AI integrations.

---

## 🛠️ Tools & Technologies Used

### Core Technologies
- **Runtime Environment:** [Node.js](https://nodejs.org/) (v18+)
- **Language:** [TypeScript](https://www.typescriptlang.org/) (v7)
- **Web Framework:** [Express.js](https://expressjs.com/) (v5)
- **Database & ODM:** [MongoDB](https://www.mongodb.com/) with [Mongoose](https://mongoosejs.com/) (v9)

### AI & Data Integration
- **AI Models:** Google Gemini AI API (`@google/genai`)
- **Web Scraping / Crawling:** [Firecrawl](https://www.firecrawl.dev/) (`@mendable/firecrawl-js`)
- **Background Jobs / Workflows:** [Inngest](https://www.inngest.com/)

### Security & Utilities
- **Authentication:** JSON Web Tokens (`jsonwebtoken`) & Cookie-Parser
- **OAuth:** Google OAuth 2.0 (`GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`)
- **Schema Validation:** [Zod](https://zod.dev/) (v4)
- **HTTP Client:** [Axios](https://axios-http.com/)
- **Middleware:** `cors`, `compression`, `cookie-parser`

### Code Quality & Developer Experience
- **Development Server:** `tsx` (TypeScript execute & watch mode)
- **Code Formatter:** Prettier
- **Git Hooks:** Husky & lint-staged

---

## 📁 Folder Structure

```text
backend/
├── .env                  # Environment configuration file (git-ignored)
├── .prettierrc           # Prettier formatting options
├── dist/                 # Compiled JavaScript output (generated after build)
├── package.json          # Project metadata, dependencies, and scripts
├── tsconfig.json         # TypeScript compiler configuration
└── src/
    ├── app.ts            # Express application setup, global middleware, & route mounting
    ├── server.ts         # Server entry point (connects DB & starts listening)
    ├── config/           # Application & environment configuration
    │   ├── ai.config.ts        # AI service initialization
    │   ├── db.config.ts        # MongoDB connection setup
    │   ├── env.config.ts       # Validated environment variable loader
    │   └── env.validation.ts   # Zod schema for environment variable validation
    ├── middlewares/      # Express middleware functions
    │   ├── authenticate.middleware.ts  # JWT auth verification
    │   └── visitor.middleware.ts       # Visitor track / identification middleware
    ├── modules/          # Domain-driven feature modules
    │   ├── ai/           # AI prompts, providers, factories, & service logic
    │   ├── auth/         # Authentication controllers, routes, types, & services
    │   ├── chat/         # Chat sessions, message history, controllers, & models
    │   ├── userAnalytics/ # User activity & analytics models, controllers, & routes
    │   ├── userProfile/  # User profiles management, validation schemas, & models
    │   └── users/        # User domain models, constants, and validation
    ├── types/            # Custom TypeScript declaration files
    │   └── express.d.ts  # Augmentation for Express Request object
    └── utils/            # Shared helper functions
        ├── generateUsername.ts # Username generation helper
        └── sendResponse.ts     # Standardized JSON API response formatter
```

---

## ⚙️ Prerequisites & Setup

### Prerequisites
Make sure you have the following installed on your machine:
- [Node.js](https://nodejs.org/) (v18.x or higher recommended)
- [npm](https://www.npmjs.com/) (v9.x or higher)
- [MongoDB](https://www.mongodb.com/) (Local instance or MongoDB Atlas connection string)
- Google Gemini API Key

---

### Step-by-Step Setup

1. **Navigate to the Backend Directory**
   ```bash
   cd backend
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env` file in the root of the `backend` directory:
   ```bash
   cp .env.example .env   # Or create .env manually
   ```
---

## 🚀 Running the Application

### 1. Development Mode
Starts the server with live reloading using `tsx watch`:
```bash
npm run dev
```
The server will start listening at `http://localhost:8000` (or your configured `PORT`).

### 2. Production Build & Execution
Compile TypeScript code to JavaScript (`dist/`) and run the production server:
```bash
# Build TypeScript code
npm run build

# Start production server
npm start
```

### 3. Code Formatting
Format all files using Prettier:
```bash
npm run format
```

---

## 🔗 Key API Routes

| HTTP Method | Route Prefix | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Server health check endpoint |
| `POST / GET` | `/auth` | User authentication & Google OAuth handling |
| `GET / POST / PUT` | `/user-profiles` | Protected user profile management |
| `GET / POST` | `/public/profiles` | Public chat sessions and interaction routes |

---

## 📝 Response Format

All API responses follow a standardized format handled by `sendResponse.ts`:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success message here",
  "data": { ... }
}
```

---

## 📄 License

This repository is licensed under the [ISC License](LICENSE).
