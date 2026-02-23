# Khonic Accounting System

A modern accounting system built with React (Vite) and Node.js (Express) using PostgreSQL.

## Project Structure

- `client/`: React frontend built with Vite, Tailwind CSS, and Axios.
- `server/`: Node.js backend using Express and PostgreSQL.

## Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher)
- [PostgreSQL](https://www.postgresql.org/) (installed and running)

## Quick Start (First Time Setup)

### 1. Database Setup (using Docker)

1. Ensure [Docker Desktop](https://www.docker.com/products/docker-desktop/) is running.
2. Open a terminal in the root directory and run:
   ```bash
   docker-compose up -d
   ```
   This will start a PostgreSQL container with the required configuration.

### 2. Backend Setup

1. Open a terminal in the `server` directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Initialize the database schema:
   ```bash
   npm run setup
   ```

### 3. Frontend Setup

1. Open a terminal in the `client` directory:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

## Running the Apps

You need to run both the server and the client simultaneously.

### Start Backend
In the `server` directory:
```bash
npm run dev
```

### Start Frontend
In the `client` directory:
```bash
npm run dev
```

The frontend will typically be available at `http://localhost:5173` and the backend at `http://localhost:5000`.
