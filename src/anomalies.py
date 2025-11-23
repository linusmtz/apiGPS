import pandas as pd
from sklearn.ensemble import IsolationForest
import joblib

# ============================
# 1. CARGAR DATASET FINAL
# ============================

df = pd.read_csv("dataset_final.csv")

features = [
    "temperature",
    "humidity_air",
    "humidity_soil",
    "light",
    "hour",
    "minute_of_day"
]

X = df[features]

print("Entrenando anomalías con:", len(X), "filas...")

# ============================
# 2. ENTRENAR ISOLATION FOREST
# ============================

modelo_anom = IsolationForest(
    n_estimators=200,
    contamination=0.02,  # 2% de anomalías esperadas
    random_state=42
)

modelo_anom.fit(X)

print("Modelo de anomalías entrenado.")

# ============================
# 3. EVALUAR POR ENCIMA (OPCIONAL)
# ============================

predicciones = modelo_anom.predict(X)
anomalas = (predicciones == -1).sum()

print(f"Anomalías detectadas: {anomalas} de {len(X)} filas")

# ============================
# 4. GUARDAR MODELO
# ============================

joblib.dump(modelo_anom, "modelo_anom.pkl")
print("\n🔥 MODELO DE ANOMALÍAS GUARDADO EN modelo_anom.pkl")
