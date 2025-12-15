<?php
/**
 * Script de inicialización de la Base de Datos
 * Crea la BD y las tablas necesarias
 * Ejecutar una sola vez: http://localhost/InterfacesPaginaBucodental/init_db.php
 */

// Configuración de conexión sin especificar BD
$conexion = new mysqli('localhost', 'root', '', null, 3306);

if ($conexion->connect_error) {
    die(json_encode([
        'success' => false,
        'message' => 'Error de conexión: ' . $conexion->connect_error
    ]));
}

$conexion->set_charset("utf8mb4");

$respuesta = [
    'success' => true,
    'mensajes' => []
];

try {
    // 1. Crear la base de datos
    $sql_crear_bd = "CREATE DATABASE IF NOT EXISTS bucodental CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci";

    if ($conexion->query($sql_crear_bd)) {
        $respuesta['mensajes'][] = "✓ Base de datos 'bucodental' verificada/creada";
    } else {
        throw new Exception("Error al crear BD: " . $conexion->error);
    }

    // 2. Seleccionar la base de datos
    if (!$conexion->select_db('bucodental')) {
        throw new Exception("Error al seleccionar BD: " . $conexion->error);
    }

    // 3. Crear tabla de administradores
    $sql_admins = "CREATE TABLE IF NOT EXISTS administradores (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario VARCHAR(50) UNIQUE NOT NULL,
        contraseña VARCHAR(255) NOT NULL,
        nombre VARCHAR(100),
        email VARCHAR(100),
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        activo BOOLEAN DEFAULT TRUE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";

    if ($conexion->query($sql_admins)) {
        $respuesta['mensajes'][] = "✓ Tabla 'administradores' verificada/creada";
    } else {
        throw new Exception("Error al crear tabla administradores: " . $conexion->error);
    }

    // 4. Crear tabla de citas
    $sql_citas = "CREATE TABLE IF NOT EXISTS citas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        fecha DATE NOT NULL,
        hora TIME NOT NULL,
        nombre VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL,
        sillon VARCHAR(50),
        notas TEXT,
        estado ENUM('pendiente', 'confirmada', 'completada', 'cancelada') DEFAULT 'pendiente',
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";

    if ($conexion->query($sql_citas)) {
        $respuesta['mensajes'][] = "✓ Tabla 'citas' verificada/creada";
    } else {
        throw new Exception("Error al crear tabla citas: " . $conexion->error);
    }

    // 5. Crear tabla de servicios/recomendaciones
    $sql_servicios = "CREATE TABLE IF NOT EXISTS servicios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        titulo VARCHAR(150) NOT NULL,
        descripcion LONGTEXT,
        categoria VARCHAR(100),
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";

    if ($conexion->query($sql_servicios)) {
        $respuesta['mensajes'][] = "✓ Tabla 'servicios' verificada/creada";
    } else {
        throw new Exception("Error al crear tabla servicios: " . $conexion->error);
    }

    // 6. Crear tabla de días vetados
    $sql_dias_vetados = "CREATE TABLE IF NOT EXISTS dias_vetados (
        id INT AUTO_INCREMENT PRIMARY KEY,
        fecha DATE NOT NULL UNIQUE,
        motivo VARCHAR(255) DEFAULT 'Día no disponible',
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";

    if ($conexion->query($sql_dias_vetados)) {
        $respuesta['mensajes'][] = "✓ Tabla 'dias_vetados' verificada/creada";
    } else {
        throw new Exception("Error al crear tabla dias_vetados: " . $conexion->error);
    }

    // 7. Crear usuario admin por defecto si no existe
    $usuario_admin = 'admin';
    $password_admin = password_hash('1234', PASSWORD_BCRYPT);

    // Verificar si ya existe
    $resultado = $conexion->query("SELECT id FROM administradores WHERE usuario = 'admin'");

    if ($resultado->num_rows == 0) {
        $sql_insert_admin = "INSERT INTO administradores (usuario, contraseña, nombre) 
                            VALUES ('admin', '$password_admin', 'Administrador')";

        if ($conexion->query($sql_insert_admin)) {
            $respuesta['mensajes'][] = "✓ Usuario admin creado (usuario: 'admin', contraseña: '1234')";
        } else {
            throw new Exception("Error al crear usuario admin: " . $conexion->error);
        }
    } else {
        $respuesta['mensajes'][] = "✓ Usuario admin ya existe";
    }

    // 8. Crear índices para optimizar búsquedas
    $sql_indices = [
        "ALTER TABLE citas ADD INDEX idx_fecha (fecha)",
        "ALTER TABLE citas ADD INDEX idx_email (email)",
        "ALTER TABLE administradores ADD INDEX idx_usuario (usuario)",
        "ALTER TABLE dias_vetados ADD INDEX idx_fecha_vetada (fecha)"
    ];

    foreach ($sql_indices as $sql_indice) {
        $conexion->query($sql_indice); // Ignorar errores si el índice ya existe
    }

    $respuesta['mensajes'][] = "✓ Índices de base de datos creados/verificados";

} catch (Exception $e) {
    $respuesta['success'] = false;
    $respuesta['error'] = $e->getMessage();
}

$conexion->close();

// Devolver respuesta JSON
header('Content-Type: application/json; charset=utf-8');
echo json_encode($respuesta, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

?>