# ZAD Stock - Stock & Inventory & Sales Management System

ZAD Stock is a modern, lightweight, stock, inventory, and sales management application tailored for small retail shops. Built with an offline-first (PWA) philosophy, it allows shop owners to keep recording sales even when internet access is lost, synchronizing data to the local SQLite database as soon as connection is re-established.

## Tech Stack
- **Frontend**: React + Vite (Vanilla CSS, Dexie.js for IndexedDB)
- **Backend**: Node.js + Express
- **Database**: SQLite3
- **Theme**: Professional Blue & Green Theme

## Repository Structure
- `/frontend`: React client code (Vite)
- `/backend`: Express server API
- `/database`: SQLite schema definitions and data storage
- `/docs`: Documentation and user guide

## Installation & Setup

### Prerequisites
- Node.js (v16+)
- npm

### Backend Installation & Startup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Express server:
   ```bash
   npm start
   ```
   The backend server will run on `http://localhost:5000` by default.

### API Endpoints
- **Health Check**: `GET /api/health`
- **Products**:
  - `GET /api/products` - List all products (sorted alphabetically by name)
  - `POST /api/products` - Add a new product
  - `PUT /api/products/:id` - Update product by ID
  - `DELETE /api/products/:id` - Delete product by ID
- **Sales**:
  - `GET /api/sales` - Get all sales records with their items
  - `POST /api/sales` - Record a new sale (updates product quantities automatically)

### Running Tests
Inside the `backend` directory, run:
```bash
node test_alerts.js
node test_stock.js
node test_sync.js
```

