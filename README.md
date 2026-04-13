# Loop Tag

Loop Tag is a small full-stack project consisting of:

- A **Flutter mobile app** (in `loop_tag/`) that uses **NFC** and talks to a backend over HTTP.
- A **Node.js + TypeScript + Express** backend (in `server/`) that provides APIs for users and products, stores data in **MongoDB**, and uploads images to **ImageKit**.

> Note: This repository is a fork. Some metadata and scaffolding (Flutter default README) may still be present.

---

## Repository structure

- `loop_tag/` — Flutter application (Android/iOS/Web/Desktop scaffolding included)
- `server/` — Express + TypeScript server (compiled output in `dist/`)
- `.vscode/` — editor settings

---

## Tech stack

### Mobile app (`loop_tag/`)
- Flutter / Dart
- GetX (routing/state)
- NFC: `nfc_manager`
- Networking: `http`
- Secure storage: `flutter_secure_storage`
- UI helpers: `google_fonts`, `flutter_svg`, `lottie`, etc.

Entry point initializes NFC on startup:
- `loop_tag/lib/main.dart` calls `NfcService().init()` and launches a `GetMaterialApp` titled **Loop Tag**.

### Server (`server/`)
- Node.js
- TypeScript
- Express
- MongoDB via Mongoose
- JWT auth via `jsonwebtoken`
- Password hashing via `bcryptjs`
- File upload via `multer`
- Image hosting via `imagekit`
- `dotenv` for environment variables

---

## Prerequisites

### For the Flutter app
- Flutter SDK installed
- An emulator/device
- NFC-capable Android device if testing NFC features

### For the server
- Node.js (LTS recommended)
- npm
- MongoDB connection string (local or hosted)
- ImageKit account (if using image uploads)

---

## Setup: Server (`server/`)

### 1) Install dependencies

```bash
cd server
npm install
```

### 2) Create `.env`

Create a file at `server/.env`:

```env
# MongoDB
MONGO_URI="mongodb+srv://<user>:<pass>@<cluster>/<db>?retryWrites=true&w=majority"

# JWT secrets
JWT_SECRET="replace-with-a-strong-secret"
JWT_SECRET_ADMIN="replace-with-a-strong-admin-secret"

# Admin login (used by login controller to grant admin tokens)
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="replace-with-a-strong-password"

# ImageKit (used for product image uploads)
IMAGEKIT_PUBLIC_KEY="..."
IMAGEKIT_PRIVATE_KEY="..."
IMAGEKIT_URL_ENDPOINT="https://ik.imagekit.io/<your_imagekit_id>"
```

### 3) Run in development

```bash
npm run dev
```

### 4) Build + run production

```bash
npm run build
npm start
```

### Server port

The server currently listens on **port `8055`** (hard-coded in `server/src/server.ts`).

If you want it configurable, a common improvement is to read `process.env.PORT`.

---

## Setup: Flutter app (`loop_tag/`)

### 1) Install dependencies

```bash
cd loop_tag
flutter pub get
```

### 2) Run

```bash
flutter run
```

> If the app needs a server base URL, search for where HTTP requests are made and configure the server URL accordingly (for Android emulator, `10.0.2.2` is often used instead of `localhost`).

---

## API overview (server)

Mounted in `server/src/server.ts`:

- `GET /`  
  Serves `server/index.html`

- `/api/Users`  
  User routes (see `server/src/routes/UserRoutes.ts`)

- `/api/products`  
  Product routes (see `server/src/routes/productRoutes.ts`)

### Authentication

The server issues JWT tokens on login/register and verifies them in middleware:

- User tokens: verified using `JWT_SECRET`
- Admin tokens: verified using `JWT_SECRET_ADMIN`

Admin login logic checks `ADMIN_EMAIL` and `ADMIN_PASSWORD`.

---

## Image uploads (products)

Product creation uploads images via ImageKit:

- Server receives files (Multer)
- Uploads to ImageKit folder "products"
- Stores returned URLs with the product record

Env vars required:
- `IMAGEKIT_PUBLIC_KEY`
- `IMAGEKIT_PRIVATE_KEY`
- `IMAGEKIT_URL_ENDPOINT`

---

## Common troubleshooting

### MongoDB connection errors
- Verify `MONGO_URI` is correct
- Ensure your IP is allowed (MongoDB Atlas Network Access)
- Check that the database user has permissions

### JWT errors / Unauthorized
- Ensure `JWT_SECRET` / `JWT_SECRET_ADMIN` match what was used to sign tokens
- Confirm the client sends `Authorization: Bearer <token>`

### Image upload failing
- Confirm ImageKit keys/endpoint are correct
- Confirm server receives files (client must send `multipart/form-data`)

---

## Suggested improvements (optional)
- Add a root-level README for the Flutter app or replace the default Flutter template README under `loop_tag/README.md`
- Add `.env.example` under `server/`
- Make server port configurable via `PORT`
- Add API docs (OpenAPI/Swagger) and/or Postman collection
- Add CI (lint/test/build) for both Flutter and server

---

## License
No license file is currently included in this repository.