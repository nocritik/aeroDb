package com.example.aerodb;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Enregistrer le plugin USB série avant l'initialisation du bridge Capacitor
        registerPlugin(UsbSerialPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
