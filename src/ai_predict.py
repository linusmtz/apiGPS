import joblib
import sys
import json
import numpy as np

# ================
# CARGAR MODELOS
# ================
modelo = joblib.load("modelo_temp.pkl")
anom = joblib.load("modelo_anom.pkl")

# ================
# LEER INPUT JSON
# ================
raw = json.loads(sys.stdin.read())

features = np.array([[
    raw["temperature"],
    raw["humidity_air"],
    raw["humidity_soil"],
    raw["light"],
    raw["hour"],
    raw["minute_of_day"]
]])

# ================
# DETECTAR ANOMALÍA
# ================
is_anomaly = anom.predict(features)[0] == -1

# ================
# PREDICCIÓN FUTURA
# ================
temp_pred = modelo.predict(features)[0]

# ================
# RESPUESTA
# ================
result = {
    "anomaly": bool(is_anomaly),
    "prediction_temp": float(temp_pred)
}

print(json.dumps(result))
