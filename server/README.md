# Khonic Accounting System - Backend

This folder contains the Expess.js server and PostgreSQL database configuration.

## Setup

### 1. Start Database
You can use Docker to quickly start the database:
```bash
# From the project root directory
docker-compose up -d
```
Alternatively, ensure you have a local PostgreSQL server running.

### 2. Install Dependencies
```bash
npm install
```

### 3. Initialize Database
Run the setup script to create the database and apply the schema:
```bash
npm run setup
```

## Running the Server

### Development Mode (with auto-reload)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

## Database Schema
The schema is located in `db/schema.sql`. The `setup.js` script automatically applies this schema during the setup process.
