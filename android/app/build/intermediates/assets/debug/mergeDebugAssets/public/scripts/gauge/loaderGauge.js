import { addInstrument } from "./components/addGauge.js";
import { ConfigService } from "../../src/services/ConfigService.js";

// helper that interprets entries stored in localStorage and adds instruments
function _loadFromStorage() {
    for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        var keyAsNumber = parseInt(key, 10);
        if (isNaN(keyAsNumber) || key !== String(keyAsNumber)) continue;

        try {
            var myInst = JSON.parse(localStorage.getItem(key));
            if (myInst !== null && myInst.instrument) {
                addInstrument(
                    key,
                    myInst["instrument"],
                    myInst["gradValue"],
                    myInst["unité"],
                    myInst["graduationMin"],
                    myInst["graduationMax"],
                    myInst["positionVerticalAfficheur"],
                    myInst["positionHorizontalAfficheur"],
                    myInst["arcJauneMin"],
                    myInst["arcJauneMax"],
                    myInst["arcVertMin"],
                    myInst["arcVertMax"],
                    myInst["arcRougeMin"],
                    myInst["arcRougeMax"]
                );
            }
        } catch (e) {
            console.warn('Erreur parsing localStorage key ' + key + ':', e);
        }
    }
}

// initialize loader; if no gauges exist locally, try to read config.ini
(async function initLoader() {
    let count = 0;
    for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        if (!isNaN(parseInt(key, 10)) && key === String(parseInt(key, 10))) {
            count++;
        }
    }

    if (count === 0) {
        const gauges = await ConfigService.loadIniFallback();
        gauges.forEach(g => {
            localStorage.setItem(g.id, JSON.stringify(g));
        });
    }

    _loadFromStorage();
})();
