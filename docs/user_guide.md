# ZAD Stock - Installation & User Guide

This guide details the steps to install, configure, and operate the ZAD Stock Management System.

---

## 1. System Requirements

- **Runtime**: Node.js (v18.0.0 or higher)
- **Package Manager**: npm (v9.0.0 or higher)
- **Browser**: Modern browser (Chrome, Edge, Firefox, or Safari) with IndexedDB enabled

---

## 2. Installation & Setup

Clone the repository and install dependencies inside both folders:

### Backend Setup
1. Open a terminal and navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Start the Express API server:
   ```bash
   npm start
   ```
   *The backend will boot on port `5000` and automatically initialize the SQLite database at `/database/zad_stock.db` using `/database/schema.sql`.*

### Frontend Setup
1. Open a new terminal and navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Start the Vite React client dev server:
   ```bash
   npm run dev
   ```
   *The client dev server will boot on port `5173` (or the next available port).*

---

## 3. Operational Guide

### A. Inventory Management
- Navigate to the **Inventory** tab in the sidebar.
- Click **Add Product** to create items with details: Name, Category, Cost Price, Selling Price, and Initial Stock.
- Click the pencil icon to edit pricing/quantities or the trash bin to delete.
- When stock quantities fall below 10, a yellow **Low Stock** alert tag triggers.
- Download your current inventory spreadsheet by clicking **Export CSV**.

### B. Point of Sale (POS)
- Navigate to the **POS Screen** tab in the sidebar.
- Browse the catalog or search using the search bar or category filters.
- Click items to add them to your cart. You can adjust quantities using `+` and `-` buttons.
- Quantities are validated in real-time against available stock.
- Review checkout financial aggregates: Subtotal, Total, and Cost.
- Click **Complete Checkout** to complete the sale, which immediately decrements catalog stock quantities.

### C. Dashboard & Analytics
- Navigate to the **Dashboard** tab.
- Monitor financial metrics: Total Revenue, Total Cost of Goods Sold (COGS), Net Profit, and Net Margin percentage.
- View stock levels: active catalog product counts and low stock warnings.
- Analyze daily trends using the custom SVG sales graph.
- Monitor top-selling products in the Highlights widget.

### D. Reports & Audits
- Navigate to the **Reports** tab.
- Select **Daily Report** or **Monthly Report**.
- Choose custom date boundaries using the date picker inputs.
- Print your sales reports by clicking **Print Report** (uses optimized print-friendly CSS sheets).
- Download reports to spreadsheet formats using **Export CSV**.

---

## 4. Offline Functionality

- ZAD Stock is built to be resilient to network failures. If your internet connection drops, the status indicator in the top right toggles to **Disconnected** with an orange indicator.
- You can continue creating products, updating stock levels, and completing POS checkouts.
- All actions are queued in browser IndexedDB.
- When internet connection is restored, the client automatically triggers background sync, pushes pending operations to the Express SQLite backend, updates remote records, and changes state to **Connected** with a green wifi icon.
