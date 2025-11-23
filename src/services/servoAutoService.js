import mqtt from "mqtt";

const client = mqtt.connect("mqtt://150.136.81.124:1883");

// 👉 ESTA función es la que usará la IA
export const moveServoAuto = (greenhouseId, command) => {
  const topic = `greenhouse/${greenhouseId}/servo`;
  client.publish(topic, command);

  console.log(`🤖 [AUTO] Servo ejecutado: ${command} → ${topic}`);
};