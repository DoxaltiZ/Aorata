# Aorata - Minecraft Server Hosting Platform

Free, instant Minecraft server hosting. Your own server in seconds.

## Features

- Instant server creation
- Real-time dashboard management
- Multiple server support
- Properties editor
- File manager
- Console access
- DDoS protection ready
- Global network support

## Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript
- **Backend**: Node.js, Express
- **Runtime**: Java (for Minecraft servers)
- **Hosting**: Netlify / Docker

## Local Development

### Prerequisites
- Node.js 16+
- Java 17+
- npm or yarn

### Setup

```bash
# Install dependencies
npm install

# Start development server
npm start
```

Server runs on `http://localhost:3000`

### Servers

Minecraft servers run on ports:
- Server 1: 25565
- Server 2: 25566
- Server 3: 25567

Connect in Minecraft: `localhost:25565` (or other port)

## Deployment to Netlify

### 1. Connect GitHub Repository
```
https://app.netlify.com
→ New site from Git
→ Connect your repo
```

### 2. Build Settings
- Build command: `npm start`
- Publish directory: `public`

### 3. Environment Variables
Set in Netlify Dashboard → Site Settings → Build & Deploy → Environment:
```
PORT=3000
NODE_ENV=production
```

### 4. Deploy
Push to main branch - Netlify auto-deploys!

## API Endpoints

### Servers
- `GET /api/servers` - List all servers
- `POST /api/servers` - Create new server
- `GET /api/servers/:id` - Get server info
- `POST /api/servers/:id/start` - Start server
- `POST /api/servers/:id/stop` - Stop server
- `DELETE /api/servers/:id` - Delete server

### Management
- `GET /api/servers/:id/properties` - Get server.properties
- `PUT /api/servers/:id/properties` - Update server.properties
- `GET /api/servers/:id/files` - List files
- `GET /api/servers/:id/files/:filename` - Read file
- `PUT /api/servers/:id/files/:filename` - Update file
- `POST /api/servers/:id/command` - Execute console command
- `GET /api/servers/:id/logs` - Get server logs
- `GET /api/health` - Health check

## File Structure

```
Aorata/
├── server.js              # Main Node.js server
├── package.json          # Dependencies
├── index.html            # Homepage
├── style.css             # Homepage styles
├── public/
│   ├── dashboard.html    # Dashboard UI
│   ├── dashboard.js      # Dashboard logic
│   └── style.css         # Dashboard styles
├── servers/              # Minecraft server directories
│   ├── server1/
│   ├── server2/
│   └── server3/
├── netlify.toml          # Netlify config
└── README.md             # This file
```

## Configuration

### Server Properties

Edit `servers/[server-id]/server.properties`:

```properties
server-port=25565
server-ip=0.0.0.0
online-mode=false
gamemode=survival
difficulty=2
max-players=20
pvp=true
enable-command-blocks=true
```

## License

© 2026 AORATA HOSTING. NOT AFFILIATED WITH MOJANG AB.

---

**Ready to host?** Visit http://localhost:3000/public/dashboard.html to create your first server!
