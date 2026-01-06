# 🔀 NestJS API Gateway & Reverse Proxy

A production-ready **API Gateway** built with **NestJS**, designed to sit in front of multiple backend services.
It provides **routing**, **reverse proxying**, **API key authentication**, **rate limiting**, and **observability**
(logging, request IDs, and normalized error handling) in a single, clean gateway layer.

This project acts as a central entry point for microservices such as **auth**, **tasks**, and **realtime**
services, forwarding requests transparently while enforcing cross-cutting concerns.

---

## 🟢 Live Demo

You can try the API Gateway in action here:

👉 **Live Demo:** https://rscoding.dev/projects/nestjs/demo

The demo showcases:
- Centralized routing to multiple backend services
- API key–protected endpoints
- Rate limiting in action (429 responses when limits are exceeded)
- Transparent proxying of HTTP and realtime (WebSocket) traffic

---

## 🚀 Features

### Reverse Proxy & Routing
- Single gateway endpoint for multiple backend services
- Path-based routing using configurable prefixes
- Automatic request forwarding to upstream services
- Transparent response forwarding (status, headers, body)

### API Key Authentication
- API key validation via `x-api-key` header
- Configurable allowlist of API keys
- Rejected requests return a normalized **401 Unauthorized** response

### Rate Limiting
- Fixed-window rate limiting per API key or IP address
- Redis-backed counters for distributed setups
- Configurable request limits and time windows
- Returns **429 Too Many Requests** when exceeded

### Observability & Tracing
- Global request logging with execution time
- Automatic request ID generation (`x-request-id`)
- Request ID propagation to downstream services
- Centralized HTTP exception handling with consistent error format

### Error Normalization
- Unified JSON error responses across the gateway
- Clear error codes (e.g. `UNAUTHORIZED`, `RATE_LIMITED`, `NOT_FOUND`)
- Includes request ID for easier debugging

---

## 🧱 Tech Stack

- Node.js
- NestJS
- TypeScript
- Express
- Axios (via NestJS HttpService)
- Redis (rate limiting)
- http-proxy-middleware (WebSocket support)

---

## 📁 Project Structure

```text
src/
├── gateway/
│   └── gateway.controller.ts     # Catch-all controller routing requests to services
├── proxy/
│   └── proxy.service.ts          # Reverse proxy forwarding logic
├── observability/
│   ├── logging.interceptor.ts    # Request/response logging
│   ├── http-exception.filter.ts  # Global error normalization
│   ├── request-id.middleware.ts # Request ID generation & propagation
│   └── observability.module.ts
├── security/
│   ├── api-key.guard.ts          # API key authentication
│   ├── rate-limit.guard.ts       # Redis-based rate limiting
│   ├── redis.provider.ts         # Redis provider
│   └── too-many-requests.exception.ts
├── app.module.ts
└── main.ts                       # Application entry point (default port 3000)
```

---

## ⚙️ Prerequisites

Make sure you have installed:

- Node.js (v18+ recommended)
- npm
- Redis
- Git

---

## ⚙️ Environment Variables

Create a `.env` file in the project root:

```env
PORT=3000

# Upstream services
AUTH_URL=http://localhost:3001
TASKS_URL=http://localhost:3002
REALTIME_URL=http://localhost:3003

# Security
API_KEYS=key1,key2,key3

# Rate limiting
RATE_LIMIT_POINTS=30
RATE_LIMIT_WINDOW_SEC=60

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
```

---

## ▶️ Running the Application

```bash
npm install
npm run start:dev
```

Gateway runs on:

http://localhost:3000

---

## 📄 License

MIT License
