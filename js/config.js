// ============================================
// CONFIGURACIÓN - PERSONALIZACIÓN DEL SISTEMA
// ============================================
//
// Este archivo permite personalizar fácilmente
// los parámetros del sistema sin modificar app.js
//
// INSTRUCCIONES:
// 1. Edita los valores de las variables abajo
// 2. Guarda el archivo
// 3. Recarga la página en el navegador
// 4. Los cambios se aplicarán automáticamente
//

// ============================================
// CONFIGURACIÓN DE EMAIL
// ============================================

// Dominio permitido para emails
const CONFIG_EMAIL = {
    dominio: '@alu.medac.es',
    
    // Si quieres permitir múltiples dominios, cambia a:
    // dominios: ['@alu.medac.es', '@medac.es', '@dentistas.es'],
    
    // Descripción para mostrar al usuario
    descripcion: 'Solo se aceptan correos @alu.medac.es'
};

// ============================================
// CONFIGURACIÓN DE HORAS
// ============================================

// Horas disponibles para las citas
const CONFIG_HORAS = [
    '15:15',
    '15:55',
    '16:35',
    '17:15',
    '17:55',
    '18:35',
    '19:15',
    '19:55',
    '20:35'
];

// Agregar más horas:
// const CONFIG_HORAS = [
//     '14:00', '14:40',
//     '15:15', '15:55', '16:35',
//     '17:15', '17:55', '18:35',
//     '19:15', '19:55', '20:35'
// ];

// ============================================
// CONFIGURACIÓN DE SILLONES
// ============================================

// Sillones disponibles
const CONFIG_SILLONES = [
    'Rojo',
    'Azul',
    'Amarillo'
];

// Agregar más sillones:
// const CONFIG_SILLONES = [
//     'Rojo',
//     'Azul',
//     'Amarillo',
//     'Verde',
//     'Morado'
// ];

// ============================================
// CONFIGURACIÓN DE DÍAS
// ============================================

// Día de la semana para citas (0=Domingo, 1=Lunes, ... 5=Viernes, 6=Sábado)
const CONFIG_DIA_SEMANA = 5; // 5 = Viernes

// Para cambiar a otros días:
// const CONFIG_DIA_SEMANA = 0;  // Domingo
// const CONFIG_DIA_SEMANA = 1;  // Lunes
// const CONFIG_DIA_SEMANA = 2;  // Martes
// const CONFIG_DIA_SEMANA = 3;  // Miércoles
// const CONFIG_DIA_SEMANA = 4;  // Jueves
// const CONFIG_DIA_SEMANA = 5;  // Viernes
// const CONFIG_DIA_SEMANA = 6;  // Sábado

// ============================================
// CONFIGURACIÓN DE COLORES
// ============================================

// Color principal corporativo (azul)
const CONFIG_COLOR_PRIMARIO = '#2A6FB6';

// Color secundario (para alertas, etc.)
const CONFIG_COLOR_SECUNDARIO = '#17a2b8';

// Color de éxito
const CONFIG_COLOR_EXITO = '#28a745';

// Color de error
const CONFIG_COLOR_ERROR = '#dc3545';

// ============================================
// CONFIGURACIÓN DE VALIDACIONES
// ============================================

const CONFIG_VALIDACIONES = {
    // Longitud mínima del nombre
    nombreMinLen: 3,
    
    // Longitud máxima del nombre
    nombreMaxLen: 100,
};

// ============================================
// CONFIGURACIÓN DE EXCEL
// ============================================

const CONFIG_EXCEL = {
    // Nombre del archivo Excel
    nombreArchivo: 'citas.xlsx',
    
    // Nombre de la hoja dentro del Excel
    nombreHoja: 'Citas',
    
    // Columnas a incluir en el Excel
    columnas: {
        'Fecha': 'fecha',
        'Hora': 'hora',
        'Sillón': 'sillon',
        'Nombre': 'nombre',
        'Email': 'email',
        'Fecha de Registro': 'fechaCreacion'
    },
    
    // Ancho de las columnas (en caracteres)
    anchoColumnas: [15, 10, 15, 20, 25, 15, 20]
};

// ============================================
// CONFIGURACIÓN DE IDIOMA
// ============================================

const CONFIG_IDIOMA = {
    // Idioma para Flatpickr
    idioma: 'es',
    
    // Formato de fecha
    // 'd/m/Y' = 15/02/2025
    // 'Y-m-d' = 2025-02-15
    // 'd-m-Y' = 15-02-2025
    formatoFecha: 'd/m/Y',
    
    // Textos personalizables
    textos: {
        diasDisponibles: 'Solo se pueden seleccionar viernes',
        citaConfirmada: '¡Cita registrada exitosamente!',
        citaNoEncontrada: 'No existen citas registradas con este correo electrónico.',
        soloViernes: 'Solo se pueden seleccionar viernes',
        formatoEmailIncorrecto: 'Solo se aceptan emails de ' + CONFIG_EMAIL.dominio
    }
};

// ============================================
// CONFIGURACIÓN DE LOCALSTORAGE
// ============================================

const CONFIG_STORAGE = {
    // Clave para almacenar las citas
    claveCitas: 'citas',
    
    // Tiempo de expiración en días (0 = sin expiración)
    expiracionDias: 0,
    
    // Máximo número de citas a almacenar (0 = sin límite)
    maxCitas: 0
};

// ============================================
// CONFIGURACIÓN DE NOTIFICACIONES
// ============================================

const CONFIG_NOTIFICACIONES = {
    // Tiempo en segundos para mostrar alertas
    tiempoAlerta: 5,
    
    // Habilitar sonido (requiere archivo de audio)
    habilitarSonido: false,
    
    // Habilitar notificaciones del navegador
    habilitarNotificaciones: false
};

// ============================================
// CONFIGURACIÓN AVANZADA
// ============================================

const CONFIG_AVANZADA = {
    // Modo de depuración (muestra logs en consola)
    debug: true,
    
    // Validación en tiempo real
    validacionTiempoReal: true,
    
    // Limpiar formulario después de guardar
    limpiarFormularioAlGuardar: true,
    
    // Cerrar modal automáticamente después de guardar
    cerrarModalAlGuardar: true,
    
    // Tiempo en ms para cerrar el modal
    tiempoCierreModal: 2000,
    
    // Generar Excel automáticamente
    generarExcelAutomatico: true
};

// ============================================
// EXPORTAR CONFIGURACIÓN
// ============================================

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        CONFIG_EMAIL,
        CONFIG_HORAS,
        CONFIG_SILLONES,
        CONFIG_DIA_SEMANA,
        CONFIG_COLOR_PRIMARIO,
        CONFIG_COLOR_SECUNDARIO,
        CONFIG_VALIDACIONES,
        CONFIG_EXCEL,
        CONFIG_IDIOMA,
        CONFIG_STORAGE,
        CONFIG_NOTIFICACIONES,
        CONFIG_AVANZADA
    };
}
