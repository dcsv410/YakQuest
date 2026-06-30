# YakQuest

YakQuest is a full-stack platform for planning canoe and kayak trips. It consists of a mobile application, public web application, administrative web portal, shared TypeScript package, and a FastAPI/PostGIS backend.

---

# Repository Structure

```
yakquest/
│
├── backend/         FastAPI + PostgreSQL/PostGIS API
├── mobile/          React Native (Expo)
├── web/             React + Vite website & admin portal
├── shared/          Shared types, DTOs, API client and utilities
│
└── README.md
```

---

# Technology Stack

### Backend

* FastAPI
* SQLAlchemy
* PostgreSQL
* PostGIS
* Docker

### Web

* React
* Vite
* React Query
* React Router
* React Leaflet

### Mobile

* React Native
* Expo
* Expo Router

### Shared

* TypeScript
* DTOs
* Shared models
* API client
* Shared utilities

---

# Initial Setup

Clone the repository.

```
git clone <repository-url>
cd yakquest
```

---

# Backend

Enter the backend folder.

```
cd backend
```

Create the environment file.

```
cp .env.example .env
```

Typical variables:

```
DATABASE_URL=postgresql://postgres:password@db:5432/yakquest

JWT_SECRET=change-me

API_HOST=0.0.0.0
API_PORT=8010
```

Start Docker.

```
docker compose up --build
```

The API will be available at:

```
http://localhost:8010
```

Swagger documentation:

```
http://localhost:8010/docs
```

---

# Shared Package

The shared package contains:

* Models
* DTOs
* API client
* Constants
* Geometry utilities
* Trip calculations

Whenever shared code changes:

```
cd shared

npm install

npm run typecheck
```

Then reinstall it into dependent projects if necessary.

```
cd ../web
npm install ../shared
```

```
cd ../mobile
npm install ../shared
```

---

# Web Application

```
cd web

npm install

npm run dev
```

Runs on:

```
http://localhost:5173
```

---

# Mobile Application

```
cd mobile

npm install

npx expo start
```

Use:

* Android Emulator
* iOS Simulator
* Expo Go

depending on your development environment.

---

# Database

Primary database:

* PostgreSQL
* PostGIS extension enabled

Current major entities:

* Users
* Rivers
* River Points
* Outfitters
* Contributions
* Saved Trips
* Completed Trips

---

# Importing a River

The admin portal includes a River Import Wizard.

Workflow:

1. Export river path from Google Earth as KML.
2. Open Admin → Import River.
3. Upload the KML.
4. Review metadata.
5. Review calculated river length.
6. Import.

No manual JSON editing is required.

---

# Admin Portal

Current functionality includes:

* Dashboard
* River Editor
* River Import Wizard
* Point editing
* Point drag-and-drop
* Duplicate point detection
* Contribution review queue
* Outfitter management
* User list
* Analytics

---

# Public Website

Current functionality:

* Browse rivers
* State filtering
* River information
* Flow conditions
* Outfitters
* Trip planner
* Save trips

---

# Mobile Application

Current functionality:

* River browser
* Trip planning
* Navigation
* Live navigation
* Offline trip history
* Saved trips
* Contributions
* Flow information

The mobile application is currently being migrated to consume the shared package for models, DTOs, services, and utilities.

---

# Development Workflow

Typical workflow for new features:

1. Update backend models/endpoints.
2. Update shared DTOs/models.
3. Run:

```
cd shared
npm run typecheck
```

4. Update web or mobile.
5. Test.
6. Commit.

---

# Project Status

The platform currently supports:

* Full river management
* Point management
* Outfitter management
* Contribution review
* User authentication
* Saved trips
* Trip planning
* Public river browser

The next major milestone is the mobile refactor to fully consume the shared package and eliminate duplicated logic.

---

# Future Roadmap

* Offline synchronization
* Photo uploads
* Weather integration
* Advanced analytics
* Feature flags
* Premium features
* AI-assisted trip planning
