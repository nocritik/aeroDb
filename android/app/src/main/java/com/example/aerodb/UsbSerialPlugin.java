package com.example.aerodb;

import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.hardware.usb.UsbDevice;
import android.hardware.usb.UsbDeviceConnection;
import android.hardware.usb.UsbManager;
import android.os.Build;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import com.hoho.android.usbserial.driver.UsbSerialDriver;
import com.hoho.android.usbserial.driver.UsbSerialPort;
import com.hoho.android.usbserial.driver.UsbSerialProber;
import com.hoho.android.usbserial.util.SerialInputOutputManager;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.concurrent.Executors;

/**
 * Plugin Capacitor — accès USB série natif Android.
 *
 * Expose côté JS (via Capacitor.Plugins.UsbSerial) :
 *   getPorts()                          → liste les périphériques USB série détectés
 *   open({ deviceId, baudRate })        → ouvre le port et démarre la lecture
 *   close()                             → ferme proprement la connexion
 *
 * Événements émis vers JS :
 *   "serialData"  { data: "<ligne JSON>" }  — une ligne complète reçue
 *   "serialState" { connected: bool, error?: string } — changement d'état
 */
@CapacitorPlugin(name = "UsbSerial")
public class UsbSerialPlugin extends Plugin implements SerialInputOutputManager.Listener {

    private static final String ACTION_USB_PERMISSION = "com.example.aerodb.USB_PERMISSION";
    private static final String EVENT_DATA  = "serialData";
    private static final String EVENT_STATE = "serialState";

    private UsbManager usbManager;
    private UsbSerialPort serialPort;
    private SerialInputOutputManager ioManager;

    /** Buffer pour reconstituer les lignes reçues morceau par morceau */
    private final StringBuilder lineBuffer = new StringBuilder();

    // -------------------------------------------------------------------------
    //  Cycle de vie du plugin
    // -------------------------------------------------------------------------

    @Override
    public void load() {
        usbManager = (UsbManager) getContext().getSystemService(Context.USB_SERVICE);
    }

    // -------------------------------------------------------------------------
    //  Méthodes exposées au JS
    // -------------------------------------------------------------------------

    /**
     * Retourne la liste des périphériques USB série détectés par usb-serial-for-android.
     * Résultat : { ports: [ { deviceId, vendorId, productId, deviceName, driverName }, … ] }
     */
    @PluginMethod
    public void getPorts(PluginCall call) {
        List<UsbSerialDriver> drivers =
                UsbSerialProber.getDefaultProber().findAllDrivers(usbManager);

        JSArray ports = new JSArray();
        for (UsbSerialDriver driver : drivers) {
            UsbDevice device = driver.getDevice();
            JSObject port = new JSObject();
            port.put("deviceId",   device.getDeviceId());
            port.put("vendorId",   device.getVendorId());
            port.put("productId",  device.getProductId());
            port.put("deviceName", device.getDeviceName());
            port.put("driverName", driver.getClass().getSimpleName());
            ports.put(port);
        }

        JSObject result = new JSObject();
        result.put("ports", ports);
        call.resolve(result);
    }

    /**
     * Ouvre le port USB série et démarre la lecture en arrière-plan.
     * Paramètres JS : { deviceId?: number, baudRate?: number }
     *   deviceId  — identifiant retourné par getPorts() ; si absent, prend le premier trouvé
     *   baudRate  — débit en bauds (défaut : 9600)
     */
    @PluginMethod
    public void open(PluginCall call) {
        int deviceId = call.getInt("deviceId", -1);
        int baudRate = call.getInt("baudRate", 9600);

        List<UsbSerialDriver> drivers =
                UsbSerialProber.getDefaultProber().findAllDrivers(usbManager);

        UsbSerialDriver targetDriver = null;
        for (UsbSerialDriver driver : drivers) {
            if (deviceId < 0 || driver.getDevice().getDeviceId() == deviceId) {
                targetDriver = driver;
                break;
            }
        }

        if (targetDriver == null) {
            call.reject("USB_NOT_FOUND", "Aucun périphérique USB série détecté.");
            return;
        }

        UsbDevice device = targetDriver.getDevice();

        if (usbManager.hasPermission(device)) {
            connectDevice(targetDriver, baudRate, call);
        } else {
            requestPermissionThenConnect(targetDriver, baudRate, call);
        }
    }

    /**
     * Ferme la connexion USB série.
     */
    @PluginMethod
    public void close(PluginCall call) {
        stopIoManager();
        closeSerialPort();

        JSObject state = new JSObject();
        state.put("connected", false);
        notifyListeners(EVENT_STATE, state);

        call.resolve();
    }

    // -------------------------------------------------------------------------
    //  Gestion des permissions USB
    // -------------------------------------------------------------------------

    private void requestPermissionThenConnect(UsbSerialDriver driver, int baudRate, PluginCall call) {
        int flags = Build.VERSION.SDK_INT >= Build.VERSION_CODES.M
                ? PendingIntent.FLAG_IMMUTABLE
                : 0;
        PendingIntent permissionIntent = PendingIntent.getBroadcast(
                getContext(), 0, new Intent(ACTION_USB_PERMISSION), flags);

        BroadcastReceiver receiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                if (!ACTION_USB_PERMISSION.equals(intent.getAction())) return;
                context.unregisterReceiver(this);
                boolean granted = intent.getBooleanExtra(
                        UsbManager.EXTRA_PERMISSION_GRANTED, false);
                if (granted) {
                    connectDevice(driver, baudRate, call);
                } else {
                    call.reject("USB_PERMISSION_DENIED", "Permission USB refusée par l'utilisateur.");
                }
            }
        };

        IntentFilter filter = new IntentFilter(ACTION_USB_PERMISSION);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            getContext().registerReceiver(receiver, filter, Context.RECEIVER_NOT_EXPORTED);
        } else {
            getContext().registerReceiver(receiver, filter);
        }

        usbManager.requestPermission(driver.getDevice(), permissionIntent);
    }

    // -------------------------------------------------------------------------
    //  Ouverture du port et démarrage de la lecture
    // -------------------------------------------------------------------------

    private void connectDevice(UsbSerialDriver driver, int baudRate, PluginCall call) {
        UsbDeviceConnection connection = usbManager.openDevice(driver.getDevice());
        if (connection == null) {
            call.reject("USB_OPEN_FAILED", "Impossible d'ouvrir la connexion USB.");
            return;
        }

        try {
            serialPort = driver.getPorts().get(0);
            serialPort.open(connection);
            serialPort.setParameters(baudRate, 8,
                    UsbSerialPort.STOPBITS_1, UsbSerialPort.PARITY_NONE);

            lineBuffer.setLength(0);

            ioManager = new SerialInputOutputManager(serialPort, this);
            Executors.newSingleThreadExecutor().submit(ioManager);

            JSObject state = new JSObject();
            state.put("connected", true);
            notifyListeners(EVENT_STATE, state);

            call.resolve();
        } catch (IOException e) {
            closeSerialPort();
            call.reject("USB_CONFIG_FAILED",
                    "Impossible de configurer le port USB : " + e.getMessage());
        }
    }

    // -------------------------------------------------------------------------
    //  Callbacks SerialInputOutputManager.Listener
    // -------------------------------------------------------------------------

    /**
     * Appelé par usb-serial-for-android dès que des octets arrivent.
     * Reconstitue les lignes (séparées par '\n') et les émet en événements JS.
     */
    @Override
    public void onNewData(byte[] data) {
        String chunk = new String(data, StandardCharsets.UTF_8);
        lineBuffer.append(chunk);

        int newline;
        while ((newline = lineBuffer.indexOf("\n")) >= 0) {
            String line = lineBuffer.substring(0, newline).trim();
            lineBuffer.delete(0, newline + 1);
            if (!line.isEmpty()) {
                JSObject event = new JSObject();
                event.put("data", line);
                notifyListeners(EVENT_DATA, event);
            }
        }
    }

    /**
     * Appelé par usb-serial-for-android en cas d'erreur de lecture.
     */
    @Override
    public void onRunError(Exception e) {
        JSObject state = new JSObject();
        state.put("connected", false);
        state.put("error", e.getMessage());
        notifyListeners(EVENT_STATE, state);
    }

    // -------------------------------------------------------------------------
    //  Utilitaires
    // -------------------------------------------------------------------------

    private void stopIoManager() {
        if (ioManager != null) {
            ioManager.stop();
            ioManager = null;
        }
    }

    private void closeSerialPort() {
        if (serialPort != null) {
            try { serialPort.close(); } catch (IOException ignored) {}
            serialPort = null;
        }
    }
}
