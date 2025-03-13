# Candlestick Pattern Detection Platform

An advanced trading analysis platform that combines traditional technical analysis with machine learning for superior candlestick pattern detection.

## 🚀 Features

- Hybrid pattern detection using TA-Lib and Transformer models
- Real-time market data integration
- Interactive candlestick chart visualization
- AI-powered trading insights
- Pattern backtesting and performance analysis
- Real-time alerts and automated trading capabilities

## 🏗️ Architecture

The application consists of three main components:

1. **Frontend** (React + D3.js)
   - Interactive candlestick charts
   - Pattern visualization
   - Real-time updates
   - User dashboard

2. **Backend** (Node.js + Express)
   - Market data management
   - API integration
   - Real-time websocket connections
   - Trading automation

3. **ML Service** (Python)
   - TA-Lib pattern detection
   - Transformer-based pattern recognition
   - Backtesting engine
   - Risk analysis

## 🛠️ Tech Stack

- **Frontend**: React, D3.js, TypeScript
- **Backend**: Node.js, Express, TypeScript
- **ML Service**: Python, TA-Lib, PyTorch, Transformers
- **Database**: MongoDB
- **Cache**: Redis
- **Message Queue**: RabbitMQ
- **Containerization**: Docker

## 📦 Prerequisites

- Docker and Docker Compose
- Node.js 18+
- Python 3.9+
- MongoDB
- Redis

## 🚀 Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/candlestick-patterns.git
   ```

2. Start the development environment:
   ```bash
   docker-compose up
   ```

3. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - ML Service: http://localhost:8000

## 📚 API Documentation

API documentation is available at:
- REST API: http://localhost:5000/api-docs
- ML Service API: http://localhost:8000/docs

## 🧪 Testing

```bash
# Run frontend tests
cd frontend && npm test

# Run backend tests
cd backend && npm test

# Run ML service tests
cd ml_service && python -m pytest
```

## 📈 Performance Monitoring

- Frontend performance metrics: http://localhost:3000/metrics
- Backend metrics: http://localhost:5000/metrics
- ML Service metrics: http://localhost:8000/metrics

## 🔒 Security

- All API endpoints are secured with JWT authentication
- Rate limiting is implemented on all endpoints
- Data encryption in transit and at rest
- Regular security audits and dependency updates



## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 