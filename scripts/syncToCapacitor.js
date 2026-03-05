// Copies the web application files into the Capacitor `www/` directory.
// Excludes node_modules, dist, and other non-web assets.

const fs = require('fs');
const path = require('path');
const fse = require('fs-extra');

const projectRoot = path.resolve(__dirname, '..');
const dest = path.join(projectRoot, 'www');

// list of patterns to ignore
const ignore = ['node_modules', 'dist', 'www', '.git', 'capacitor.config.json', 'package-lock.json', 'package.json'];

async function sync() {
    try {
        await fse.remove(dest);
        await fse.mkdirp(dest);
        // copy everything except ignored
        const items = await fs.promises.readdir(projectRoot);
        for (const item of items) {
            if (ignore.includes(item)) continue;
            const srcPath = path.join(projectRoot, item);
            const stat = await fs.promises.stat(srcPath);
            const targetPath = path.join(dest, item);
            await fse.copy(srcPath, targetPath, { dereference: true });
        }
        console.log('Web assets copied to www/');
    } catch (err) {
        console.error('Error syncing to Capacitor www:', err);
    }
}

if (require.main === module) {
    sync();
}
