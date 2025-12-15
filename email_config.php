<?php
/**
 * Configuración de Email
 * Archivo de configuración para el servicio de envío de correos
 */

// Configuración SMTP
define('SMTP_HOST', 'smtp.gmail.com'); // Servidor SMTP (Gmail, Outlook, etc.)
define('SMTP_PORT', 587); // Puerto SMTP (587 para TLS, 465 para SSL)
define('SMTP_SECURE', 'tls'); // Tipo de encriptación: 'tls' o 'ssl'
define('SMTP_USERNAME', 'cuentaapipruebas@gmail.com'); // Tu email
define('SMTP_PASSWORD', ''); // Contraseña de aplicación

// Configuración del remitente
define('EMAIL_FROM', 'cuentaapipruebas@gmail.com'); // Email del remitente
define('EMAIL_FROM_NAME', 'Higiene Bucodental - Clínica Dental'); // Nombre del remitente

// Configuración general
define('EMAIL_DEBUG', false); // true para ver debug, false en producción
define('EMAIL_CHARSET', 'UTF-8'); // Codificación de caracteres

/**
 * INSTRUCCIONES PARA CONFIGURAR GMAIL:
 * 
 * 1. Habilitar verificación en 2 pasos en tu cuenta de Google
 * 2. Ir a https://myaccount.google.com/apppasswords
 * 3. Crear una contraseña de aplicación para "Correo"
 * 4. Usar esa contraseña en SMTP_PASSWORD (no tu contraseña normal)
 * 
 * ALTERNATIVAS:
 * - Outlook/Hotmail: smtp.office365.com, puerto 587
 * - Yahoo: smtp.mail.yahoo.com, puerto 587
 * - Servidor propio: configurar según tu proveedor
 */
