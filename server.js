const express = require('express');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');
const { spawn } = require('child_process');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const SERVERS_DIR = path.join(__dirname, 'servers');

// Ensure servers directory exists
fs.ensureDirSync(SERVERS_DIR);

// Middleware
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'], credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.text({ limit: '50mb' }));
app.use(express.static('public'));
app.use(express.static('.'));

// Store for active servers
const activeServers = new Map();

// Get next available port
function getNextAvailablePort() {
    return 25565 + activeServers.size;
}

// Load existing servers and auto-start them
function loadExistingServers() {
    try {
        const serverDirs = fs.readdirSync(SERVERS_DIR, { withFileTypes: true })
            .filter(f => f.isDirectory())
            .map(f => f.name);
        
        let portCounter = 25565;
        
        serverDirs.forEach((serverId) => {
            const serverDir = path.join(SERVERS_DIR, serverId);
            const propsFile = path.join(serverDir, 'server.properties');
            
            if (fs.existsSync(propsFile)) {
                const propsContent = fs.readFileSync(propsFile, 'utf8');
                const motdMatch = propsContent.match(/motd=(.+)/);
                const portMatch = propsContent.match(/server-port=(\d+)/);
                
                const serverName = motdMatch ? motdMatch[1].trim() : `Server-${serverId.slice(0, 8)}`;
                const port = portMatch ? parseInt(portMatch[1]) : portCounter++;
                
                const serverInfo = {
                    id: serverId,
                    name: serverName,
                    version: '1.20.1',
                    type: 'vanilla',
                    port,
                    dir: serverDir,
                    players: 0,
                    maxPlayers: 20,
                    process: null,
                    createdAt: new Date(),
                    logs: [],
                    jarPath: path.join(serverDir, 'server.jar'),
                    autoStart: true
                };
                
                // Update server.properties with correct port if needed
                if (!portMatch || parseInt(portMatch[1]) !== port) {
                    const updatedProps = propsContent.replace(/server-port=\d+/, `server-port=${port}`);
                    fs.writeFileSync(propsFile, updatedProps);
                }
                
                activeServers.set(serverId, serverInfo);
                console.log(`📂 Loaded: ${serverName} (${serverId}) on port ${port}`);
            }
        });
        
        console.log(`\n🔄 Auto-starting ${activeServers.size} servers...`);
        // Auto-start all servers after a short delay
        setTimeout(() => {
            activeServers.forEach((server) => {
                autoStartServer(server);
            });
        }, 1000);
    } catch (error) {
        console.error('Error loading existing servers:', error.message);
    }
}

// Auto-start a server
function autoStartServer(s) {
    if (s.process) return;
    
    console.log(`🚀 Auto-starting: ${s.name}`);
    
    try {
        if (!fs.existsSync(s.jarPath)) {
            console.log(`⚠️  Server JAR not found at ${s.jarPath}`);
            return;
        }

        const javaProcess = spawn('java', [
            '-Xmx512M',
            '-Xms512M',
            '-jar',
            'server.jar',
            'nogui'
        ], {
            cwd: s.dir,
            stdio: ['pipe', 'pipe', 'pipe']
        });

        s.process = javaProcess;
        s.players = 0;
        s.logs = [];

        javaProcess.stdout.on('data', (data) => {
            const line = data.toString().trim();
            s.logs.push(line);
            if (s.logs.length > 100) s.logs.shift();
            console.log(`[${s.name}] ${line}`);

            if (line.includes('Done') || line.includes('For help')) {
                console.log(`✅ Server online: ${s.name} on port ${s.port}`);
            }
        });

        javaProcess.stderr.on('data', (data) => {
            const line = data.toString().trim();
            console.error(`[${s.name}] ERR: ${line}`);
        });

        javaProcess.on('exit', (code) => {
            console.log(`⏹️  Server stopped: ${s.name} (exit code: ${code})`);
            s.process = null;
            s.players = 0;
        });
    } catch (error) {
        console.error(`❌ Failed to auto-start server: ${error.message}`);
    }
}

// ==================== ROUTES ====================

// Serve index.html on root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Subdomain routing
app.get('*', (req, res, next) => {
    const host = req.hostname || '';
    const serverId = host.split('.')[0];
    if (serverId && serverId !== 'localhost' && serverId !== 'www' && !serverId.includes('127')) {
        const server = Array.from(activeServers.values()).find(s => s.name.toLowerCase().replace(/\s+/g, '-') === serverId);
        if (server) {
            return res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
        }
    }
    next();
});

// Get all servers
app.get('/api/servers', (req, res) => {
    const servers = Array.from(activeServers.values()).map(s => ({
        id: s.id,
        name: s.name,
        status: s.process ? 'running' : 'stopped',
        players: s.players || 0,
        maxPlayers: s.maxPlayers || 20,
        port: s.port,
        version: s.version,
        type: s.type,
        createdAt: s.createdAt,
        domain: `${s.name.toLowerCase().replace(/\s+/g, '-')}.aorata.net`
    }));
    res.json(servers);
});

// Create server
app.post('/api/servers', async (req, res) => {
    try {
        const { name, version = '1.20.1', type = 'vanilla' } = req.body;

        console.log('📨 Create request:', { name, version, type });

        if (!name || !name.trim()) {
            return res.status(400).json({ success: false, error: 'Server name required' });
        }

        const serverId = uuidv4();
        const serverDir = path.join(SERVERS_DIR, serverId);

        await fs.ensureDir(serverDir);

        // Create EULA
        await fs.writeFile(path.join(serverDir, 'eula.txt'), 'eula=true\n');

        // Get port
        const port = getNextAvailablePort();

        // Create server.properties
        const props = `#Minecraft server properties
server-port=${port}
server-ip=0.0.0.0
online-mode=false
gamemode=survival
difficulty=2
max-players=20
pvp=true
enable-command-blocks=true
view-distance=10
simulation-distance=10
motd=${name}
enable-query=true
query.port=${port}
rcon.enabled=true
rcon.port=${port + 1000}
rcon.password=aorata123
`;
        await fs.writeFile(path.join(serverDir, 'server.properties'), props);

        // Store server info
        const serverInfo = {
            id: serverId,
            name,
            version,
            type,
            port,
            dir: serverDir,
            players: 0,
            maxPlayers: 20,
            process: null,
            createdAt: new Date(),
            logs: [],
            jarPath: path.join(serverDir, 'server.jar')
        };

        activeServers.set(serverId, serverInfo);

        console.log(`✅ Server created: ${name} (${serverId}) on port ${port}`);

        res.json({
            success: true,
            server: {
                id: serverId,
                name,
                port,
                status: 'stopped',
                version,
                type,
                domain: `${name.toLowerCase().replace(/\s+/g, '-')}.aorata.net`
            }
        });
    } catch (error) {
        console.error('❌ Create error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get server
app.get('/api/servers/:id', (req, res) => {
    const s = activeServers.get(req.params.id);
    if (!s) return res.status(404).json({ success: false, error: 'Not found' });

    res.json({
        id: s.id,
        name: s.name,
        status: s.process ? 'running' : 'stopped',
        players: s.players || 0,
        maxPlayers: s.maxPlayers || 20,
        port: s.port,
        version: s.version,
        type: s.type,
        createdAt: s.createdAt,
        domain: `${s.name.toLowerCase().replace(/\s+/g, '-')}.aorata.net`
    });
});

// Start server with REAL Minecraft process
app.post('/api/servers/:id/start', (req, res) => {
    const s = activeServers.get(req.params.id);
    if (!s) return res.status(404).json({ success: false, error: 'Not found' });

    if (s.process) {
        return res.json({ success: true, message: 'Already running' });
    }

    console.log(`🚀 Starting: ${s.name}`);

    try {
        // Check if server.jar exists
        if (!fs.existsSync(s.jarPath)) {
            console.log(`⚠️  Server JAR not found at ${s.jarPath}`);
            return res.status(400).json({ success: false, error: 'Server JAR not found. Upload server.jar to the server directory.' });
        }

        // Spawn Java process with Minecraft server
        const javaProcess = spawn('java', [
            '-Xmx1024M',
            '-Xms1024M',
            '-jar',
            'server.jar',
            'nogui'
        ], {
            cwd: s.dir,
            stdio: ['pipe', 'pipe', 'pipe']
        });

        s.process = javaProcess;
        s.players = 0;
        s.logs = [];

        // Capture stdout
        javaProcess.stdout.on('data', (data) => {
            const line = data.toString().trim();
            s.logs.push(line);
            if (s.logs.length > 100) s.logs.shift();
            console.log(`[${s.name}] ${line}`);

            // Parse player count from Minecraft logs
            if (line.includes('players online:')) {
                const match = line.match(/(\d+).*players online/);
                if (match) s.players = parseInt(match[1]);
            }
        });

        // Capture stderr
        javaProcess.stderr.on('data', (data) => {
            const line = data.toString().trim();
            console.error(`[${s.name}] ERR: ${line}`);
        });

        // Handle process exit
        javaProcess.on('exit', (code) => {
            console.log(`⏹️  Server stopped: ${s.name} (exit code: ${code})`);
            s.process = null;
            s.players = 0;
        });

        res.json({ success: true, message: `Server starting on port ${s.port}...` });
    } catch (error) {
        console.error(`❌ Failed to start server: ${error.message}`);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Stop server
app.post('/api/servers/:id/stop', (req, res) => {
    const s = activeServers.get(req.params.id);
    if (!s) return res.status(404).json({ success: false, error: 'Not found' });

    if (s.process) {
        // Kill the Java process
        s.process.kill('SIGTERM');
        
        // Force kill if not dead after 5 seconds
        setTimeout(() => {
            if (s.process && !s.process.killed) {
                s.process.kill('SIGKILL');
            }
        }, 5000);

        s.players = 0;
        console.log(`⏹️  Stopped: ${s.name}`);
    }

    res.json({ success: true, message: 'Server stopped' });
});

// Delete server
app.delete('/api/servers/:id', async (req, res) => {
    const s = activeServers.get(req.params.id);
    if (!s) return res.status(404).json({ success: false, error: 'Not found' });

    if (s.process) {
        s.process.kill('SIGKILL');
    }
    
    await fs.remove(s.dir);
    activeServers.delete(req.params.id);

    console.log(`🗑️  Deleted: ${s.name}`);
    res.json({ success: true, message: 'Server deleted' });
});

// Get server.properties
app.get('/api/servers/:id/properties', (req, res) => {
    const s = activeServers.get(req.params.id);
    if (!s) return res.status(404).json({ success: false, error: 'Not found' });

    const propsFile = path.join(s.dir, 'server.properties');
    const content = fs.readFileSync(propsFile, 'utf8');
    res.json({ success: true, content });
});

// Update server.properties
app.put('/api/servers/:id/properties', async (req, res) => {
    const s = activeServers.get(req.params.id);
    if (!s) return res.status(404).json({ success: false, error: 'Not found' });

    const { content } = req.body;
    const propsFile = path.join(s.dir, 'server.properties');
    await fs.writeFile(propsFile, content, 'utf8');

    res.json({ success: true, message: 'Properties updated' });
});

// List files
app.get('/api/servers/:id/files', (req, res) => {
    const s = activeServers.get(req.params.id);
    if (!s) return res.status(404).json({ success: false, error: 'Not found' });

    const files = fs.readdirSync(s.dir, { withFileTypes: true }).map(f => ({
        name: f.name,
        isDirectory: f.isDirectory(),
        size: f.isDirectory() ? 0 : fs.statSync(path.join(s.dir, f.name)).size
    }));

    res.json({ success: true, files });
});

// Get file
app.get('/api/servers/:id/files/:filename', (req, res) => {
    const s = activeServers.get(req.params.id);
    if (!s) return res.status(404).json({ success: false, error: 'Not found' });

    const filePath = path.join(s.dir, req.params.filename);
    if (!filePath.startsWith(s.dir)) {
        return res.status(403).json({ success: false, error: 'Access denied' });
    }

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ success: false, error: 'File not found' });
    }

    const content = fs.readFileSync(filePath, 'utf8');
    res.json({ success: true, content });
});

// Update file
app.put('/api/servers/:id/files/:filename', async (req, res) => {
    const s = activeServers.get(req.params.id);
    if (!s) return res.status(404).json({ success: false, error: 'Not found' });

    const filePath = path.join(s.dir, req.params.filename);
    if (!filePath.startsWith(s.dir)) {
        return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const { content } = req.body;
    await fs.writeFile(filePath, content, 'utf8');

    res.json({ success: true, message: 'File updated' });
});

// Execute command (send to Minecraft STDIN if server is running)
app.post('/api/servers/:id/command', (req, res) => {
    const s = activeServers.get(req.params.id);
    if (!s) return res.status(404).json({ success: false, error: 'Not found' });

    if (!s.process) {
        return res.status(400).json({ success: false, error: 'Server not running' });
    }

    const { command } = req.body;
    
    // Send command to server stdin
    s.process.stdin.write(command + '\n');
    
    res.json({ success: true, message: `Command sent: ${command}` });
});

// Get server logs
app.get('/api/servers/:id/logs', (req, res) => {
    const s = activeServers.get(req.params.id);
    if (!s) return res.status(404).json({ success: false, error: 'Not found' });

    res.json({ success: true, logs: s.logs });
});

// Health
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        servers: activeServers.size,
        running: Array.from(activeServers.values()).filter(s => s.process).length
    });
});

app.listen(PORT, () => {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`🎮 AORATA MINECRAFT HOSTING`);
    console.log(`${'='.repeat(50)}`);
    console.log(`📍 http://localhost:${PORT}`);
    console.log(`📊 Servers: ${SERVERS_DIR}`);
    console.log(`${'='.repeat(50)}\n`);
    
    // Load and auto-start existing servers
    loadExistingServers();
});
