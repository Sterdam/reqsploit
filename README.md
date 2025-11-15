# ReqSploit

> Modern MITM Proxy & HTTP Request Interceptor - Like Burp Suite, but web-based

ReqSploit is a powerful, web-based HTTP/HTTPS request interception and analysis tool, designed for security researchers, penetration testers, and developers.

## ✨ Features

- 🔍 **HTTP/HTTPS Interception** - Intercept and modify HTTP/HTTPS traffic in real-time
- 🌐 **Chrome Extension** - One-click proxy toggle directly from your browser
- 📊 **Real-time Dashboard** - Modern React-based UI with live request monitoring
- 🔐 **SSL/TLS Support** - Built-in certificate generation for HTTPS interception
- 🤖 **AI-Powered Analysis** - Anthropic Claude integration for request analysis
- 💾 **Request History** - Store and organize intercepted requests
- 🎯 **Project Management** - Organize your security testing by projects
- 🔄 **WebSocket Support** - Real-time updates via WebSocket
- 🐳 **Docker Ready** - Full Docker Compose setup for easy deployment

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 18+ (for local development)
- Google Chrome (for extension)

### Installation

1. **Clone the repository**
   ```bash
   git clone git@github.com:Sterdam/reqsploit.git
   cd reqsploit
   ```

2. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   # IMPORTANT: Set your ANTHROPIC_API_KEY
   ```

3. **Start with Docker Compose**
   ```bash
   docker-compose up -d
   ```

4. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000
   - Health check: http://localhost:3000/health

### Chrome Extension Setup

1. **Load the extension**
   - Open Chrome and navigate to `chrome://extensions`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `extension/` folder

2. **Configure Frontend**
   - Copy your extension ID from `chrome://extensions`
   - Add to `frontend/.env.development`:
     ```
     VITE_EXTENSION_ID=your-extension-id-here
     ```
   - Restart frontend container

3. **Install SSL Certificate** (for HTTPS interception)
   - Click the ReqSploit extension icon
   - Click "Download Certificate"
   - Install in your system's trusted root store
   - Restart Chrome

## 🔧 Configuration

Key environment variables in `.env`:

```bash
# Backend
BACKEND_PORT=3000
PROXY_PORT_START=8080

# Database
POSTGRES_DB=reqsploit
POSTGRES_USER=interceptor
POSTGRES_PASSWORD=your-secure-password

# Authentication
JWT_SECRET=your-jwt-secret

# AI Analysis (Optional)
ANTHROPIC_API_KEY=your-anthropic-key
```

## 📖 Usage

1. **Create an account** in the Dashboard
2. **Login** to authenticate
3. **Enable proxy** via Chrome extension
4. **Navigate** to any website
5. **View intercepted requests** in Dashboard

## 🛠️ Development

```bash
# Backend
cd backend && npm install && npm run dev

# Frontend
cd frontend && npm install && npm run dev
```

## 🔒 Security

- All secrets stored in `.env` (gitignored)
- JWT authentication
- SSL/TLS with custom CA
- Rate limiting
- Helmet.js security headers

## 📝 License

MIT License

---

**⚠️ Disclaimer**: For authorized security testing and educational purposes only.
