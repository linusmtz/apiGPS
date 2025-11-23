import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error
import joblib
import numpy as np

# ============================
# 1. CARGAR DATASET FINAL
# ============================

df = pd.read_csv("dataset_final.csv")

print("Dataset cargado con:", len(df), "filas")
print(df.head())

# ============================
# 2. SELECCIONAR FEATURES Y TARGET
# ============================

features = [
    "temperature",
    "humidity_air",
    "humidity_soil",
    "light",
    "hour",
    "minute_of_day"
]

X = df[features]
y = df["temp_futura_5m"]

# ============================
# 3. TRAIN / TEST SPLIT
# ============================

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.20, shuffle=False
)

print("Entrenando con:", len(X_train), "filas")
print("Probando con:", len(X_test), "filas")

# ============================
# 4. ENTRENAR MODELO
# ============================

modelo = RandomForestRegressor(
    n_estimators=300,
    max_depth=12,
    random_state=42,
    n_jobs=-1
)

modelo.fit(X_train, y_train)

# ============================
# 5. EVALUACIÓN
# ============================

pred = modelo.predict(X_test)

mae = mean_absolute_error(y_test, pred)
rmse = np.sqrt(mean_squared_error(y_test, pred))

print("\n📊 RESULTADOS DEL MODELO")
print("-------------------------")
print("MAE  (error promedio):", mae)
print("RMSE (error cuadrático raíz):", rmse)

# ============================
# 6. GUARDAR MODELO
# ============================

joblib.dump(modelo, "modelo_temp.pkl")

print("\n🔥 MODELO GUARDADO EN modelo_temp.pkl")
