# Sistema de Gestión de Citas - Clínica Bucodental

## 📋 Descripción General

Sistema completo para la gestión de citas odontológicas con:
- **Calendario interactivo** (Flatpickr) que solo permite seleccionar viernes
- **Modal de cita** con validación de datos
- **Consulta de citas** por email
- **Almacenamiento en Excel** (SheetJS)
- **Persistencia de datos** en localStorage

---

## 🚀 Características Implementadas

### 1. **Calendario Interactivo**
- ✅ Uso de Flatpickr con soporte multiidioma
- ✅ Solo permite seleccionar viernes
- ✅ Deshabilita automáticamente otros días de la semana
- ✅ Navegación entre meses

### 2. **Formulario de Cita**
Contiene los siguientes campos:
- **Día**: Selector de fecha restringido a viernes (Flatpickr)
- **Hora**: Desplegable con 9 opciones (15:15 a 20:35)
- **Sillón**: Seleccionar entre Rojo, Azul o Amarillo
- **Nombre completo**: Mínimo 3 caracteres
- **Email**: Solo @alu.medac.es
- **Teléfono**: Formato español (9 dígitos, comenzando con 6, 7, 8 o 9)

### 3. **Validaciones**
- ✅ Validación en tiempo real de campos
- ✅ Email restringido a dominio @alu.medac.es
- ✅ Teléfono con formato español
- ✅ Nombre con mínimo 3 caracteres
- ✅ Todos los campos obligatorios

### 4. **Gestión de Citas**
- **Guardar**: Almacena en localStorage y descarga Excel automáticamente
- **Consultar**: Busca por email y muestra detalles
- **Excel**: SheetJS genera archivo .xlsx con todas las citas

### 5. **Interfaz de Usuario**
- ✅ Modales Bootstrap 5 responsive
- ✅ Alertas de confirmación
- ✅ Diseño consistente con colores corporativos
- ✅ Animaciones suaves

---

## 📦 Librerías Utilizadas

### 1. **Flatpickr** - Calendario interactivo
```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css">
<script src="https://cdn.jsdelivr.net/npm/flatpickr"></script>
```

### 2. **SheetJS** - Generación de Excel
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.min.js"></script>
```

### 3. **Bootstrap 5** - UI y componentes (ya estaba)
```html
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js"></script>
```

---

## 📁 Estructura de Carpetas

```
InterfacesPaginaBucodental/
├── Index.html          # HTML principal
├── css/
│   └── estilos.css    # Estilos CSS
├── js/
│   └── app.js         # Lógica JavaScript
├── img/               # Imágenes
└── README.md          # Este archivo
```

---

## 🔧 Instalación y Configuración

### Paso 1: Verificar archivos
Asegúrate de que existen estos archivos:
- `Index.html`
- `css/estilos.css`
- `js/app.js`
- `img/` (carpeta de imágenes)

### Paso 2: No requiere instalación
El proyecto usa CDN para las librerías, no necesita npm o instalación.

### Paso 3: Abrir en navegador
```bash
# Simplemente abre Index.html en un navegador moderno
# Recomendado: Chrome, Firefox, Safari o Edge (versiones recientes)
```

---

## 💾 Almacenamiento de Datos

### localStorage
- **Ubicación**: Almacenamiento del navegador
- **Descripción**: Las citas se guardan automáticamente
- **Ventaja**: Persistencia entre sesiones
- **Limitaciones**: Solo funciona en el mismo navegador/dispositivo

### Excel (.xlsx)
- **Generación**: Se crea automáticamente al guardar cita
- **Nombre**: `citas.xlsx`
- **Contenido**:
  | Fecha | Hora | Sillón | Nombre | Email | Teléfono | Fecha de Registro |
  |-------|------|--------|--------|-------|----------|------------------|
  | 15/02/2025 | 15:15 | Rojo | Juan Pérez | juan@alu.medac.es | 666123456 | 08/12/2024 10:30:15 |

---

## 👨‍💻 Guía de Uso

### Para los Usuarios

#### Pedir una Cita:
1. Click en botón **"Pedir Cita"**
2. Se abre un modal con un formulario
3. Selecciona un **viernes** en el calendario
4. Elige una **hora** disponible
5. Selecciona un **sillón** (color)
6. Ingresa tu **nombre completo**
7. Ingresa tu **email** (@alu.medac.es)
8. Ingresa tu **teléfono** (formato español)
9. Click en **"Confirmar Cita"**
10. Se descarga automáticamente el archivo Excel
11. Recibirás una confirmación con los detalles

#### Consultar una Cita:
1. Click en botón **"Consultar Cita"**
2. Ingresa el **email** de la cita
3. Click en **"Buscar Cita"**
4. Se mostrarán los detalles o un mensaje de "No encontrado"

---

## 🛠️ Funciones JavaScript Disponibles

### Para desarrolladores (disponibles en consola):

```javascript
// Obtener todas las citas
window.obtenerTodasLasCitas()

// Exportar a Excel manualmente
window.exportarCitasAExcel()
```

---

## ⚠️ Validaciones Implementadas

### Email
- ✅ Debe terminar con @alu.medac.es
- ✅ Formato válido de email
- ✅ Ejemplo válido: `juan@alu.medac.es`
- ✗ Rechaza: `juan@gmail.com`, `invalid@alu.medac`

### Teléfono
- ✅ Exactamente 9 dígitos
- ✅ Debe comenzar con 6, 7, 8 o 9
- ✅ Ejemplo válido: `666123456`, `912345678`
- ✗ Rechaza: `123456789` (comienza con 1), `66612345` (8 dígitos)

### Nombre
- ✅ Mínimo 3 caracteres
- ✅ Acepta letras, espacios y caracteres especiales
- ✗ Rechaza: `Ab` (muy corto)

### Fecha
- ✅ Solo viernes
- ✅ Desde la fecha actual en adelante
- ✓ Rechaza automáticamente otros días

### Hora
- ✅ Una de: 15:15, 15:55, 16:35, 17:15, 17:55, 18:35, 19:15, 19:55, 20:35
- ✓ Campo obligatorio

### Sillón
- ✅ Una de: Rojo, Azul, Amarillo
- ✓ Campo obligatorio

---

## 🎨 Personalización

### Cambiar colores corporativos
En `css/estilos.css`, busca `#2A6FB6` y reemplaza con tu color:
```css
/* Cambiar color principal */
header { background-color: #TUCOLOR; }
#botonPedirCita { background-color: #TUCOLOR; }
```

### Cambiar horas disponibles
En `js/app.js`, edita:
```javascript
horasDisponibles: ['15:15', '15:55', '16:35', ...],
```

### Cambiar sillones
En `js/app.js`, edita:
```javascript
sillones: ['Rojo', 'Azul', 'Amarillo'],
```

### Cambiar dominio de email
En `js/app.js`, edita:
```javascript
emailDomain: '@alu.medac.es',
```

---

## 🐛 Solución de Problemas

### El calendario no funciona
- ✓ Verifica que Flatpickr está cargado desde CDN
- ✓ Abre la consola (F12) y busca errores
- ✓ Recarga la página

### El Excel no se descarga
- ✓ Verifica que SheetJS está cargado
- ✓ Revisa la consola del navegador
- ✓ Prueba en otro navegador

### Las citas no se guardan
- ✓ Verifica que localStorage está habilitado
- ✓ Abre las DevTools (F12) → Application → Local Storage
- ✓ Prueba borrar datos del navegador

### Validaciones no funcionan
- ✓ Asegúrate de que app.js está siendo cargado
- ✓ Revisa la consola (F12) para errores
- ✓ Verifica los IDs de los elementos HTML

---

## 📱 Compatibilidad

| Navegador | Versión Mínima | Estado |
|-----------|----------------|--------|
| Chrome    | 90+            | ✅ Totalmente compatible |
| Firefox   | 88+            | ✅ Totalmente compatible |
| Safari    | 14+            | ✅ Totalmente compatible |
| Edge      | 90+            | ✅ Totalmente compatible |
| Internet Explorer | -      | ❌ No compatible |

---

## 📝 Historial de Cambios

### v1.0 - Diciembre 2024
- ✅ Calendario interactivo con Flatpickr
- ✅ Modal de pedir cita completo
- ✅ Modal de consultar cita
- ✅ Validaciones completas
- ✅ Integración con Excel (SheetJS)
- ✅ localStorage para persistencia
- ✅ Diseño responsive
- ✅ Documentación completa

---

## 📧 Soporte

Si encuentras problemas:
1. Revisa la consola del navegador (F12 → Console)
2. Busca el mensaje de error
3. Verifica que todos los archivos están en su lugar
4. Recarga la página (Ctrl+F5 para limpiar caché)

---

## ⚖️ Licencia

Este proyecto fue creado para propósitos educativos.

---

## 🎯 Próximas Mejoras Sugeridas

- [ ] Backend Node.js para almacenamiento permanente
- [ ] Autenticación de usuarios
- [ ] Envío de emails de confirmación
- [ ] Sistema de notificaciones
- [ ] Dashboard administrativo
- [ ] Exportación a Google Calendar
- [ ] Integración con WhatsApp
- [ ] Disponibilidad en tiempo real

---

**Última actualización**: 8 de Diciembre de 2024