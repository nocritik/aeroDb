import { addInstrument } from "./components/addGauge.js";

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
