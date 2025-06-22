# Purchase Microservice

A TypeScript microservice for handling e-commerce purchase operations with MongoDB and UUIDv1.

## Features

- ✅ Purchase creation and management
- ✅ UUIDv1 for all purchase IDs
- ✅ MongoDB with mongoose ODM
- ✅ RESTful API with Express.js
- ✅ Input validation with Joi
- ✅ External service integration
- ✅ Comprehensive error handling
- ✅ Docker containerization
- ✅ Test suite setup

## API Endpoints

- `POST /api/purchases` - Create a new purchase
- `GET /api/purchases` - Get all purchases (with filtering)
- `GET /api/purchases/:id` - Get purchase by ID
- `PATCH /api/purchases/:id/status` - Update purchase status
- `GET /api/purchases/user/:userId` - Get user purchases
- `GET /health` - Health check

## Quick Start

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env` and configure
3. Start development: `npm run dev`
4. Build for production: `npm run build`
5. Run tests: `npm test`


## External Services

This service integrates with:
- User Service (user validation)
- Product Service (product validation & pricing)
- Payment Service (payment processing)