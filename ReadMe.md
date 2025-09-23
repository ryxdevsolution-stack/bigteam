# BigTeam Community Platform - Phase 1 CRM Solution

A complete community engagement platform built with modern technologies for scalable content management and user interaction.

## 🏗️ System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Database      │
│   React + TS    │◄──►│  Python Flask   │◄──►│   Supabase      │
│   Admin Panel   │    │   REST API      │    │   PostgreSQL    │
│   User Portal   │    │   Auth System   │    │   File Storage  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         │              │  Cache Layer    │              │
         └──────────────│     Redis       │──────────────┘
                        │   Session/Data  │
                        └─────────────────┘
                                 │
                        ┌─────────────────┐
                        │  Infrastructure │
                        │ Docker+K8s+CDN  │
                        └─────────────────┘
```

## 🎯 Core Features

### Admin Panel Features
- **User Management**: Create users with credentials, manage access levels
- **Content Management**: Upload/publish videos, images, and advertisements
- **Advertisement System**: Schedule ads, manage banner rotations
- **Analytics Dashboard**: Track user engagement, content performance
- **Real-time Monitoring**: User activity, system health metrics

### User Portal Features
- **Media Feed**: Instagram/TikTok-style content browsing
- **Reels/Shorts Player**: Vertical video viewing experience
- **Social Interactions**: Like, react, and share posts
- **Profile Management**: Personal settings and activity history
- **Responsive Design**: Mobile-first approach

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18 + TypeScript
- **State Management**: Redux Toolkit + RTK Query
- **Styling**: Tailwind CSS + Framer Motion
- **Build Tool**: Vite
- **Testing**: Vitest + React Testing Library

### Backend
- **API Framework**: Python Flask + Flask-RESTful
- **Authentication**: JWT + Flask-JWT-Extended
- **Database ORM**: SQLAlchemy
- **File Upload**: Flask-Upload + Multipart handling
- **API Documentation**: Flask-RESTX (Swagger)

### Database & Storage
- **Primary Database**: Supabase (PostgreSQL)
- **File Storage**: Supabase Storage + CDN
- **Cache**: Redis (Session + Data caching)
- **Search**: PostgreSQL Full-Text Search

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Orchestration**: Kubernetes
- **CI/CD**: GitHub Actions
- **Monitoring**: Prometheus + Grafana
- **Load Balancer**: NGINX

## 📁 Project Structure

```
bigteam-platform/
├── frontend/                    # React TypeScript Frontend
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── admin/         # Admin-specific components
│   │   │   ├── user/          # User portal components
│   │   │   └── shared/        # Common components
│   │   ├── pages/             # Page components
│   │   │   ├── admin/         # Admin dashboard pages
│   │   │   └── user/          # User portal pages
│   │   ├── hooks/             # Custom React hooks
│   │   ├── store/             # Redux store configuration
│   │   ├── services/          # API service layer
│   │   ├── utils/             # Utility functions
│   │   └── types/             # TypeScript type definitions
│   ├── public/                # Static assets
│   └── package.json
├── backend/                    # Python Flask Backend
│   ├── app/
│   │   ├── api/               # API route handlers
│   │   │   ├── admin/         # Admin endpoints
│   │   │   ├── user/          # User endpoints
│   │   │   └── auth/          # Authentication endpoints
│   │   ├── models/            # Database models
│   │   ├── services/          # Business logic layer
│   │   ├── utils/             # Utility functions
│   │   ├── middleware/        # Custom middleware
│   │   └── config/            # Configuration files
│   ├── migrations/            # Database migrations
│   ├── tests/                 # Backend tests
│   └── requirements.txt
├── infrastructure/             # DevOps configuration
│   ├── docker/                # Docker configurations
│   ├── kubernetes/            # K8s manifests
│   ├── nginx/                 # Load balancer config
│   └── monitoring/            # Prometheus/Grafana setup
├── docs/                      # Documentation
└── scripts/                   # Deployment scripts
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+
- Docker & Docker Compose
- Supabase Account

### Environment Setup

1. **Clone the repository**
```bash
git clone https://github.com/yourorg/bigteam-platform.git
cd bigteam-platform
```

2. **Backend Setup**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

3. **Frontend Setup**
```bash
cd frontend
npm install
```

4. **Environment Variables**

Create `.env` files:

**Backend `.env`:**
```env
FLASK_APP=app
FLASK_ENV=development
DATABASE_URL=postgresql://user:password@localhost:5432/bigteam
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
JWT_SECRET_KEY=your-secret-key
REDIS_URL=redis://localhost:6379
UPLOAD_FOLDER=uploads
MAX_CONTENT_LENGTH=100MB
```

**Frontend `.env`:**
```env
VITE_API_BASE_URL=http://localhost:5000
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Database Schema

```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Posts table
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    content TEXT,
    media_type VARCHAR(20) NOT NULL, -- 'video', 'image'
    media_url VARCHAR(500) NOT NULL,
    thumbnail_url VARCHAR(500),
    created_by UUID REFERENCES users(id),
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Advertisements table
CREATE TABLE advertisements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    media_type VARCHAR(20) NOT NULL,
    media_url VARCHAR(500) NOT NULL,
    ad_type VARCHAR(20) NOT NULL, -- 'banner', 'in_stream'
    is_active BOOLEAN DEFAULT true,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- User interactions table
CREATE TABLE user_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    post_id UUID REFERENCES posts(id),
    interaction_type VARCHAR(20) NOT NULL, -- 'like', 'share', 'view'
    created_at TIMESTAMP DEFAULT NOW()
);
```

## 🔧 Development

### Running in Development Mode

1. **Start Backend**
```bash
cd backend
python app.py
# Backend runs on http://localhost:5000
```

2. **Start Frontend**
```bash
cd frontend
npm run dev
# Frontend runs on http://localhost:3000
```

3. **Start Redis Cache**
```bash
docker run -d -p 6379:6379 redis:alpine
```

### API Endpoints

#### Authentication
```
POST /api/auth/login          # User login
POST /api/auth/logout         # User logout
POST /api/auth/refresh        # Refresh JWT token
```

#### Admin Endpoints
```
POST /api/admin/users         # Create new user
GET  /api/admin/users         # List all users
PUT  /api/admin/users/:id     # Update user
DELETE /api/admin/users/:id   # Delete user

POST /api/admin/posts         # Create post
GET  /api/admin/posts         # List all posts
PUT  /api/admin/posts/:id     # Update post
DELETE /api/admin/posts/:id   # Delete post

POST /api/admin/ads           # Create advertisement
GET  /api/admin/ads           # List all ads
PUT  /api/admin/ads/:id       # Update ad
```

#### User Endpoints
```
GET  /api/posts               # Get feed posts
GET  /api/posts/:id           # Get specific post
POST /api/posts/:id/interact  # Like/share post
GET  /api/user/profile        # Get user profile
PUT  /api/user/profile        # Update profile
```

## 🐳 Docker Deployment

### Development with Docker Compose

```yaml
version: '3.8'
services:
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - VITE_API_BASE_URL=http://backend:5000
  
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/bigteam
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
  
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: bigteam
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
  
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

Run with:
```bash
docker-compose up -d
```

## ☸️ Kubernetes Deployment

### Namespace and ConfigMap
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: bigteam

---
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: bigteam
data:
  DATABASE_URL: "postgresql://user:pass@postgres:5432/bigteam"
  REDIS_URL: "redis://redis:6379"
```

### Backend Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  namespace: bigteam
spec:
  replicas: 3
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: backend
        image: bigteam/backend:latest
        ports:
        - containerPort: 5000
        envFrom:
        - configMapRef:
            name: app-config
```

### Frontend Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
  namespace: bigteam
spec:
  replicas: 2
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
      - name: frontend
        image: bigteam/frontend:latest
        ports:
        - containerPort: 3000
```

Deploy to Kubernetes:
```bash
kubectl apply -f infrastructure/kubernetes/
```

## 📊 Monitoring & Analytics

### Performance Metrics
- **Response Time**: API endpoint performance
- **User Engagement**: Likes, shares, view duration
- **System Health**: CPU, memory, disk usage
- **Content Analytics**: Popular posts, user activity patterns

### Caching Strategy
- **Redis Cache**: Session data, frequently accessed posts
- **CDN**: Static assets, media files
- **Database Query Optimization**: Indexing, query caching

## 🔐 Security Features

- **JWT Authentication**: Secure token-based auth
- **Role-Based Access Control**: Admin vs User permissions
- **Input Validation**: SQL injection prevention
- **File Upload Security**: Type validation, size limits
- **CORS Configuration**: Cross-origin request handling
- **Rate Limiting**: API abuse prevention

## 📈 Scalability Considerations

- **Horizontal Scaling**: Multiple backend instances
- **Database Optimization**: Connection pooling, read replicas
- **Media Optimization**: Video transcoding, image compression
- **Cache Layers**: Redis for session and data caching
- **Load Balancing**: NGINX for traffic distribution

## 🧪 Testing

### Backend Testing
```bash
cd backend
pytest tests/
```

### Frontend Testing
```bash
cd frontend
npm test
```

### E2E Testing
```bash
npm run test:e2e
```

## 📦 Production Deployment

1. **Build Images**
```bash
docker build -t bigteam/backend:v1.0 ./backend
docker build -t bigteam/frontend:v1.0 ./frontend
```

2. **Deploy to Kubernetes**
```bash
kubectl apply -f infrastructure/kubernetes/production/
```

3. **Configure Domain & SSL**
```bash
kubectl apply -f infrastructure/kubernetes/ingress.yaml
```

## 📋 Development Roadmap

### Phase 1 (Current)
- ✅ User authentication system
- ✅ Admin panel for user management
- ✅ Content upload and management
- ✅ Basic user feed with interactions
- ✅ Advertisement system

### Phase 2 (Future)
- 🔄 Advanced analytics dashboard
- 🔄 Real-time notifications
- 🔄 Mobile app (React Native)
- 🔄 Advanced content recommendation
- 🔄 Multi-language support

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support and questions:
- Email: support@bigteam.com
- Documentation: [docs.bigteam.com](https://docs.bigteam.com)
- Issues: GitHub Issues tab

---

**BigTeam Platform** - Building communities through engaging content experiences.