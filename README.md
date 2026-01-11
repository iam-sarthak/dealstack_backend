# ERP CRM Backend API

A complete Node.js/Express backend API for the ERP CRM system with JWT authentication.

## Features

- JWT Authentication
- Customer Management
- Worksheet Management
- Invoice Management
- Order & Service Management
- Support Ticket System
- Dashboard Statistics

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file (copy from `.env.example`):
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/erp-crm
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d
NODE_ENV=development
```

3. Make sure MongoDB is running on your system

4. Start the server:
```bash
npm run dev
```

The server will run on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (Protected)

### Customers
- `GET /api/customers` - Get all customers
- `GET /api/customers/:id` - Get single customer
- `POST /api/customers` - Create customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Worksheets
- `GET /api/worksheets` - Get all worksheets
- `GET /api/worksheets/:id` - Get single worksheet
- `POST /api/worksheets` - Create worksheet
- `PUT /api/worksheets/:id` - Update worksheet
- `DELETE /api/worksheets/:id` - Delete worksheet

### Invoices
- `GET /api/invoices` - Get all invoices
- `GET /api/invoices/:id` - Get single invoice
- `POST /api/invoices` - Create invoice
- `PUT /api/invoices/:id` - Update invoice
- `PUT /api/invoices/:id/status` - Update invoice status
- `DELETE /api/invoices/:id` - Delete invoice

### Orders
- `GET /api/orders` - Get all orders
- `GET /api/orders/:id` - Get single order
- `POST /api/orders` - Create order
- `PUT /api/orders/:id` - Update order
- `PUT /api/orders/:id/status` - Update order status
- `DELETE /api/orders/:id` - Delete order

### Tickets
- `GET /api/tickets` - Get all tickets
- `GET /api/tickets/:id` - Get single ticket
- `POST /api/tickets` - Create ticket
- `PUT /api/tickets/:id` - Update ticket
- `POST /api/tickets/:id/messages` - Add message to ticket
- `PUT /api/tickets/:id/status` - Update ticket status
- `PUT /api/tickets/:id/rating` - Add rating to ticket
- `DELETE /api/tickets/:id` - Delete ticket

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/recent` - Get recent activities

## Authentication

All routes except `/api/auth/register` and `/api/auth/login` require authentication.

Include the JWT token in the Authorization header:
```
Authorization: Bearer <your_token>
```

