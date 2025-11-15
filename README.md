# ReqSploit

> Modern MITM Proxy & HTTP Request Interceptor - Professional Burp Suite Alternative

ReqSploit is a powerful, web-based HTTP/HTTPS request interception and analysis tool with **full Burp Suite feature parity**, designed for security researchers, penetration testers, and developers.

## ✨ Core Features (Burp Suite Parity)

### 🎯 Intercept
- 🔍 **Request Queue System** - Hold, modify, forward, or drop HTTP/HTTPS requests
- ⏱️ **60-second Auto-timeout** - Automatic forwarding with configurable timeout
- ✏️ **Live Editing** - Modify method, URL, headers, and body in real-time
- 🔄 **WebSocket Integration** - Real-time queue updates across all clients

### 🔁 Repeater
- 📑 **Multi-Tab Interface** - Work on multiple requests simultaneously
- 📜 **Request History** - Track all sent requests with responses
- 💾 **Template System** - Save and reuse common requests
- ⚡ **Response Timing** - Accurate response time measurement
- 🔄 **Send to Repeater** - Right-click context menu from request list

### 🔧 Decoder/Encoder/Hasher
- 🔤 **Encoding Support**: URL, Base64, HTML, Hex, Unicode
- 🔓 **Smart Auto-Detection** - Automatically detect encoding type
- #️⃣ **Hashing Algorithms**: MD5, SHA-1, SHA-256, SHA-512
- 🔄 **Swap Input/Output** - Chain operations seamlessly
- 📚 **Operation History** - Track last 50 operations with click-to-load
- ⚡ **Quick Actions** - One-click common operations

### 💥 Intruder/Fuzzing
- 🎯 **Visual Marker System** - Simple §marker§ syntax for payload positions
- 🚀 **4 Attack Types**:
  - **Sniper**: Test each position independently
  - **Battering Ram**: Same payload for all positions
  - **Pitchfork**: Parallel iteration through payloads
  - **Cluster Bomb**: All combinations (Cartesian product)
- 📦 **Built-in Payloads**:
  - SQL Injection (18 payloads)
  - XSS (15 payloads)
  - LFI/RFI (11 payloads)
  - Command Injection (15 payloads)
  - Common usernames & passwords
- 🔢 **Number Range Generator** - From/To/Step configuration
- 📝 **Custom Payload Lists** - One payload per line
- 🎛️ **Concurrency Control** - 1-20 parallel requests
- ⏱️ **Delay Configuration** - Millisecond-level timing control
- 📊 **Real-time Progress** - Live updates with progress bars
- 🎨 **Color-coded Results** - Visual status code analysis
- ⏸️ **Pause/Resume/Stop** - Full campaign control

### 🌐 Additional Features
- 🤖 **AI-Powered Analysis** - Anthropic Claude integration for request analysis
- 💾 **Request History** - Store and organize intercepted requests
- 🎯 **Project Management** - Organize your security testing by projects
- 🔐 **SSL/TLS Support** - Built-in certificate generation for HTTPS interception
- 🌐 **Chrome Extension** - One-click proxy toggle directly from your browser
- 📱 **Responsive Design** - Full mobile and desktop support
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

### Basic Workflow

1. **Create an account** in the Dashboard
2. **Login** to authenticate
3. **Enable proxy** via Chrome extension
4. **Navigate** to any website
5. **View intercepted requests** in Dashboard

### Using Intercept

1. Navigate to **Intercept** tab
2. Enable intercept mode
3. Requests will be held in queue
4. Modify method, URL, headers, or body
5. **Forward**, **Drop**, or **Modify & Forward**

### Using Repeater

1. Right-click request in history → "Send to Repeater"
2. Or create new tab manually
3. Modify request as needed
4. Click **Send** to execute
5. View response and timing
6. Save as template for reuse

### Using Decoder

1. Navigate to **Decoder** tab
2. Paste input text
3. Select operation: **Encode**, **Decode**, or **Hash**
4. Choose encoding type or algorithm
5. Or use **Auto-Detect** for smart decoding
6. Use **Swap** to chain operations

### Using Intruder

1. Navigate to **Intruder** tab
2. Click **New Campaign**
3. Enter request template with `§markers§`
4. Configure payload sets for each position
5. Select attack type (Sniper/Battering Ram/Pitchfork/Cluster Bomb)
6. Set concurrency and delay
7. Click **Create Campaign** then **Start**
8. Monitor real-time progress and results

## 🏗️ Architecture

### Tech Stack

**Frontend**:
- React 18 + TypeScript
- Vite (build tool)
- TailwindCSS (styling)
- Zustand (state management)
- React Resizable Panels (layout)
- Lucide Icons

**Backend**:
- Node.js + TypeScript
- Express.js (REST API)
- Prisma ORM (database)
- PostgreSQL (data storage)
- Socket.IO (WebSocket)
- HTTP/HTTPS proxy with MITM

**Infrastructure**:
- Docker + Docker Compose
- Redis (caching)
- Nginx (optional reverse proxy)

### Project Structure

```
burponweb/
├── backend/
│   ├── src/
│   │   ├── api/routes/          # API endpoints
│   │   ├── core/                # Core services
│   │   │   ├── proxy/           # MITM proxy, request queue
│   │   │   └── websocket/       # WebSocket server
│   │   ├── services/            # Business logic
│   │   │   ├── repeater.service.ts
│   │   │   ├── decoder.service.ts
│   │   │   ├── payload-engine.service.ts
│   │   │   └── campaign-manager.service.ts
│   │   └── lib/                 # Utilities
│   └── prisma/
│       └── schema.prisma        # Database schema
├── frontend/
│   ├── src/
│   │   ├── components/          # React components
│   │   │   ├── InterceptPanel.tsx
│   │   │   ├── RepeaterPanel.tsx
│   │   │   ├── DecoderPanel.tsx
│   │   │   └── IntruderPanel.tsx
│   │   ├── stores/              # Zustand stores
│   │   │   ├── interceptStore.ts
│   │   │   ├── repeaterStore.ts
│   │   │   ├── decoderStore.ts
│   │   │   └── intruderStore.ts
│   │   └── pages/
│   │       └── Dashboard.tsx    # Main dashboard
│   └── public/
├── extension/                   # Chrome extension
│   ├── background.js
│   ├── popup.html
│   └── manifest.json
└── docker-compose.prod.yml
```

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
