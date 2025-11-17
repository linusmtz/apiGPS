import nodemailer from "nodemailer";

// ========================================
// CONFIGURACIÓN DEL TRANSPORTER GLOBAL
// ========================================
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// ========================================
// MÉTODO BASE PARA ENVIAR CORREO
// ========================================
export const sendEmail = async ({ to, subject, html }) => {
  try {
    await transporter.sendMail({
      from: `"GreenKlokIA" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    });
  } catch (err) {
    console.error("Email sending error:", err);
  }
};

// ========================================
// 1) OTP PARA RECUPERACIÓN DE CONTRASEÑA
// ========================================
export const sendOTPEmail = async (email, code) => {
  await sendEmail({
    to: email,
    subject: "Código para recuperar contraseña",
    html: `
      <h2>Recuperación de contraseña</h2>
      <p>Este es tu código de verificación:</p>
      <h1 style="letter-spacing:4px; font-size: 32px;">${code}</h1>
      <p>El código expira en 10 minutos.</p>
      <p>Si no solicitaste este código, ignora este mensaje.</p>
    `
  });
};

// ========================================
// 2) ALERTA: HUMEDAD DEL SUELO CRÍTICA
// ========================================
export const sendCriticalSoilAlert = async (email, soilValue) => {
  await sendEmail({
    to: email,
    subject: "Alerta crítica de humedad del suelo",
    html: `
      <h2>Humedad del suelo crítica</h2>
      <p>Tu invernadero reporta una humedad del suelo de <b>${soilValue}%</b>.</p>
      <p>Esto es considerado crítico. Revisa el sistema de riego inmediatamente.</p>
    `
  });
};

// ========================================
// 3) ALERTA: ANOMALÍA FUERTE DETECTADA POR IA
// ========================================
export const sendStrongAnomalyAlert = async (email, type, details) => {
  await sendEmail({
    to: email,
    subject: "Alerta: anomalía fuerte detectada",
    html: `
      <h2>Anomalía detectada por IA</h2>
      <p>Tipo de anomalía: <b>${type}</b></p>
      <p>Detalles del evento:</p>
      <pre>${JSON.stringify(details, null, 2)}</pre>
      <p>Acción recomendada: verifica condiciones del invernadero.</p>
    `
  });
};

// ========================================
// 4) ALERTA: POSIBLE FALLA DE SENSOR
// ========================================
export const sendSensorFailureAlert = async (email, sensorName) => {
  await sendEmail({
    to: email,
    subject: "Alerta: falla de sensor detectada",
    html: `
      <h2>Falla de sensor</h2>
      <p>Se ha detectado un comportamiento irregular en el sensor <b>${sensorName}</b>.</p>
      <p>Esto puede indicar desconexión, daño o lecturas no válidas.</p>
    `
  });
};

// ========================================
// 5) ALERTA GENERAL (REUTILIZABLE)
// ========================================
export const sendGeneralAlert = async (email, title, message) => {
  await sendEmail({
    to: email,
    subject: title,
    html: `
      <h2>${title}</h2>
      <p>${message}</p>
    `
  });
};
