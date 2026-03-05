/*
 * Fonctions data*() — Fallback polling des instruments de vol
 *
 * Ces fonctions sont appelées par les jauges via un setInterval de secours,
 * uniquement quand aucune source de données n'est active
 * (usbReader.isConnected = false).
 *
 * Quand une source est active (USB, WiFi, simulateur), les mises à jour
 * transitent par l'événement 'flightdata' — ces fonctions ne sont pas appelées.
 *
 * Sources de données (fichiers séparés) :
 *   usbReader.js      — Port USB série (Web Serial API, Chrome/Edge 89+)
 *   wifiReader.js     — WiFi / WebSocket (à venir)
 *   usbSimulator.js   — Simulateur JSON intégré (développement)
 */

// =============================================================================
//  FONCTIONS DATA — FALLBACK POLLING
// =============================================================================

function dataAttitudeRoll() {
    return (usbReader.isConnected && usbReader.data.roll !== undefined)
        ? usbReader.data.roll : 0;
}

function dataAttitudePitch() {
    return (usbReader.isConnected && usbReader.data.pitch !== undefined)
        ? usbReader.data.pitch : 0;
}

function dataHeading() {
    return (usbReader.isConnected && usbReader.data.heading !== undefined)
        ? usbReader.data.heading : 0;
}

function dataAltitude() {
    return (usbReader.isConnected && usbReader.data.altitude !== undefined)
        ? usbReader.data.altitude : 0;
}

function dataPressure() {
    return (usbReader.isConnected && usbReader.data.pressure !== undefined)
        ? usbReader.data.pressure : 1013;
}

function dataTurnCoordinator() {
    return (usbReader.isConnected && usbReader.data.turnCoordinator !== undefined)
        ? usbReader.data.turnCoordinator : 0;
}

function dataVariometerFI() {
    return (usbReader.isConnected && usbReader.data.variometer !== undefined)
        ? usbReader.data.variometer : 0;
}

function dataCompas() {
    return (usbReader.isConnected && usbReader.data.compass !== undefined)
        ? usbReader.data.compass : 0;
}

function dataSpeed() {
    return (usbReader.isConnected && usbReader.data.speed !== undefined)
        ? usbReader.data.speed : 0;
}

function dataTachimeter() {
    return (usbReader.isConnected && usbReader.data.rpm !== undefined)
        ? Math.round(usbReader.data.rpm) : 0;
}

function dataWater() {
    return (usbReader.isConnected && usbReader.data.water !== undefined)
        ? usbReader.data.water : 0;
}

function dataWaterL() {
    return (usbReader.isConnected && usbReader.data.waterL !== undefined)
        ? usbReader.data.waterL : 0;
}

function dataWaterR() {
    return (usbReader.isConnected && usbReader.data.waterR !== undefined)
        ? usbReader.data.waterR : 0;
}

function dataCHT() {
    return (usbReader.isConnected && usbReader.data.cht !== undefined)
        ? usbReader.data.cht : 0;
}

function dataCHTL() {
    return (usbReader.isConnected && usbReader.data.chtL !== undefined)
        ? usbReader.data.chtL : 0;
}

function dataCHTR() {
    return (usbReader.isConnected && usbReader.data.chtR !== undefined)
        ? usbReader.data.chtR : 0;
}

function dataEGT() {
    return (usbReader.isConnected && usbReader.data.egt !== undefined)
        ? usbReader.data.egt : 0;
}

function dataEGTL() {
    return (usbReader.isConnected && usbReader.data.egtL !== undefined)
        ? usbReader.data.egtL : 0;
}

function dataEGTR() {
    return (usbReader.isConnected && usbReader.data.egtR !== undefined)
        ? usbReader.data.egtR : 0;
}

function dataVario() {
    return (usbReader.isConnected && usbReader.data.vario !== undefined)
        ? usbReader.data.vario : 0;
}

function dataFuelR() {
    return (usbReader.isConnected && usbReader.data.fuelR !== undefined)
        ? usbReader.data.fuelR : 0;
}

function dataFuelL() {
    return (usbReader.isConnected && usbReader.data.fuelL !== undefined)
        ? usbReader.data.fuelL : 0;
}

function dataFuel() {
    return (usbReader.isConnected && usbReader.data.fuel !== undefined)
        ? usbReader.data.fuel : 0;
}
