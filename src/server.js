
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import startMqttConsumer from "./mqtt/consumer.js";

import app from "./app.js";

dotenv.config();

const PORT = process.env.PORT || 8080;

startMqttConsumer();
connectDB();

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor corriendo en http://0.0.0.0:${PORT}`);
});