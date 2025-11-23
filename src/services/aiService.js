import { spawn } from "child_process";

export function runAI(inputData) {
  return new Promise((resolve, reject) => {
    const py = spawn("python3", ["ai_predict.py"], {
      cwd: process.cwd() // asegura ruta correcta
    });

    let output = "";
    let error = "";

    py.stdin.write(JSON.stringify(inputData));
    py.stdin.end();

    py.stdout.on("data", (data) => (output += data.toString()));
    py.stderr.on("data", (data) => (error += data.toString()));

    py.on("close", (code) => {
      if (code !== 0) {
        return reject(new Error("Python error: " + error));
      }
      try {
        resolve(JSON.parse(output));
      } catch (err) {
        reject(new Error("Error parseando respuesta Python: " + err.message));
      }
    });
  });
}
