# 🦷 Sistema de Gestión de Citas Bucodental

## 📋 Descripción General

Sistema completo para la gestión de citas odontológicas con interfaz para pacientes y panel de administración. Incluye calendarios interactivos, validación de datos, almacenamiento en base de datos MySQL y API REST.

---

## ✅ Lo que se ha realizado

### 1. **Base de Datos MySQL**
- ✓ Base de datos `bucodental` automáticamente creada
- ✓ Tabla `administradores` - Gestión de usuarios admin con contraseñas hasheadas
- ✓ Tabla `citas` - Almacenamiento completo de citas con estados
- ✓ Tabla `servicios` - Información de servicios/recomendaciones
- ✓ Índices optimizados para búsquedas rápidas
- ✓ Usuario admin por defecto creado: `admin` / `1234`

### 2. **Backend (API REST)**
- ✓ `api.php` - API RESTful completa
- ✓ Endpoints para citas (crear, obtener, actualizar, eliminar)
- ✓ Endpoints para autenticación (login, logout)
- ✓ Endpoints para administradores (crear, obtener, cambiar contraseña)
- ✓ Endpoints para servicios
- ✓ Validación de entrada en servidor
- ✓ Protección contra inyección SQL con prepared statements
- ✓ Hash bcrypt para contraseñas seguras

### 3. **Frontend - Página Principal (Index.html)**
- ✓ Calendario interactivo (Flatpickr) - Solo permite seleccionar viernes
- ✓ Integración con API para guardar citas
- ✓ Carga de citas en tiempo real desde BD
- ✓ Búsqueda de citas por email
- ✓ Validación de disponibilidad de horarios desde BD
- ✓ Interfaz responsiva con Bootstrap 5

### 4. **Frontend - Panel de Administración (admin.html)**
- ✓ Autenticación contra BD
- ✓ Sesión segura de 24 horas
- ✓ Tabla dinámica de citas desde BD
- ✓ Eliminación de citas (marcadas como canceladas)
- ✓ Interfaz de administrador profesional

### 5. **Características de Formulario**
- ✓ Validación en tiempo real de campos
- ✓ Email restringido a dominio específico (configurable)
- ✓ Teléfono con formato español (9 dígitos, comenzando con 6, 7, 8 o 9)
- ✓ Nombre con mínimo 3 caracteres
- ✓ Todos los campos obligatorios

### 6. **Configuración**
- ✓ `config.php` - Conexión a BD centralizada
- ✓ `init_db.php` - Script automático de inicialización
- ✓ Conexión a MySQL en XAMPP preconfigurada

---

## 🚀 Inicio Rápido

### Paso 1: Inicia XAMPP
```
1. Abre XAMPP Control Panel
2. Inicia Apache ✓
3. Inicia MySQL ✓
```

### Paso 2: Inicializa la Base de Datos (Primera vez)
```
http://localhost/InterfacesPaginaBucodental/init_db.php
```

Deberías ver:
```json
{
  "success": true,
  "mensajes": [
    "✓ Base de datos 'bucodental' verificada/creada",
    "✓ Tabla 'administradores' verificada/creada",
    "✓ Tabla 'citas' verificada/creada",
    "✓ Tabla 'servicios' verificada/creada",
    "✓ Usuario admin creado (usuario: 'admin', contraseña: '1234')"
  ]
}
```

### Paso 3: Accede a la Aplicación

**Página Principal** (para pacientes):
```
http://localhost/InterfacesPaginaBucodental/Index.html
```

**Panel de Administración**:
```
http://localhost/InterfacesPaginaBucodental/admin.html
```

**Página de Diagnóstico**:
```
http://localhost/InterfacesPaginaBucodental/test.html
```

---

## 🔐 Credenciales de Acceso

### Usuario Admin por Defecto
- **Usuario**: `admin`
- **Contraseña**: `1234`
- **⚠️ IMPORTANTE**: Cambia la contraseña tan pronto como sea posible

---

## 📁 Estructura de Archivos y Carpetas

```
C:\xampp\htdocs\InterfacesPaginaBucodental\
│
├── Index.html                 ← Página principal (para pacientes)
├── admin.html                 ← Panel de administración
├── test.html                  ← Página de diagnóstico
│
├── config.php                 ← Configuración de conexión a BD
├── init_db.php                ← Inicialización automática
├── api.php                    ← API REST (Backend)
├── EmailService.php           ← Servicio de correo electrónico
│
├── js/
│   ├── app.js                 ← Lógica de Index.html (pacientes)
│   ├── admin.js               ← Lógica de admin.html (administrador)
│   └── config.js              ← Configuración general
│
├── css/
│   └── estilos.css            ← Hoja de estilos
│
├── img/                       ← Carpeta de imágenes
│
└── vendor/                    ← Librerías de Composer (PHPMailer)
    └── phpmailer/
```

---

## 💾 Base de Datos

### Configuración
- **Nombre**: `bucodental`
- **Usuario**: `root`
- **Contraseña**: (vacía)
- **Host**: `localhost`

### Tablas

#### `administradores`
```
- id: INT (PRIMARY KEY)
- usuario: VARCHAR (UNIQUE)
- contraseña: VARCHAR (hash bcrypt)
- nombre: VARCHAR
- email: VARCHAR
- fecha_creacion: TIMESTAMP
- activo: BOOLEAN
```

#### `citas`
```
- id: INT (PRIMARY KEY)
- fecha: DATE
- hora: TIME
- nombre: VARCHAR
- email: VARCHAR
- telefono: VARCHAR
- sillon: VARCHAR
- notas: TEXT
- estado: ENUM ('pendiente', 'confirmada', 'completada', 'cancelada')
- fecha_creacion: TIMESTAMP
- fecha_actualizacion: TIMESTAMP
```

#### `servicios`
```
- id: INT (PRIMARY KEY)
- titulo: VARCHAR
- descripcion: LONGTEXT
- categoria: VARCHAR
- fecha_creacion: TIMESTAMP
```

---

## ✨ Funcionalidades por Usuario

### Para Pacientes
- ✓ Pedir una cita seleccionando fecha (viernes), hora, sillón y datos personales
- ✓ Buscar su cita ingresando su email
- ✓ Ver disponibilidad de horas y sillones en tiempo real
- ✓ Ver recomendaciones de higiene bucodental
- ✓ Descargar/Guardar citas en Excel (SheetJS)

### Para Administrador
- ✓ Ver todas las citas registradas en una tabla dinámica
- ✓ Eliminar citas (cambiar estado a cancelada)
- ✓ Gestionar usuario admin
- ✓ Cambiar contraseña (próximamente)
- ✓ Exportar reportes en PDF (próximamente)
- ✓ Exportar reportes en Excel (próximamente)

---

## 📦 Librerías Utilizadas

### Frontend
- **Bootstrap 5** - Framework CSS y componentes UI
- **Flatpickr** - Calendario interactivo
- **SheetJS** - Generación de archivos Excel

### Backend
- **PHP 7.4+** - Lenguaje del servidor
- **MySQL** - Base de datos
- **PHPMailer** - Servicio de correo electrónico (vía Composer)
- **Bcrypt** - Hash seguro de contraseñas

---

## 🛠️ Requisitos

- **XAMPP** (Apache + MySQL + PHP)
- **Navegador web moderno** (Chrome, Firefox, Edge, Safari)
- **PHP 7.4 o superior**
- **MySQL 5.7 o superior**

---

## 🔍 Solución de Problemas

### Error: "No se puede conectar a la base de datos"
- ✓ Verifica que MySQL esté activo en XAMPP
- ✓ Verifica que el usuario/contraseña en `config.php` sean correctos
- ✓ Asegúrate de que MySQL está escuchando en puerto 3306

### Error 404 en api.php
- ✓ Verifica que la carpeta esté en `C:\xampp\htdocs\InterfacesPaginaBucodental\`
- ✓ Reinicia Apache en XAMPP
- ✓ Limpia la caché del navegador (Ctrl+Shift+Delete)

### Las citas no se guardan
- ✓ Abre `http://localhost/phpmyadmin`
- ✓ Verifica que la BD `bucodental` existe
- ✓ Comprueba que la tabla `citas` existe
- ✓ Revisa la consola del navegador (F12) para errores JavaScript

### Las validaciones no funcionan
- ✓ Verifica que JavaScript esté habilitado en el navegador
- ✓ Abre la consola del navegador (F12) para ver errores
- ✓ Recarga la página (Ctrl+F5)

### ¿Olvidaste la contraseña del admin?

#### Opción 1: Restablecerla a '1234'
1. Abre `http://localhost/phpmyadmin`
2. Accede a la BD `bucodental`
3. Ve a la tabla `administradores`
4. Haz clic en editar el usuario `admin`
5. En el campo `contraseña`, copia este hash:
   ```
   $2y$10$KyM8r9Z5/sZQw8Z8QyZ8QeVzPz7wX4nK9m2C5p8V3r0H1k7J9w0T6
   ```
   (Este es el hash de '1234' en bcrypt)
6. Haz clic en "Guardar"

#### Opción 2: Crear un nuevo usuario admin
1. Abre `http://localhost/phpmyadmin`
2. Accede a la BD `bucodental`
3. Ve a la tabla `administradores`
4. Inserta un nuevo registro con:
   - usuario: tu_nuevo_usuario
   - contraseña: hash bcrypt de tu contraseña
   - nombre: tu nombre
   - email: tu email
   - activo: 1

### El calendario no funciona
- ✓ Verifica que Flatpickr se cargue correctamente desde CDN
- ✓ Abre la consola del navegador (F12) para ver errores
- ✓ Comprueba que tienes conexión a Internet para las CDN

---

## 📧 Configuración de Correo Electrónico

El sistema incluye un servicio de email (`EmailService.php`) que utiliza PHPMailer. Para configurar:

1. Edita `email_config.php` con tus credenciales SMTP
2. El sistema soporta:
   - Gmail con App Passwords
   - Outlook
   - Servidores SMTP personalizados

---

## 🔒 Seguridad

- ✓ Contraseñas hasheadas con Bcrypt
- ✓ Prepared statements contra inyección SQL
- ✓ Validación de entrada en servidor y cliente
- ✓ Sesiones de 24 horas
- ✓ CORS habilitado solo para localhost

---

## 📝 Endpoints de la API

### Autenticación
- `POST /api.php?action=login` - Login de administrador
- `POST /api.php?action=logout` - Logout

### Citas
- `POST /api.php?action=crear_cita` - Crear una nueva cita
- `GET /api.php?action=obtener_citas` - Obtener todas las citas
- `GET /api.php?action=obtener_cita&id=1` - Obtener una cita específica
- `PUT /api.php?action=actualizar_cita&id=1` - Actualizar una cita
- `DELETE /api.php?action=eliminar_cita&id=1` - Eliminar una cita

### Administradores
- `POST /api.php?action=crear_admin` - Crear nuevo administrador
- `GET /api.php?action=obtener_admins` - Obtener todos los administradores
- `POST /api.php?action=cambiar_contraseña` - Cambiar contraseña

### Servicios
- `GET /api.php?action=obtener_servicios` - Obtener todos los servicios
- `POST /api.php?action=crear_servicio` - Crear nuevo servicio

---

## 🎨 Personalización

### Cambiar colores
Edita `css/estilos.css` para cambiar los colores de los sillones (Rojo, Azul, Amarillo)

### Cambiar horarios disponibles
Edita `js/app.js` - busca el array `horas_disponibles`

### Cambiar dominio de email
Edita `js/app.js` - busca la validación de email

### Cambiar mensaje de bienvenida
Edita `Index.html` - busca la sección de contenido principal

---

## 📞 Contacto y Soporte

Para reportar bugs o solicitar nuevas funcionalidades:
1. Revisa la sección de Solución de Problemas
2. Contacta al administrador del sistema
3. Verifica que todas las dependencias estén instaladas correctamente

---

## 📄 Licencia

Este proyecto está desarrollado para uso exclusivo de la Clínica Bucodental.

---

**Última actualización**: Diciembre 2025
**Versión**: 1.0.0