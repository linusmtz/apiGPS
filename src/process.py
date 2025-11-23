import pandas as pd

# ============================
# 1. CARGAR CSV ORIGINAL
# ============================

df = pd.read_csv("sensor_data.csv")

print("CSV original cargado:")
print(df.head())

# ============================
# 2. LIMPIEZA DE COLUMNAS
# ============================

# Eliminar columnas que no sirven para IA
COLUMNAS_ELIMINAR = ["_id", "greenhouseId"]
df = df.drop(columns=COLUMNAS_ELIMINAR)

# ============================
# 3. CONVERTIR TIMESTAMP
# ============================

df["timestamp"] = pd.to_datetime(df["timestamp"], errors="coerce")
df = df.dropna(subset=["timestamp"])  # quitar filas sin timestamp

# Ordenar por tiempo (IMPORTANTE para crear futuro)
df = df.sort_values("timestamp").reset_index(drop=True)

# ============================
# 4. CREAR COLUMNA FUTURA (+5 MIN)
# ============================

# Crear una columna auxiliar con timestamp + 5 min
df["timestamp_futuro"] = df["timestamp"] + pd.Timedelta(minutes=5)

# Merge para alinear timestamps futuros con reales
df_futuro = df[["timestamp", "temperature"]].copy()
df_futuro.columns = ["timestamp_futuro", "temp_futura_5m"]

# Unir actual con futuro
df = df.merge(df_futuro, on="timestamp_futuro", how="left")

# Quitar filas que NO tienen lectura futura
df = df.dropna(subset=["temp_futura_5m"])

# ============================
# 5. CREAR FEATURES TEMPORALES
# ============================

df["hour"] = df["timestamp"].dt.hour
df["minute_of_day"] = df["timestamp"].dt.hour * 60 + df["timestamp"].dt.minute

# ============================
# 6. ELIMINAR COLUMNAS AUX
# ============================

df = df.drop(columns=["timestamp_futuro"])

# ============================
# 7. GUARDAR DATASET FINAL
# ============================

df.to_csv("dataset_final.csv", index=False)

print("\nDataset final generado!")
print(df.head())
print("\nTotal de filas finales:", len(df))
