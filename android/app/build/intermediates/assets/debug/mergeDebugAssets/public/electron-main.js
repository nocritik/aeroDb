/*
 * Electron main process entry point.  Opens a browser window pointing at the
 * web UI and starts the same Node/Express API used for configuration
 * persistence.  The window loads files from the `app` directory so that the
 * same codebase can be packaged both for desktop (Electron) and mobile
 * (Cordova/Capacitor).  Serial/WiFi ports may be accessed directly via
 * Node modules when running inside Electron.
 */

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');

// reuse the server.js logic but serve from a static folder
function startConfigServer(port = 3000) {
    const serverApp = express();
    serverApp.use(bodyParser.json());
    serverApp.use(express.static(path.join(__dirname, '')));

    const INI_PATH = path.join(__dirname, 'config', 'config.ini');

    function readGauges() {
        const raw = fs.readFileSync(INI_PATH, 'utf8');
        const start = raw.indexOf('StartGauges');
        const end = raw.indexOf('EndGauges');
        if (start === -1 || end === -1) return [];
        const jsonText = raw.substring(start + 'StartGauges'.length, end).trim();
        try {
            const obj = JSON.parse(jsonText);
            return Array.isArray(obj.gauges) ? obj.gauges : [];
        } catch (e) {
            console.error('Failed to parse gauges block:', e);
            return [];
        }
    }
    function writeGauges(gauges) {
        const raw = fs.readFileSync(INI_PATH, 'utf8');
        const start = raw.indexOf('StartGauges');
        const end = raw.indexOf('EndGauges');
        if (start === -1 || end === -1) {
            throw new Error('Markers not found in config.ini');
        }
        const before = raw.slice(0, start + 'StartGauges'.length);
        const after = raw.slice(end);
        const newJson = '\n' + JSON.stringify({ gauges }, null, 2) + '\n';
        fs.writeFileSync(INI_PATH, before + newJson + after, 'utf8');
    }

    serverApp.get('/api/gauges', (req, res) => {
        res.json(readGauges());
    });
    serverApp.post('/api/gauges', (req, res) => {
        const gauge = req.body;
        if (!gauge || typeof gauge.id === 'undefined') {
            return res.status(400).send('Gauge object with id required');
        }
        const gauges = readGauges();
        if (gauges.find(g => g.id === gauge.id)) {
            return res.status(409).send('Gauge already exists');
        }
        gauges.push(gauge);
        writeGauges(gauges);
        res.status(201).send();
    });
    serverApp.put('/api/gauges/:id', (req, res) => {
        const id = req.params.id;
        const gauge = req.body;
        const gauges = readGauges();
        const idx = gauges.findIndex(g => String(g.id) === String(id));
        if (idx === -1) {
            return res.status(404).send('Gauge not found');
        }
        gauges[idx] = gauge;
        writeGauges(gauges);
        res.send();
    });
    serverApp.delete('/api/gauges/:id', (req, res) => {
        const id = req.params.id;
        let gauges = readGauges();
        const originalLength = gauges.length;
        gauges = gauges.filter(g => String(g.id) !== String(id));
        if (gauges.length === originalLength) {
            return res.status(404).send('Gauge not found');
        }
        writeGauges(gauges);
        res.send();
    });

    return serverApp.listen(port, () => {
        console.log(`Config server listening on http://localhost:${port}`);
    });
}

let mainWindow;
let configServer;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1024,
        height: 768,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'electron-preload.js')
        }
    });

    mainWindow.loadURL('http://localhost:3000/partial/gauge_page.html');
    mainWindow.on('closed', function () {
        mainWindow = null;
    });
}

app.on('ready', () => {
    configServer = startConfigServer();
    createWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('quit', () => {
    if (configServer) configServer.close();
});
