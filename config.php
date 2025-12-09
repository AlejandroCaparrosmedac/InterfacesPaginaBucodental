<?php
/**
 * Configuración de la Base de Datos
 * Conexión a MySQL mediante XAMPP
 */

// Configuración de conexión
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASSWORD', '');
define('DB_NAME', 'bucodental');
define('DB_PORT', 3306);

// Crear conexión a MySQL
$conexion = new mysqli(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT);

// Verificar conexión
if ($conexion->connect_error) {
    die(json_encode([
        'success' => false,
        'message' => 'Error de conexión: ' . $conexion->connect_error
    ]));
}

// Establecer charset UTF-8
$conexion->set_charset("utf8mb4");

?>
