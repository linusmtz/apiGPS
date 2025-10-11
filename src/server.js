
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import app from "./app.js";

dotenv.config();

const PORT = process.env.PORT || 5050;

connectDB();

app.listen(PORT, () => {
  console.log(`🌱 Servidor corriendo en http://localhost:${PORT}`);
});

