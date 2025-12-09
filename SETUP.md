# Sistema de Gestión de Citas Bucodental

## Descripción
Sistema web para gestionar citas de odontología con interfaz para pacientes y panel de administración.

## Requisitos
- XAMPP (Apache + MySQL)
- Navegador web moderno
- PHP 7.4 o superior

## Instalación

### 1. Preparar la carpeta
```
C:\xampp\htdocs\InterfacesPaginaBucodental\
```

### 2. Inicializar la Base de Datos

Asegúrate de que:
- Apache esté activo en XAMPP
- MySQL esté activo en XAMPP

Luego, abre en tu navegador:
```
http://localhost/InterfacesPaginaBucodental/init_db.php
```

Deberías ver un JSON confirmando la creación de la base de datos y tablas:
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

## Estructura de la Base de Datos

### Tabla: administradores
```
- id: INT (PRIMARY KEY)
- usuario: VARCHAR (UNIQUE)
- contraseña: VARCHAR (hash bcrypt)
- nombre: VARCHAR
- email: VARCHAR
- fecha_creacion: TIMESTAMP
- activo: BOOLEAN
```

### Tabla: citas
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

### Tabla: servicios
```
- id: INT (PRIMARY KEY)
- titulo: VARCHAR
- descripcion: LONGTEXT
- categoria: VARCHAR
- fecha_creacion: TIMESTAMP
```

## Uso del Sistema

### Página Principal (Index.html)
- **Pedir Cita**: Los usuarios pueden agendar citas seleccionando fecha, hora y sillón
- **Buscar Cita**: Los usuarios pueden buscar sus citas por email
- **Recomendaciones**: Sección informativa sobre higiene bucodental

### Panel de Administración (admin.html)
**Acceso**: Botón "Admin" en la esquina superior derecha

**Credenciales por defecto**:
- Usuario: `admin`
- Contraseña: `1234`

**Funcionalidades**:
- Ver todas las citas registradas
- Eliminar citas
- Cambiar contraseña (próximamente)
- Exportar citas a PDF (próximamente)
- Exportar citas a Excel (próximamente)

## API Endpoints

Base: `http://localhost/InterfacesPaginaBucodental/api.php?action=`

### Autenticación
```
POST ?action=login
Body: { usuario: string, password: string }
```

### Citas
```
POST ?action=crear_cita
Body: { fecha, hora, nombre, email, telefono, sillon, notas }

GET ?action=obtener_citas

GET ?action=obtener_cita&id=1

GET ?action=obtener_citas_fecha&fecha=2025-12-15

PUT ?action=actualizar_cita
Body: { id, estado, sillon, notas }

DELETE ?action=eliminar_cita&id=1
```

### Servicios
```
GET ?action=obtener_servicios

POST ?action=crear_servicio
Body: { titulo, descripcion, categoria }
```

### Administradores
```
GET ?action=obtener_admins

POST ?action=crear_admin
Body: { usuario, password, nombre, email }

POST ?action=cambiar_password
Body: { usuario, password_actual, password_nueva }
```

## Seguridad

- ✓ Contraseñas almacenadas con hash bcrypt
- ✓ Validación de entrada en servidor
- ✓ Preparación de consultas SQL contra inyección
- ✓ Control de acceso a panel admin
- ✓ Sesiones con expiración de 24 horas

## Cambio de Contraseña Admin

Para cambiar la contraseña del usuario admin:

**Opción 1: Desde phpMyAdmin**
1. Abre: `http://localhost/phpmyadmin`
2. Selecciona BD `bucodental` → Tabla `administradores`
3. Edita el usuario `admin`
4. Genera el hash con:
```php
password_hash('nueva_contraseña', PASSWORD_BCRYPT)
```

**Opción 2: Desde API** (próxima implementación en panel admin)
```
POST api.php?action=cambiar_password
Body: {
    usuario: 'admin',
    password_actual: '1234',
    password_nueva: 'nueva_contraseña'
}
```

## Archivos del Proyecto

```
InterfacesPaginaBucodental/
├── Index.html              # Página principal
├── admin.html              # Panel de administración
├── config.php              # Configuración de base de datos
├── init_db.php             # Script de inicialización de BD
├── api.php                 # API REST
├── css/
│   └── estilos.css        # Estilos CSS
├── img/                    # Imágenes del proyecto
├── js/
│   ├── app.js             # Lógica de página principal
│   ├── admin.js           # Lógica de panel admin
│   └── config.js          # Configuración general
└── README.md              # Este archivo
```

## Próximas Mejoras

- [ ] Generación de reportes en PDF
- [ ] Exportación a Excel desde panel admin
- [ ] Notificaciones por email para citas
- [ ] Sistema de disponibilidad en tiempo real
- [ ] Confirmación de citas por admin
- [ ] Historial de cambios

## Soporte

Para reportar errores o sugerencias, contacta al administrador del sistema.

---

**Última actualización**: Diciembre 2025
