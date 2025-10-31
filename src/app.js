
import express from "express";
import cors from "cors";
import userRoutes from "./routes/userRoutes.js";
import greenhouseRoutes from "./routes/greenhouseRoutes.js";
import sensorRoutes from "./routes/sensorRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/users", userRoutes);
app.use("/api/greenhouses", greenhouseRoutes);
app.user("/api/sensors", sensorRoutes);


export default app;
