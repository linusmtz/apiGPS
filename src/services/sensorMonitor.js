// services/sensorMonitor.js
import mqtt from "mqtt";
import { sendOfflineAlertEmail } from "./emailService.js";

const MQTT_URL = "mqtt://150.136.81.124:1883";
const client = mqtt.connect(MQTT_URL);


const TARGET_GREENHOUSE_ID = "691b6b683711f95800de6f1a";
const SENSOR_TOPIC = `greenhouse/${TARGET_GREENHOUSE_ID}/sensorData`;


const ALERT_EMAIL = "danielaaldaco9@gmail.com";


const STALE_THRESHOLD = 5 * 60 * 1000;


const CHECK_INTERVAL = 60 * 1000;


const REMINDER_INTERVAL = 2 * 60 * 60 * 1000; 

let lastSeen =  null; 
let lastAlertAt= null;
let isOffline = false; 

client.on("connect", () => {
  console.log("[Monitor] Connected to MQTT broker");

  client.subscribe(SENSOR_TOPIC, (err) => {
    if (err) {
      console.error("[Monitor] Error subscribing:", err.message);
    } else {
      console.log("[Monitor] Subscribed to", SENSOR_TOPIC);
    }
  });
});

client.on("message", (topic, payload) => {
  if (topic !== SENSOR_TOPIC) return;

  const now = Date.now();
  lastSeen = now;


  if (isOffline) {
    console.log(
      `[Monitor] ${TARGET_GREENHOUSE_ID} volvió a mandar datos. Reseteando estado de caída.`
    );
    isOffline = false;
    lastAlertAt = null;
  }

});

setInterval(async () => {
  const now = Date.now();


  if (!lastSeen) return;

  const diff = now - lastSeen;


  if (diff <= STALE_THRESHOLD) return;



  if (!isOffline) {
    // Primera vez que detectamos esta caída
    isOffline = true;
    lastAlertAt = now;

    console.log(
      `[Monitor] ${TARGET_GREENHOUSE_ID} lleva ${(diff / 1000).toFixed(
        0
      )}s sin datos. ENVIANDO primer correo a ${ALERT_EMAIL}...`
    );

    try {
      await sendOfflineAlertEmail(ALERT_EMAIL, TARGET_GREENHOUSE_ID);
    } catch (err) {
      console.error("[Monitor] Error enviando correo de alerta:", err.message);
    }

    return;
  }


  if (lastAlertAt && now - lastAlertAt >= REMINDER_INTERVAL) {
    console.log(
      `[Monitor] ${TARGET_GREENHOUSE_ID} sigue caído desde hace ${(diff / 1000 / 60).toFixed(
        1
      )} min. ENVIANDO recordatorio a ${ALERT_EMAIL}...`
    );

    try {
      await sendOfflineAlertEmail(ALERT_EMAIL, TARGET_GREENHOUSE_ID);
      lastAlertAt = now; // actualizar momento del último correo
    } catch (err) {
      console.error("[Monitor] Error enviando correo de recordatorio:", err.message);
    }
  }
}, CHECK_INTERVAL);
