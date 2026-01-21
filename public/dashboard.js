const API_BASE = '/api';
let currentServerId = null;

// Load servers on page load
document.addEventListener('DOMContentLoaded', loadServers);

// Auto-refresh every 5 seconds
setInterval(loadServers, 5000);

async function loadServers() {
    try {
        const response = await fetch(`${API_BASE}/servers`);
        const servers = await response.json();

        updateStats(servers);
        renderServers(servers);
    } catch (error) {
        console.error('Error loading servers:', error);
    }
}

function updateStats(servers) {
    const running = servers.filter(s => s.status === 'running').length;
    const players = servers.reduce((sum, s) => sum + (s.players || 0), 0);

    document.getElementById('statTotal').textContent = servers.length;
    document.getElementById('statRunning').textContent = running;
    document.getElementById('statPlayers').textContent = players;
}

function renderServers(servers) {
    const container = document.getElementById('serversContainer');

    if (servers.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <i class="fas fa-inbox"></i>
                <p>No servers yet. Create one to get started!</p>
            </div>
        `;
        return;
    }

    container.innerHTML = servers.map(server => `
        <div class="server-card">
            <div class="server-header">
                <div class="server-name">${server.name}</div>
                <div class="status-badge ${server.status === 'running' ? '' : 'offline'}">
                    <span class="status-dot"></span>
                    ${server.status.toUpperCase()}
                </div>
            </div>
            
            <div class="server-info">
                <div>
                    <div class="info-label">Port</div>
                    <div class="info-value">${server.port}</div>
                </div>
                <div>
                    <div class="info-label">Players</div>
                    <div class="info-value">${server.players || 0}/${server.maxPlayers || 20}</div>
                </div>
                <div>
                    <div class="info-label">Version</div>
                    <div class="info-value">${server.version}</div>
                </div>
                <div>
                    <div class="info-label">Domain</div>
                    <div class="info-value" style="font-size:0.85rem; word-break:break-all;">${server.domain}</div>
                </div>
            </div>

            <div class="server-actions">
                <button class="btn-small btn-edit" onclick="openEditor('${server.id}')">
                    <i class="fas fa-edit"></i> Manage
                </button>
                ${server.status === 'running' ? `
                    <button class="btn-small btn-stop" onclick="stopServer('${server.id}')">
                        <i class="fas fa-stop"></i> Stop
                    </button>
                ` : `
                    <button class="btn-small" style="background:#22c55e; color:#000;" onclick="startServer('${server.id}')">
                        <i class="fas fa-play"></i> Start
                    </button>
                `}
                <button class="btn-small btn-delete" onclick="deleteServer('${server.id}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `).join('');
}

function openCreateModal() {
    document.getElementById('createModal').classList.add('active');
}

function closeCreateModal() {
    document.getElementById('createModal').classList.remove('active');
    document.getElementById('serverName').value = '';
}

async function createServer() {
    const name = document.getElementById('serverName').value.trim();
    const version = document.getElementById('serverVersion').value;
    const type = document.getElementById('serverType').value;

    if (!name) {
        showToast('Please enter a server name');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/servers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, version, type })
        });

        const result = await response.json();

        if (result.success) {
            showToast(`✅ Server "${name}" created successfully!`);
            closeCreateModal();
            loadServers();
        } else {
            showToast(`❌ Error: ${result.error}`);
        }
    } catch (error) {
        console.error('Error creating server:', error);
        showToast('❌ Failed to create server');
    }
}

async function startServer(serverId) {
    try {
        const response = await fetch(`${API_BASE}/servers/${serverId}/start`, {
            method: 'POST'
        });
        const result = await response.json();

        if (result.success) {
            showToast('✅ Server starting...');
            loadServers();
        } else {
            showToast(`❌ Error: ${result.error}`);
        }
    } catch (error) {
        console.error('Error starting server:', error);
        showToast('❌ Failed to start server');
    }
}

async function stopServer(serverId) {
    try {
        const response = await fetch(`${API_BASE}/servers/${serverId}/stop`, {
            method: 'POST'
        });
        const result = await response.json();

        if (result.success) {
            showToast('✅ Server stopping...');
            loadServers();
        } else {
            showToast(`❌ Error: ${result.error}`);
        }
    } catch (error) {
        console.error('Error stopping server:', error);
        showToast('❌ Failed to stop server');
    }
}

async function deleteServer(serverId) {
    if (!confirm('Are you sure? This will delete the server and all its files.')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/servers/${serverId}`, {
            method: 'DELETE'
        });
        const result = await response.json();

        if (result.success) {
            showToast('✅ Server deleted');
            loadServers();
        } else {
            showToast(`❌ Error: ${result.error}`);
        }
    } catch (error) {
        console.error('Error deleting server:', error);
        showToast('❌ Failed to delete server');
    }
}

async function openEditor(serverId) {
    currentServerId = serverId;
    document.getElementById('editorModal').classList.add('active');
    document.getElementById('editorTitle').textContent = `Server Editor - ${serverId.substring(0, 8)}...`;

    // Load properties
    loadProperties();
    loadFiles();
}

function closeEditor() {
    document.getElementById('editorModal').classList.remove('active');
    currentServerId = null;
}

function switchTab(tab) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));

    // Show selected tab
    document.getElementById(`tab-${tab}`).classList.add('active');
    event.target.classList.add('active');
}

async function loadProperties() {
    try {
        const response = await fetch(`${API_BASE}/servers/${currentServerId}/properties`);
        const result = await response.json();

        if (result.success) {
            document.getElementById('propertiesEditor').value = result.content;
        }
    } catch (error) {
        console.error('Error loading properties:', error);
    }
}

async function saveProperties() {
    const content = document.getElementById('propertiesEditor').value;

    try {
        const response = await fetch(`${API_BASE}/servers/${currentServerId}/properties`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content })
        });
        const result = await response.json();

        if (result.success) {
            showToast('✅ Properties saved');
        } else {
            showToast(`❌ Error: ${result.error}`);
        }
    } catch (error) {
        console.error('Error saving properties:', error);
        showToast('❌ Failed to save properties');
    }
}

async function loadFiles() {
    try {
        const response = await fetch(`${API_BASE}/servers/${currentServerId}/files`);
        const result = await response.json();

        if (result.success) {
            const filesList = document.getElementById('filesList');
            filesList.innerHTML = result.files.map(file => `
                <div style="padding:0.75rem; background:rgba(34,197,94,0.1); border-radius:6px; margin-bottom:0.5rem; display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <i class="fas fa-${file.isDirectory ? 'folder' : 'file'}"></i>
                        ${file.name}
                        ${file.size ? ` (${formatBytes(file.size)})` : ''}
                    </div>
                    ${!file.isDirectory && file.name !== 'server.jar' ? `
                        <button class="btn-small btn-edit" onclick="editFile('${file.name}')">Edit</button>
                    ` : ''}
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading files:', error);
    }
}

async function editFile(filename) {
    try {
        const response = await fetch(`${API_BASE}/servers/${currentServerId}/files/${filename}`);
        const result = await response.json();

        if (result.success) {
            const content = result.content;
            const newContent = prompt(`Edit ${filename}:`, content);

            if (newContent !== null) {
                const saveResponse = await fetch(`${API_BASE}/servers/${currentServerId}/files/${filename}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content: newContent })
                });
                const saveResult = await saveResponse.json();

                if (saveResult.success) {
                    showToast(`✅ ${filename} saved`);
                    loadFiles();
                }
            }
        }
    } catch (error) {
        console.error('Error editing file:', error);
        showToast('❌ Failed to edit file');
    }
}

async function executeCommand() {
    const command = document.getElementById('commandInput').value.trim();

    if (!command) return;

    try {
        const response = await fetch(`${API_BASE}/servers/${currentServerId}/command`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ command })
        });
        const result = await response.json();

        const consoleOutput = document.getElementById('consoleOutput');
        const time = new Date().toLocaleTimeString();
        consoleOutput.innerHTML += `<div>[${time}] > ${command}</div>`;
        consoleOutput.innerHTML += `<div style="color:#22c55e;">[${time}] ${result.message}</div>`;
        consoleOutput.scrollTop = consoleOutput.scrollHeight;

        document.getElementById('commandInput').value = '';
    } catch (error) {
        console.error('Error executing command:', error);
        showToast('❌ Failed to execute command');
    }
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #1a1f2e;
        color: #22c55e;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        border: 1px solid #22c55e;
        z-index: 2000;
        animation: slideIn 0.3s ease-out;
        font-weight: 600;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), 3000);
}
