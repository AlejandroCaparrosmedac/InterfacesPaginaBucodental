<?php
/**
 * API REST - Gestión de Citas y Administración
 * Maneja todas las operaciones de la base de datos
 */

// Configuración CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Incluir configuración de BD
require_once 'config.php';

// Obtener método y acción
$metodo = $_SERVER['REQUEST_METHOD'];
$ruta = isset($_GET['action']) ? $_GET['action'] : '';

// Respuesta por defecto
$respuesta = ['success' => false, 'message' => 'Acción no válida'];

// Envolver todo en try-catch para evitar errores HTML
try {

// ============================================
// RUTAS API
// ============================================

switch ($ruta) {
    // ========== AUTENTICACIÓN ==========
    case 'login':
        if ($metodo === 'POST') {
            $datos = json_decode(file_get_contents("php://input"), true);
            login($conexion, $datos);
        }
        break;

    case 'logout':
        logout();
        break;

    // ========== CITAS ==========
    case 'crear_cita':
        if ($metodo === 'POST') {
            $datos = json_decode(file_get_contents("php://input"), true);
            crearCita($conexion, $datos);
        }
        break;

    case 'obtener_citas':
        if ($metodo === 'GET') {
            obtenerCitas($conexion);
        }
        break;

    case 'obtener_cita':
        if ($metodo === 'GET') {
            $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
            obtenerCitaPorId($conexion, $id);
        }
        break;

    case 'actualizar_cita':
        if ($metodo === 'PUT') {
            $datos = json_decode(file_get_contents("php://input"), true);
            actualizarCita($conexion, $datos);
        }
        break;

    case 'eliminar_cita':
        if ($metodo === 'DELETE') {
            $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
            eliminarCita($conexion, $id);
        }
        break;

    case 'obtener_citas_fecha':
        if ($metodo === 'GET') {
            $fecha = isset($_GET['fecha']) ? $_GET['fecha'] : '';
            obtenerCitasPorFecha($conexion, $fecha);
        }
        break;

    // ========== SERVICIOS ==========
    case 'obtener_servicios':
        if ($metodo === 'GET') {
            obtenerServicios($conexion);
        }
        break;

    case 'crear_servicio':
        if ($metodo === 'POST') {
            $datos = json_decode(file_get_contents("php://input"), true);
            crearServicio($conexion, $datos);
        }
        break;

    // ========== ADMINISTRADORES ==========
    case 'obtener_admins':
        if ($metodo === 'GET') {
            obtenerAdministradores($conexion);
        }
        break;

    case 'crear_admin':
        if ($metodo === 'POST') {
            $datos = json_decode(file_get_contents("php://input"), true);
            crearAdministrador($conexion, $datos);
        }
        break;

    case 'cambiar_password':
        if ($metodo === 'POST') {
            $datos = json_decode(file_get_contents("php://input"), true);
            cambiarPassword($conexion, $datos);
        }
        break;

    default:
        http_response_code(404);
        $respuesta = ['success' => false, 'message' => 'Endpoint no encontrado'];
}

// Cerrar try-catch
} catch (Exception $e) {
    $respuesta = ['success' => false, 'message' => 'Error interno: ' . $e->getMessage()];
}

// Enviar respuesta
echo json_encode($respuesta, JSON_UNESCAPED_UNICODE);
if (isset($conexion)) {
    $conexion->close();
}
exit;

// ============================================
// FUNCIONES DE AUTENTICACIÓN
// ============================================

function login($conexion, $datos) {
    global $respuesta;

    $usuario = isset($datos['usuario']) ? trim($datos['usuario']) : '';
    $password = isset($datos['password']) ? $datos['password'] : '';

    if (empty($usuario) || empty($password)) {
        $respuesta = ['success' => false, 'message' => 'Usuario y contraseña requeridos'];
        return;
    }

    // Buscar usuario
    $stmt = $conexion->prepare("SELECT id, usuario, contraseña, nombre FROM administradores WHERE usuario = ? AND activo = TRUE");
    $stmt->bind_param("s", $usuario);
    $stmt->execute();
    $resultado = $stmt->get_result();

    if ($resultado->num_rows > 0) {
        $fila = $resultado->fetch_assoc();
        
        // Verificar contraseña
        if (password_verify($password, $fila['contraseña'])) {
            // Crear sesión
            session_start();
            $_SESSION['admin_id'] = $fila['id'];
            $_SESSION['admin_usuario'] = $fila['usuario'];
            $_SESSION['admin_nombre'] = $fila['nombre'];
            $_SESSION['admin_login'] = time();

            $respuesta = [
                'success' => true,
                'message' => 'Inicio de sesión exitoso',
                'usuario' => $fila['usuario'],
                'nombre' => $fila['nombre']
            ];
        } else {
            $respuesta = ['success' => false, 'message' => 'Contraseña incorrecta'];
        }
    } else {
        $respuesta = ['success' => false, 'message' => 'Usuario no encontrado'];
    }

    $stmt->close();
}

function logout() {
    global $respuesta;
    session_start();
    session_destroy();
    $respuesta = ['success' => true, 'message' => 'Sesión cerrada'];
}

// ============================================
// FUNCIONES DE CITAS
// ============================================

function crearCita($conexion, $datos) {
    global $respuesta;

    $fecha = isset($datos['fecha']) ? $datos['fecha'] : '';
    $hora = isset($datos['hora']) ? $datos['hora'] : '';
    $nombre = isset($datos['nombre']) ? trim($datos['nombre']) : '';
    $email = isset($datos['email']) ? trim($datos['email']) : '';
    $sillon = isset($datos['sillon']) ? trim($datos['sillon']) : NULL;
    $notas = isset($datos['notas']) ? trim($datos['notas']) : NULL;

    if (empty($fecha) || empty($hora) || empty($nombre) || empty($email)) {
        $respuesta = ['success' => false, 'message' => 'Faltan datos requeridos'];
        return;
    }

    // Validar formato de fecha (YYYY-MM-DD)
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $fecha)) {
        $respuesta = ['success' => false, 'message' => 'Formato de fecha inválido (use YYYY-MM-DD)'];
        return;
    }

    // Validar email
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $respuesta = ['success' => false, 'message' => 'Email inválido'];
        return;
    }

    // Validar que email no tenga cita en el mismo día
    $stmt = $conexion->prepare("SELECT id FROM citas WHERE email = ? AND fecha = ? AND estado != 'cancelada'");
    $stmt->bind_param("ss", $email, $fecha);
    $stmt->execute();
    
    if ($stmt->get_result()->num_rows > 0) {
        $respuesta = ['success' => false, 'message' => 'Ya tienes una cita registrada para este día'];
        $stmt->close();
        return;
    }
    $stmt->close();

    // Verificar disponibilidad del sillon en esa fecha y hora
    if (!empty($sillon)) {
        $stmt = $conexion->prepare("SELECT id FROM citas WHERE fecha = ? AND hora = ? AND sillon = ? AND estado != 'cancelada'");
        $stmt->bind_param("sss", $fecha, $hora, $sillon);
        $stmt->execute();
        
        if ($stmt->get_result()->num_rows > 0) {
            $respuesta = ['success' => false, 'message' => 'El sillón '.$sillon.' ya está reservado para esta hora'];
            $stmt->close();
            return;
        }
        $stmt->close();
    }

    // Insertar cita
    $stmt = $conexion->prepare("INSERT INTO citas (fecha, hora, nombre, email, sillon, notas, estado) 
                               VALUES (?, ?, ?, ?, ?, ?, 'pendiente')");
    $stmt->bind_param("ssssss", $fecha, $hora, $nombre, $email, $sillon, $notas);

    if ($stmt->execute()) {
        $respuesta = [
            'success' => true,
            'message' => 'Cita creada exitosamente',
            'id' => $stmt->insert_id
        ];
    } else {
        $respuesta = ['success' => false, 'message' => 'Error al crear cita: ' . $conexion->error];
    }

    $stmt->close();
}

function obtenerCitas($conexion) {
    global $respuesta;

    $resultado = $conexion->query("SELECT * FROM citas WHERE estado != 'cancelada' ORDER BY fecha DESC, hora DESC");

    if ($resultado) {
        $citas = [];
        while ($fila = $resultado->fetch_assoc()) {
            // Convertir hora de HH:MM:SS a HH:MM si es necesario
            if (strlen($fila['hora']) > 5) {
                $fila['hora'] = substr($fila['hora'], 0, 5);
            }
            $citas[] = $fila;
        }
        $respuesta = ['success' => true, 'citas' => $citas];
    } else {
        $respuesta = ['success' => false, 'message' => 'Error al obtener citas'];
    }
}

function obtenerCitaPorId($conexion, $id) {
    global $respuesta;

    $stmt = $conexion->prepare("SELECT * FROM citas WHERE id = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $resultado = $stmt->get_result();

    if ($resultado->num_rows > 0) {
        $respuesta = ['success' => true, 'cita' => $resultado->fetch_assoc()];
    } else {
        $respuesta = ['success' => false, 'message' => 'Cita no encontrada'];
    }

    $stmt->close();
}

function obtenerCitasPorFecha($conexion, $fecha) {
    global $respuesta;

    $stmt = $conexion->prepare("SELECT * FROM citas WHERE fecha = ? ORDER BY hora");
    $stmt->bind_param("s", $fecha);
    $stmt->execute();
    $resultado = $stmt->get_result();

    $citas = [];
    while ($fila = $resultado->fetch_assoc()) {
        $citas[] = $fila;
    }

    $respuesta = ['success' => true, 'citas' => $citas];
    $stmt->close();
}

function actualizarCita($conexion, $datos) {
    global $respuesta;

    $id = isset($datos['id']) ? intval($datos['id']) : 0;
    $estado = isset($datos['estado']) ? trim($datos['estado']) : '';
    $sillon = isset($datos['sillon']) ? trim($datos['sillon']) : NULL;
    $notas = isset($datos['notas']) ? trim($datos['notas']) : NULL;

    if ($id <= 0 || empty($estado)) {
        $respuesta = ['success' => false, 'message' => 'Datos inválidos'];
        return;
    }

    $stmt = $conexion->prepare("UPDATE citas SET estado = ?, sillon = ?, notas = ? WHERE id = ?");
    $stmt->bind_param("sssi", $estado, $sillon, $notas, $id);

    if ($stmt->execute()) {
        $respuesta = ['success' => true, 'message' => 'Cita actualizada exitosamente'];
    } else {
        $respuesta = ['success' => false, 'message' => 'Error al actualizar cita'];
    }

    $stmt->close();
}

function eliminarCita($conexion, $id) {
    global $respuesta;

    if ($id <= 0) {
        $respuesta = ['success' => false, 'message' => 'ID inválido'];
        return;
    }

    $stmt = $conexion->prepare("DELETE FROM citas WHERE id = ?");
    $stmt->bind_param("i", $id);

    if ($stmt->execute()) {
        $respuesta = ['success' => true, 'message' => 'Cita eliminada correctamente'];
    } else {
        $respuesta = ['success' => false, 'message' => 'Error al eliminar cita'];
    }

    $stmt->close();
}

// ============================================
// FUNCIONES DE SERVICIOS
// ============================================

function obtenerServicios($conexion) {
    global $respuesta;

    $resultado = $conexion->query("SELECT * FROM servicios ORDER BY fecha_creacion DESC");

    if ($resultado) {
        $servicios = [];
        while ($fila = $resultado->fetch_assoc()) {
            $servicios[] = $fila;
        }
        $respuesta = ['success' => true, 'servicios' => $servicios];
    } else {
        $respuesta = ['success' => false, 'message' => 'Error al obtener servicios'];
    }
}

function crearServicio($conexion, $datos) {
    global $respuesta;

    $titulo = isset($datos['titulo']) ? trim($datos['titulo']) : '';
    $descripcion = isset($datos['descripcion']) ? trim($datos['descripcion']) : '';
    $categoria = isset($datos['categoria']) ? trim($datos['categoria']) : '';

    if (empty($titulo)) {
        $respuesta = ['success' => false, 'message' => 'El título es requerido'];
        return;
    }

    $stmt = $conexion->prepare("INSERT INTO servicios (titulo, descripcion, categoria) VALUES (?, ?, ?)");
    $stmt->bind_param("sss", $titulo, $descripcion, $categoria);

    if ($stmt->execute()) {
        $respuesta = ['success' => true, 'message' => 'Servicio creado', 'id' => $stmt->insert_id];
    } else {
        $respuesta = ['success' => false, 'message' => 'Error al crear servicio'];
    }

    $stmt->close();
}

// ============================================
// FUNCIONES DE ADMINISTRADORES
// ============================================

function obtenerAdministradores($conexion) {
    global $respuesta;

    $resultado = $conexion->query("SELECT id, usuario, nombre, email, activo, fecha_creacion FROM administradores");

    if ($resultado) {
        $admins = [];
        while ($fila = $resultado->fetch_assoc()) {
            $admins[] = $fila;
        }
        $respuesta = ['success' => true, 'administradores' => $admins];
    } else {
        $respuesta = ['success' => false, 'message' => 'Error al obtener administradores'];
    }
}

function crearAdministrador($conexion, $datos) {
    global $respuesta;

    $usuario = isset($datos['usuario']) ? trim($datos['usuario']) : '';
    $password = isset($datos['password']) ? $datos['password'] : '';
    $nombre = isset($datos['nombre']) ? trim($datos['nombre']) : '';
    $email = isset($datos['email']) ? trim($datos['email']) : '';

    if (empty($usuario) || empty($password) || empty($nombre)) {
        $respuesta = ['success' => false, 'message' => 'Datos requeridos: usuario, password, nombre'];
        return;
    }

    if (strlen($password) < 4) {
        $respuesta = ['success' => false, 'message' => 'La contraseña debe tener al menos 4 caracteres'];
        return;
    }

    // Verificar si usuario ya existe
    $stmt = $conexion->prepare("SELECT id FROM administradores WHERE usuario = ?");
    $stmt->bind_param("s", $usuario);
    $stmt->execute();
    
    if ($stmt->get_result()->num_rows > 0) {
        $respuesta = ['success' => false, 'message' => 'El usuario ya existe'];
        $stmt->close();
        return;
    }
    $stmt->close();

    // Hash de contraseña
    $password_hash = password_hash($password, PASSWORD_BCRYPT);

    $stmt = $conexion->prepare("INSERT INTO administradores (usuario, contraseña, nombre, email) VALUES (?, ?, ?, ?)");
    $stmt->bind_param("ssss", $usuario, $password_hash, $nombre, $email);

    if ($stmt->execute()) {
        $respuesta = ['success' => true, 'message' => 'Administrador creado', 'id' => $stmt->insert_id];
    } else {
        $respuesta = ['success' => false, 'message' => 'Error al crear administrador'];
    }

    $stmt->close();
}

function cambiarPassword($conexion, $datos) {
    global $respuesta;

    $usuario = isset($datos['usuario']) ? trim($datos['usuario']) : '';
    $password_actual = isset($datos['password_actual']) ? $datos['password_actual'] : '';
    $password_nueva = isset($datos['password_nueva']) ? $datos['password_nueva'] : '';

    if (empty($usuario) || empty($password_actual) || empty($password_nueva)) {
        $respuesta = ['success' => false, 'message' => 'Todos los campos son requeridos'];
        return;
    }

    if (strlen($password_nueva) < 4) {
        $respuesta = ['success' => false, 'message' => 'La nueva contraseña debe tener al menos 4 caracteres'];
        return;
    }

    // Buscar usuario
    $stmt = $conexion->prepare("SELECT id, contraseña FROM administradores WHERE usuario = ?");
    $stmt->bind_param("s", $usuario);
    $stmt->execute();
    $resultado = $stmt->get_result();

    if ($resultado->num_rows == 0) {
        $respuesta = ['success' => false, 'message' => 'Usuario no encontrado'];
        $stmt->close();
        return;
    }

    $fila = $resultado->fetch_assoc();
    $stmt->close();

    // Verificar contraseña actual
    if (!password_verify($password_actual, $fila['contraseña'])) {
        $respuesta = ['success' => false, 'message' => 'Contraseña actual incorrecta'];
        return;
    }

    // Actualizar contraseña
    $password_hash = password_hash($password_nueva, PASSWORD_BCRYPT);
    $stmt = $conexion->prepare("UPDATE administradores SET contraseña = ? WHERE id = ?");
    $stmt->bind_param("si", $password_hash, $fila['id']);

    if ($stmt->execute()) {
        $respuesta = ['success' => true, 'message' => 'Contraseña actualizada exitosamente'];
    } else {
        $respuesta = ['success' => false, 'message' => 'Error al actualizar contraseña'];
    }

    $stmt->close();
}

?>
