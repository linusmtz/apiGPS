
import express from "express";
import cors from "cors";
import userRoutes from "./routes/userRoutes.js";
import greenhouseRoutes from "./routes/greenhouseRoutes.js";
import sensorRoutes from "./routes/sensorRoutes.js";
import irrigationRoutes from "./routes/irrigationRoutes.js";
import servoRoutes from "./routes/servoRoutes.js";
const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/servo", servoRoutes);
app.use("/api/irrigation", irrigationRoutes);
app.use("/api/users", userRoutes);
app.use("/api/greenhouses", greenhouseRoutes);
app.use("/api/sensors", sensorRoutes);


export default app;
