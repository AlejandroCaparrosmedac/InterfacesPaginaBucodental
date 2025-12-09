// ============================================
// SISTEMA DE AUTENTICACIÓN Y ADMINISTRACIÓN
// ============================================

// Configuración
const ADMIN_CONFIG = {
    apiUrl: 'api.php',
    sessionKey: 'adminSession',
    citasKey: 'citas'
};

// ============================================
// INICIALIZACIÓN
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    verificarSesion();
    configurarEventos();
});

// ============================================
// GESTIÓN DE SESIÓN
// ============================================

/**
 * Verifica si el usuario tiene una sesión activa
 */
function verificarSesion() {
    const sesion = JSON.parse(sessionStorage.getItem(ADMIN_CONFIG.sessionKey));
    
    if (sesion && sesion.usuario && sesion.timestamp) {
        // Verificar que la sesión no haya expirado (24 horas)
        const ahora = Date.now();
        const tiempoTranscurrido = ahora - sesion.timestamp;
        const unDia = 24 * 60 * 60 * 1000;
        
        if (tiempoTranscurrido < unDia) {
            mostrarPanelAdmin(sesion.usuario);
            return;
        } else {
            // Sesión expirada
            sessionStorage.removeItem(ADMIN_CONFIG.sessionKey);
        }
    }
    
    // Mostrar página de login
    mostrarLogin();
}

/**
 * Realiza el login del usuario contra la API
 */
async function iniciarSesion(usuario, contrasena) {
    try {
        const respuesta = await fetch(`${ADMIN_CONFIG.apiUrl}?action=login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                usuario: usuario,
                password: contrasena
            })
        });

        const datos = await respuesta.json();

        if (datos.success) {
            // Crear sesión local
            const sesion = {
                usuario: datos.usuario,
                nombre: datos.nombre,
                timestamp: Date.now()
            };
            sessionStorage.setItem(ADMIN_CONFIG.sessionKey, JSON.stringify(sesion));
            
            // Mostrar panel
            mostrarPanelAdmin(datos.usuario, datos.nombre);
            return true;
        } else {
            mostrarAlertaLogin('error', 'Credenciales inválidas', datos.message || 'Usuario o contraseña incorrectos.');
            return false;
        }
    } catch (error) {
        console.error('Error en login:', error);
        mostrarAlertaLogin('error', 'Error de conexión', 'No se pudo conectar con el servidor.');
        return false;
    }
}
/**
 * Cierra la sesión del usuario
 */
function cerrarSesion() {
    sessionStorage.removeItem(ADMIN_CONFIG.sessionKey);
    mostrarLogin();
    limpiarFormulario();
}

/**
 * Muestra el panel de administración
 */
function mostrarPanelAdmin(usuario, nombre) {
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('adminPage').style.display = 'block';
    document.getElementById('nombreUsuario').textContent = nombre || usuario.charAt(0).toUpperCase() + usuario.slice(1);
    cargarCitas();
}

/**
 * Muestra la página de login
 */
function mostrarLogin() {
    document.getElementById('loginPage').style.display = 'flex';
    document.getElementById('adminPage').style.display = 'none';
    limpiarFormulario();
}

// ============================================
// GESTIÓN DE CITAS
// ============================================

/**
 * Carga las citas desde localStorage
 */
async function cargarCitas() {
    try {
        const respuesta = await fetch(`${ADMIN_CONFIG.apiUrl}?action=obtener_citas`);
        const datos = await respuesta.json();

        if (datos.success) {
            mostrarCitasEnTabla(datos.citas || []);
            actualizarEstadisticas(datos.citas || []);
        } else {
            console.error('Error al cargar citas:', datos.message);
            mostrarCitasEnTabla([]);
        }
    } catch (error) {
        console.error('Error en cargarCitas:', error);
        mostrarCitasEnTabla([]);
    }
}

/**
 * Muestra las citas en la tabla
 */
function mostrarCitasEnTabla(citas) {
    const cuerpoTabla = document.getElementById('cuerpoTabla');
    
    if (!citas || citas.length === 0) {
        cuerpoTabla.innerHTML = `
            <tr>
                <td colspan="6" class="no-citas">
                    <div>
                        <i class="bi bi-inbox"></i>
                        <p>No hay citas programadas</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    // Ordenar citas por fecha y hora
    citas.sort((a, b) => {
        const dateA = new Date(a.fecha);
        const dateB = new Date(b.fecha);
        if (dateA !== dateB) return dateA - dateB;
        return a.hora.localeCompare(b.hora);
    });
    
    // Generar filas
    cuerpoTabla.innerHTML = citas.map((cita) => {
        // Convertir fecha YYYY-MM-DD a formato legible
        const fechaObj = new Date(cita.fecha + 'T00:00:00');
        const fechaFormato = fechaObj.toLocaleDateString('es-ES');
        
        return `
        <tr>
            <td><strong>${fechaFormato}</strong></td>
            <td>${cita.hora}</td>
            <td>
                <span class="sillon-badge sillon-${(cita.sillon || '').toLowerCase()}">
                    ${cita.sillon || '-'}
                </span>
            </td>
            <td>${cita.nombre}</td>
            <td><small>${cita.email}</small></td>
            <td>
                <button type="button" class="btn btn-sm btn-eliminar" data-id="${cita.id}" title="Eliminar cita">
                    <i class="bi bi-trash"></i> Eliminar
                </button>
            </td>
        </tr>
        `;
    }).join('');
    
    // Agregar event listeners a los botones de eliminar
    document.querySelectorAll('.btn-eliminar').forEach(boton => {
        boton.addEventListener('click', function() {
            const id = parseInt(this.getAttribute('data-id'));
            mostrarModalEliminarCita(id);
        });
    });
}

/**
 * Actualiza las estadísticas
 */
function actualizarEstadisticas(citas) {
    const total = citas.length;
    const rojo = citas.filter(c => c.sillon === 'Rojo').length;
    const azul = citas.filter(c => c.sillon === 'Azul').length;
    const amarillo = citas.filter(c => c.sillon === 'Amarillo').length;
    
    document.getElementById('totalCitas').textContent = total;
    document.getElementById('citasRojo').textContent = rojo;
    document.getElementById('citasAzul').textContent = azul;
    document.getElementById('citasAmarillo').textContent = amarillo;
}

// ============================================
// ELIMINACIÓN DE CITAS
// ============================================

/**
 * Elimina una cita del localStorage
 */
async function eliminarCita(id) {
    try {
        const respuesta = await fetch(`${ADMIN_CONFIG.apiUrl}?action=eliminar_cita&id=${id}`, {
            method: 'DELETE'
        });

        const datos = await respuesta.json();

        if (datos.success) {
            mostrarAlertaAdmin('success', 'Cita eliminada', datos.message);
            // Esperar a que se carguen las citas antes de cerrar el modal
            await cargarCitas();
            // Cerrar el modal después de recargar
            const modalInstance = bootstrap.Modal.getInstance(document.getElementById('modalEliminarCita'));
            if (modalInstance) {
                modalInstance.hide();
            }
        } else {
            mostrarAlertaAdmin('error', 'Error', datos.message || 'No se pudo eliminar la cita.');
        }
    } catch (error) {
        console.error('Error en eliminarCita:', error);
        mostrarAlertaAdmin('error', 'Error', 'Error de conexión con el servidor.');
    }
}

/**
 * Muestra modal de confirmación para eliminar cita
 */
function mostrarModalEliminarCita(id) {
    // Obtener la cita del DOM
    const fila = document.querySelector(`button[data-id="${id}"]`).closest('tr');
    const fecha = fila.querySelector('td:nth-child(1)').textContent.trim();
    const hora = fila.querySelector('td:nth-child(2)').textContent.trim();
    const nombre = fila.querySelector('td:nth-child(4)').textContent.trim();
    
    const mensaje = `¿Estás seguro de que deseas eliminar la cita de ${nombre} el ${fecha} a las ${hora}?`;
    
    // Actualizar mensaje del modal
    document.getElementById('mensajeEliminarCita').textContent = mensaje;
    
    // Remover event listeners anteriores
    const btnConfirmar = document.getElementById('btnConfirmarEliminar');
    const newBtnConfirmar = btnConfirmar.cloneNode(true);
    btnConfirmar.parentNode.replaceChild(newBtnConfirmar, btnConfirmar);
    
    // Agregar nuevo event listener
    document.getElementById('btnConfirmarEliminar').addEventListener('click', function() {
        eliminarCita(id);
    });
    
    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('modalEliminarCita'));
    modal.show();
}

// ============================================
// EXPORTACIÓN A PDF
// ============================================

/**
 * Descarga las citas en formato PDF
 */
async function descargarPDF() {
    try {
        const respuesta = await fetch(`${ADMIN_CONFIG.apiUrl}?action=obtener_citas`);
        const datos = await respuesta.json();
        
        if (!datos.success || !datos.citas || datos.citas.length === 0) {
            mostrarAlertaAdmin('warning', 'Sin datos', 'No hay citas para descargar.');
            return;
        }
        
        const citas = datos.citas;
        
        // Crear contenido HTML para el PDF
        const htmlContent = generarHTMLParaPDF(citas);
        
        // Configuración para html2pdf
        const opciones = {
            margin: 10,
            filename: `citas_${new Date().toISOString().split('T')[0]}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { orientation: 'landscape', unit: 'mm', format: 'a4' }
        };
        
        // Generar PDF
        html2pdf().set(opciones).from(htmlContent).save();
        
        mostrarAlertaAdmin('success', 'Descarga completada', 'El archivo PDF se ha descargado correctamente.');
    } catch (error) {
        console.error('Error en descargarPDF:', error);
        mostrarAlertaAdmin('error', 'Error', 'Error al descargar el PDF.');
    }
}

/**
 * Genera el HTML para el PDF
 */
function generarHTMLParaPDF(citas) {
    const fecha = new Date().toLocaleDateString('es-ES');
    const hora = new Date().toLocaleTimeString('es-ES');
    
    let filasTabla = citas
        .sort((a, b) => {
            const dateA = new Date(a.fecha);
            const dateB = new Date(b.fecha);
            if (dateA !== dateB) return dateA - dateB;
            return a.hora.localeCompare(b.hora);
        })
        .map((cita, index) => {
            // Convertir fecha YYYY-MM-DD a formato legible
            const fechaObj = new Date(cita.fecha + 'T00:00:00');
            const fechaFormato = fechaObj.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            
            const rowColor = index % 2 === 0 ? '#f8f9fa' : '#ffffff';
            
            return `
            <tr style="background-color: ${rowColor};">
                <td style="border-bottom: 1px solid #e0e0e0; padding: 12px; text-align: center; font-weight: 500;">${index + 1}</td>
                <td style="border-bottom: 1px solid #e0e0e0; padding: 12px; text-align: center;">${fechaFormato}</td>
                <td style="border-bottom: 1px solid #e0e0e0; padding: 12px; text-align: center; font-weight: 600;">${cita.hora}</td>
                <td style="border-bottom: 1px solid #e0e0e0; padding: 12px; text-align: center;">
                    <span style="
                        padding: 6px 12px;
                        border-radius: 20px;
                        color: white;
                        font-weight: bold;
                        font-size: 12px;
                        ${getSilloColorStyle(cita.sillon)}
                    ">
                        ${cita.sillon || '-'}
                    </span>
                </td>
                <td style="border-bottom: 1px solid #e0e0e0; padding: 12px; font-weight: 500;">${cita.nombre}</td>
                <td style="border-bottom: 1px solid #e0e0e0; padding: 12px; font-size: 13px;">${cita.email}</td>
            </tr>
        `;
        }).join('');
    
    return `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; color: #2c3e50; line-height: 1.6;">
            <!-- Encabezado -->
            <div style="background: linear-gradient(135deg, #2A6FB6 0%, #1e52a8 100%); color: white; padding: 30px; border-radius: 8px; margin-bottom: 30px;">
                <div style="text-align: center;">
                    <h1 style="margin: 0; font-size: 28px; font-weight: 300; letter-spacing: 0.5px;">REPORTE DE CITAS</h1>
                    <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">Clínica de Higiene Bucodental</p>
                </div>
            </div>
            
            <!-- Información del reporte -->
            <div style="display: flex; justify-content: space-between; margin-bottom: 25px; padding: 0 5px;">
                <div>
                    <p style="margin: 5px 0; font-size: 13px;">
                        <strong>Fecha de generación:</strong> ${fecha}
                    </p>
                    <p style="margin: 5px 0; font-size: 13px;">
                        <strong>Hora:</strong> ${hora}
                    </p>
                </div>
                <div style="text-align: right;">
                    <p style="margin: 5px 0; font-size: 13px;">
                        <strong>Total de citas:</strong> ${citas.length}
                    </p>
                </div>
            </div>
            
            <!-- Tabla de citas -->
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <thead>
                    <tr style="background-color: #2A6FB6; color: white; border: none;">
                        <th style="padding: 12px; text-align: center; font-weight: 600; border: none; width: 5%;">N°</th>
                        <th style="padding: 12px; text-align: center; font-weight: 600; border: none; width: 25%;">Fecha</th>
                        <th style="padding: 12px; text-align: center; font-weight: 600; border: none; width: 12%;">Hora</th>
                        <th style="padding: 12px; text-align: center; font-weight: 600; border: none; width: 15%;">Sillón</th>
                        <th style="padding: 12px; text-align: left; font-weight: 600; border: none; width: 20%;">Paciente</th>
                        <th style="padding: 12px; text-align: left; font-weight: 600; border: none; width: 23%;">Email</th>
                    </tr>
                </thead>
                <tbody>
                    ${filasTabla}
                </tbody>
            </table>
            
            <!-- Pie de página -->
            <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #e0e0e0;">
                <p style="font-size: 11px; color: #7f8c8d; margin: 5px 0;">
                    Este documento ha sido generado automáticamente desde el Sistema de Gestión de Citas.
                </p>
                <p style="font-size: 11px; color: #7f8c8d; margin: 5px 0;">
                    Para mayor información, contacte con el administrador del sistema.
                </p>
            </div>
        </div>
    `;
}

/**
 * Retorna el estilo de color para cada sillón
 */
function getSilloColorStyle(sillon) {
    const colores = {
        'Rojo': 'background-color: #DC3545;',
        'Azul': 'background-color: #0D6EFD;',
        'Amarillo': 'background-color: #FFC107; color: black;'
    };
    return colores[sillon] || 'background-color: #6c757d;';
}

// ============================================
// CONFIGURACIÓN DE EVENTOS
// ============================================

function configurarEventos() {
    // Formulario de login
    const formularioLogin = document.getElementById('formularioLogin');
    if (formularioLogin) {
        formularioLogin.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const usuario = document.getElementById('usuarioLogin').value.trim();
            const contrasena = document.getElementById('contrasenaLogin').value;
            
            if (iniciarSesion(usuario, contrasena)) {
                limpiarFormulario();
            }
        });
    }
    
    // Botón logout
    const botonLogout = document.getElementById('botonLogout');
    if (botonLogout) {
        botonLogout.addEventListener('click', function() {
            const modal = new bootstrap.Modal(document.getElementById('modalCerrarSesion'));
            modal.show();
        });
    }
    
    // Botón de confirmación de cerrar sesión
    const btnConfirmarCerrarSesion = document.getElementById('btnConfirmarCerrarSesion');
    if (btnConfirmarCerrarSesion) {
        btnConfirmarCerrarSesion.addEventListener('click', function() {
            cerrarSesion();
            bootstrap.Modal.getInstance(document.getElementById('modalCerrarSesion')).hide();
        });
    }
    
    // Botón descargar PDF
    const botonPDF = document.getElementById('botonDescargarPDF');
    if (botonPDF) {
        botonPDF.addEventListener('click', descargarPDF);
    }
    
    // Permitir Enter en campo de usuario
    const usuarioInput = document.getElementById('usuarioLogin');
    if (usuarioInput) {
        usuarioInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                document.getElementById('contrasenaLogin').focus();
            }
        });
    }
    
    // Permitir Enter en campo de contraseña
    const contrasenaInput = document.getElementById('contrasenaLogin');
    if (contrasenaInput) {
        contrasenaInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                formularioLogin.dispatchEvent(new Event('submit'));
            }
        });
    }
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================

/**
 * Muestra alertas en la página de login
 */
function mostrarAlertaLogin(tipo, titulo, mensaje) {
    const alertaDiv = document.getElementById('alertaLogin');
    
    const html = `
        <div class="alert alert-${tipo === 'error' ? 'danger' : tipo} alert-dismissible fade show" role="alert">
            <strong>${titulo}:</strong> ${mensaje}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;
    
    alertaDiv.innerHTML = html;
    
    // Auto-cerrar después de 4 segundos
    setTimeout(() => {
        alertaDiv.innerHTML = '';
    }, 4000);
}

/**
 * Muestra alertas en el panel de administración
 */
function mostrarAlertaAdmin(tipo, titulo, mensaje) {
    // Crear div de alerta
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${tipo} alert-dismissible fade show`;
    alertDiv.setAttribute('role', 'alert');
    alertDiv.innerHTML = `
        <strong>${titulo}:</strong> ${mensaje}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    // Insertar en el DOM
    const mainElement = document.querySelector('main');
    mainElement.insertBefore(alertDiv, mainElement.firstChild);
    
    // Auto-cerrar después de 4 segundos
    setTimeout(() => {
        alertDiv.remove();
    }, 4000);
}

/**
 * Limpia el formulario de login
 */
function limpiarFormulario() {
    document.getElementById('formularioLogin').reset();
    document.getElementById('alertaLogin').innerHTML = '';
}

// ============================================
// EXPORTAR FUNCIONES GLOBALES
// ============================================

window.iniciarSesion = iniciarSesion;
window.cerrarSesion = cerrarSesion;
window.descargarPDF = descargarPDF;
window.eliminarCita = eliminarCita;
