
/**
 * Simple Express server to serve static files and provide an API for writing
 * gauge configuration into config/config.ini.  Running `node server.js` from
 * the project root will listen on port 3000 by default.
 *
 * The config.ini file is mostly a standard INI used elsewhere in the
 * application; gauge configuration is stored as a JSON blob between two
 * specially marked comment lines (`StartGauges` / `EndGauges`).  This keeps
 * the legacy INI format intact while allowing the frontend to fetch and
 * update gauge definitions without needing a full INI parser.
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;
const INI_PATH = path.join(__dirname, 'config', 'config.ini');

app.use(bodyParser.json());
app.use(express.static(__dirname)); // serve project files

// helpers to load/save JSON block inside ini
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

// Helper to update a key=value line in a specific INI section
function updateIniValue(content, section, key, value) {
    const sectionRegex = new RegExp(`(\\[${section}\\][^\\[]*?)${key}\\s*=\\s*[^\\n]*`, 's');
    if (sectionRegex.test(content)) {
        return content.replace(sectionRegex, `$1${key} = ${value}`);
    }
    return content;
}

app.put('/api/config', (req, res) => {
    console.log('[API] PUT /api/config', req.body);
    const cfg = req.body;
    if (!cfg) return res.status(400).send('Config object required');
    try {
        let raw = fs.readFileSync(INI_PATH, 'utf8');
        if (cfg.environment !== undefined)   raw = updateIniValue(raw, 'General', 'Environment', cfg.environment);
        if (cfg.dataSource !== undefined)    raw = updateIniValue(raw, 'General', 'DataSource',  cfg.dataSource);
        if (cfg.wifi?.host !== undefined)    raw = updateIniValue(raw, 'WiFi',    'Host',         cfg.wifi.host);
        if (cfg.wifi?.port !== undefined)    raw = updateIniValue(raw, 'WiFi',    'Port',         cfg.wifi.port);
        if (cfg.usb?.port !== undefined)     raw = updateIniValue(raw, 'USB',     'Port',         cfg.usb.port);
        if (cfg.usb?.baudRate !== undefined)           raw = updateIniValue(raw, 'USB',     'BaudRate',             cfg.usb.baudRate);
        if (cfg.gaugeAnimationDuration !== undefined)  raw = updateIniValue(raw, 'General', 'GaugeAnimationDuration', cfg.gaugeAnimationDuration);
        fs.writeFileSync(INI_PATH, raw, 'utf8');
        res.send();
    } catch (err) {
        console.error('[API] PUT /api/config error:', err);
        res.status(500).send(err.message);
    }
});

app.get('/api/gauges', (req, res) => {
    console.log('[API] GET /api/gauges');
    res.json(readGauges());
});

app.post('/api/gauges', (req, res) => {
    console.log('[API] POST /api/gauges', req.body);
    const gauge = req.body;
    if (!gauge || typeof gauge.id === 'undefined') {
        return res.status(400).send('Gauge object with id required');
    }
    const gauges = readGauges();
    // prevent duplicates
    if (gauges.find(g => g.id === gauge.id)) {
        return res.status(409).send('Gauge already exists');
    }
    gauges.push(gauge);
    writeGauges(gauges);
    res.status(201).send();
});


app.put('/api/gauges/:id', (req, res) => {
    console.log('[API] PUT /api/gauges/' + req.params.id, req.body);
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


app.delete('/api/gauges', (req, res) => {
    console.log('[API] DELETE /api/gauges (all)');
    writeGauges([]);
    res.send();
});


app.delete('/api/gauges/:id', (req, res) => {
    console.log('[API] DELETE /api/gauges/' + req.params.id);
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


app.listen(PORT, () => {
    console.log(`AeroDb server listening on http://localhost:${PORT}`);
    console.log('Run from project root to serve static files and API');
});
