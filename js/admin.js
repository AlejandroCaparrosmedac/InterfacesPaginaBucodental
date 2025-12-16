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

document.addEventListener('DOMContentLoaded', function () {
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
 * Muestra las citas en la tabla agrupadas por fecha
 */
function mostrarCitasEnTabla(citas) {
    const cuerpoTabla = document.getElementById('cuerpoTabla');

    if (!citas || citas.length === 0) {
        cuerpoTabla.innerHTML = `
            <tr>
                <td colspan="7" class="no-citas">
                    <div>
                        <i class="bi bi-inbox"></i>
                        <p>No hay citas programadas</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }


    // FILTRAR CITAS: Solo mostrar citas de hoy en adelante
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0); // Establecer a medianoche para comparar solo fechas
    
    const citasFuturas = citas.filter(cita => {
        const fechaCita = new Date(cita.fecha + 'T00:00:00');
        return fechaCita >= hoy;
    });

    // Si no hay citas futuras, mostrar mensaje
    if (citasFuturas.length === 0) {
        cuerpoTabla.innerHTML = `
            <tr>
                <td colspan="7" class="no-citas">
                    <div>
                        <i class="bi bi-inbox"></i>
                        <p>No hay citas programadas (solo se muestran citas de hoy en adelante)</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    // Ordenar citas por fecha y hora
    citasFuturas.sort((a, b) => {
        const dateA = new Date(a.fecha);
        const dateB = new Date(b.fecha);
        if (dateA.getTime() !== dateB.getTime()) return dateA - dateB;
        return a.hora.localeCompare(b.hora);
    });

    // Agrupar citas por fecha
    const citasPorFecha = {};
    citasFuturas.forEach(cita => {
        if (!citasPorFecha[cita.fecha]) {
            citasPorFecha[cita.fecha] = [];
        }
        citasPorFecha[cita.fecha].push(cita);
    });

    // Generar HTML con agrupación por fecha
    let htmlCompleto = '';

    Object.keys(citasPorFecha).sort().forEach((fecha, grupoIndex) => {
        const citasDelDia = citasPorFecha[fecha];

        // Convertir fecha YYYY-MM-DD a formato legible
        const fechaObj = new Date(fecha + 'T00:00:00');
        const opciones = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        const fechaFormato = fechaObj.toLocaleDateString('es-ES', opciones);

        // Capitalizar primera letra del día de la semana
        const fechaCapitalizada = fechaFormato.charAt(0).toUpperCase() + fechaFormato.slice(1);

        // Fila de encabezado de fecha (COLLAPSIBLE + BOTONES)
        htmlCompleto += `
            <tr class="fecha-grupo-header" data-fecha="${fecha}" onclick="toggleGrupoFecha('${fecha}')" style="cursor: pointer;">
                <td colspan="7" style="background: linear-gradient(135deg, #2A6FB6 0%, #1e52a8 100%); color: white; padding: 12px 20px; font-weight: 700; font-size: 1.1rem; text-align: left; border: none;">
                    <i class="bi bi-chevron-right arrow-icon collapsed" id="arrow-${fecha}"></i>
                    <i class="bi bi-calendar-event"></i> ${fechaCapitalizada}
                    <span style="float: right; font-size: 0.9rem; opacity: 0.9;">
                        <button class="btn btn-sm btn-danger me-2" data-fecha="${fecha}" onclick="event.stopPropagation(); eliminarTodasCitasDia('${fecha}')" title="Eliminar todas las citas de este día">
                            <i class="bi bi-trash-fill"></i> Eliminar Todas
                        </button>
                        <button class="btn btn-sm btn-pdf-dia" data-fecha="${fecha}" onclick="event.stopPropagation(); descargarPDFPorDia('${fecha}')" title="Descargar PDF de este día">
                            <i class="bi bi-file-earmark-pdf"></i> PDF
                        </button>
                        ${citasDelDia.length} cita${citasDelDia.length !== 1 ? 's' : ''}
                    </span>
                </td>
            </tr>
        `;

        // Filas de citas para esta fecha
        citasDelDia.forEach((cita, index) => {
            const fechaSimple = fechaObj.toLocaleDateString('es-ES');
            const esFilaPar = index % 2 === 0;
            const colorFondo = esFilaPar ? '#f8f9fa' : '#ffffff';

            htmlCompleto += `
            <tr class="cita-row" data-fecha="${fecha}" data-id="${cita.id}" style="background-color: ${colorFondo}; display: none;">
                <td style="padding-left: 30px;"><strong>${fechaSimple}</strong></td>
                <td><strong style="color: #2A6FB6; font-size: 1.05rem;">${cita.hora}</strong></td>
                <td>
                    <span class="sillon-badge sillon-${(cita.sillon || '').toLowerCase()}">
                        ${cita.sillon || '-'}
                    </span>
                </td>
                <td><strong>${cita.nombre}</strong></td>
                <td><small>${cita.email}</small></td>
                <td>
                    <button type="button" class="btn btn-sm btn-editar" data-id="${cita.id}" title="Editar cita">
                        <i class="bi bi-pencil"></i> Editar
                    </button>
                    <button type="button" class="btn btn-sm btn-eliminar" data-id="${cita.id}" title="Eliminar cita">
                        <i class="bi bi-trash"></i> Eliminar
                    </button>
                </td>
            </tr>
            `;
        });

        // Añadir fila separadora entre grupos de fechas (excepto después del último grupo)
        if (grupoIndex < Object.keys(citasPorFecha).length - 1) {
            htmlCompleto += `
                <tr class="fecha-separador">
                    <td colspan="7" style="height: 15px; background-color: #e9ecef; border: none;"></td>
                </tr>
            `;
        }
    });

    cuerpoTabla.innerHTML = htmlCompleto;

    // Agregar event listeners a los botones de editar
    document.querySelectorAll('.btn-editar').forEach(boton => {
        boton.addEventListener('click', function () {
            const id = parseInt(this.getAttribute('data-id'));
            mostrarModalEditarCita(id);
        });
    });

    // Agregar event listeners a los botones de eliminar
    document.querySelectorAll('.btn-eliminar').forEach(boton => {
        boton.addEventListener('click', function () {
            const id = parseInt(this.getAttribute('data-id'));
            mostrarModalEliminarCita(id);
        });
    });
}

/**
 * Actualiza las estadísticas
 */
function actualizarEstadisticas(citas) {
    // FILTRAR: Solo contar citas de hoy en adelante
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0); // Establecer a medianoche para comparar solo fechas
    
    const citasFuturas = citas.filter(cita => {
        const fechaCita = new Date(cita.fecha + 'T00:00:00');
        return fechaCita >= hoy;
    });

    const total = citasFuturas.length;
    const rojo = citasFuturas.filter(c => c.sillon === 'Rojo').length;
    const azul = citasFuturas.filter(c => c.sillon === 'Azul').length;
    const amarillo = citasFuturas.filter(c => c.sillon === 'Amarillo').length;

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
        // Obtener el motivo de eliminación
        const motivo = document.getElementById('motivoEliminacion').value;
        
        if (!motivo.trim()) {
            mostrarAlertaAdmin('warning', 'Campo requerido', 'Por favor, ingresa un motivo de eliminación.');
            return;
        }

        const respuesta = await fetch(`${ADMIN_CONFIG.apiUrl}?action=eliminar_cita&id=${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                motivo: motivo
            })
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
    
    // Limpiar el textarea del motivo
    document.getElementById('motivoEliminacion').value = '';

    // Remover event listeners anteriores
    const btnConfirmar = document.getElementById('btnConfirmarEliminar');
    const newBtnConfirmar = btnConfirmar.cloneNode(true);
    btnConfirmar.parentNode.replaceChild(newBtnConfirmar, btnConfirmar);

    // Agregar nuevo event listener
    document.getElementById('btnConfirmarEliminar').addEventListener('click', function () {
        eliminarCita(id);
    });

    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('modalEliminarCita'));
    modal.show();
}

/**
 * Muestra modal para editar una cita
 */
function mostrarModalEditarCita(id) {
    // Obtener la cita del DOM
    const fila = document.querySelector(`button[data-id="${id}"].btn-editar`).closest('tr');
    const fecha = fila.querySelector('td:nth-child(1)').textContent.trim();
    const hora = fila.querySelector('td:nth-child(2)').textContent.trim();
    const sillon = fila.querySelector('td:nth-child(3)').textContent.trim();
    const nombre = fila.querySelector('td:nth-child(4)').textContent.trim();
    const email = fila.querySelector('td:nth-child(5)').textContent.trim();

    // Cargar datos en el formulario
    document.getElementById('editarNombre').value = nombre;
    document.getElementById('editarEmail').value = email;
    document.getElementById('editarFecha').value = fecha;
    document.getElementById('editarHora').value = hora;
    document.getElementById('editarSillon').value = sillon;

    // Configurar botones de sillón
    configurarBotonesSillonEditar(sillon);

    // Remover event listeners anteriores del botón confirmar
    const btnConfirmar = document.getElementById('btnConfirmarEditar');
    const newBtnConfirmar = btnConfirmar.cloneNode(true);
    btnConfirmar.parentNode.replaceChild(newBtnConfirmar, btnConfirmar);

    // Agregar nuevo event listener
    document.getElementById('btnConfirmarEditar').addEventListener('click', function () {
        guardarCambiosCita(id);
    });

    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('modalEditarCita'));
    modal.show();
}

/**
 * Configura los botones de sillón en el modal de edición
 */
function configurarBotonesSillonEditar(sillonActual) {
    const botones = {
        'editarSillonRojo': 'Rojo',
        'editarSillonAzul': 'Azul',
        'editarSillonAmarillo': 'Amarillo'
    };

    Object.entries(botones).forEach(([id, valor]) => {
        const boton = document.getElementById(id);
        
        // Remover listeners anteriores clonando el elemento
        const nuevoBoton = boton.cloneNode(true);
        boton.parentNode.replaceChild(nuevoBoton, boton);

        // Reseleccionar el botón
        const btnActualizado = document.getElementById(id);

        // Agregar listener
        btnActualizado.addEventListener('click', function (e) {
            e.preventDefault();

            // Remover active de todos
            document.querySelectorAll('.sillon-btn-editar').forEach(btn => {
                btn.classList.remove('active');
            });

            // Agregar active al seleccionado
            this.classList.add('active');

            // Guardar valor en input oculto
            document.getElementById('editarSillon').value = valor;
        });

        // Marcar como active si es el sillón actual
        if (valor === sillonActual) {
            btnActualizado.classList.add('active');
        }
    });
}

/**
 * Guarda los cambios de una cita
 */
async function guardarCambiosCita(id) {
    try {
        const nuevaFecha = document.getElementById('editarFecha').value;
        const nuevaHora = document.getElementById('editarHora').value;
        const nuevoSillon = document.getElementById('editarSillon').value;

        if (!nuevaFecha || !nuevaHora || !nuevoSillon) {
            mostrarAlertaAdmin('warning', 'Campos incompletos', 'Por favor, completa todos los campos.');
            return;
        }

        const respuesta = await fetch(`${ADMIN_CONFIG.apiUrl}?action=modificar_cita&id=${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                fecha: nuevaFecha,
                hora: nuevaHora,
                sillon: nuevoSillon
            })
        });

        const datos = await respuesta.json();

        if (datos.success) {
            mostrarAlertaAdmin('success', 'Cita modificada', datos.message);
            // Recargar citas
            await cargarCitas();
            // Cerrar modal
            const modalInstance = bootstrap.Modal.getInstance(document.getElementById('modalEditarCita'));
            if (modalInstance) {
                modalInstance.hide();
            }
        } else {
            mostrarAlertaAdmin('error', 'Error', datos.message || 'No se pudo modificar la cita.');
        }
    } catch (error) {
        console.error('Error en guardarCambiosCita:', error);
        mostrarAlertaAdmin('error', 'Error', 'Error de conexión con el servidor.');
    }
}

// ============================================
// ELIMINACIÓN MASIVA DE CITAS POR DÍA
// ============================================

let fechaDiaAEliminar = null;

/**
 * Muestra modal de confirmación para eliminar todas las citas de un día
 */
function eliminarTodasCitasDia(fecha) {
    // Obtener todas las citas de ese día
    const citasDelDia = document.querySelectorAll(`.cita-row[data-fecha="${fecha}"]`);
    const numCitas = citasDelDia.length;

    if (numCitas === 0) {
        mostrarAlertaAdmin('info', 'Sin citas', 'No hay citas para eliminar en este día.');
        return;
    }

    // Guardar la fecha para usarla cuando se confirme
    fechaDiaAEliminar = fecha;

    // Convertir fecha a formato legible
    const fechaObj = new Date(fecha + 'T00:00:00');
    const fechaFormato = fechaObj.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    const fechaCapitalizada = fechaFormato.charAt(0).toUpperCase() + fechaFormato.slice(1);

    // Actualizar mensaje del modal
    const mensaje = `¿Estás seguro de que deseas eliminar TODAS las ${numCitas} cita${numCitas !== 1 ? 's' : ''} del ${fechaCapitalizada}?`;
    document.getElementById('mensajeEliminarTodasCitas').innerHTML = `
        <p>${mensaje}</p>
        <div class="alert alert-warning">
            <i class="bi bi-exclamation-triangle"></i> <strong>Advertencia:</strong> Esta acción no se puede deshacer.
        </div>
    `;

    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('modalEliminarTodasCitas'));
    modal.show();
}

/**
 * Confirma y ejecuta la eliminación de todas las citas de un día
 */
async function confirmarEliminarTodasCitas() {
    if (!fechaDiaAEliminar) return;

    try {
        // Obtener IDs de todas las citas del día
        const citasDelDia = document.querySelectorAll(`.cita-row[data-fecha="${fechaDiaAEliminar}"]`);
        const ids = Array.from(citasDelDia).map(fila => parseInt(fila.getAttribute('data-id')));

        if (ids.length === 0) {
            mostrarAlertaAdmin('info', 'Sin citas', 'No hay citas para eliminar.');
            return;
        }

        // Eliminar cada cita
        let eliminadas = 0;
        let errores = 0;

        for (const id of ids) {
            try {
                const respuesta = await fetch(`${ADMIN_CONFIG.apiUrl}?action=eliminar_cita&id=${id}`, {
                    method: 'DELETE'
                });
                const datos = await respuesta.json();

                if (datos.success) {
                    eliminadas++;
                } else {
                    errores++;
                }
            } catch (error) {
                console.error(`Error al eliminar cita ${id}:`, error);
                errores++;
            }
        }

        // Cerrar modal
        const modalElement = document.getElementById('modalEliminarTodasCitas');
        const modal = bootstrap.Modal.getInstance(modalElement);
        if (modal) {
            modal.hide();
        }

        // Mostrar resultado
        if (eliminadas > 0) {
            mostrarAlertaAdmin('success', 'Citas eliminadas', `Se eliminaron ${eliminadas} cita${eliminadas !== 1 ? 's' : ''} correctamente.`);
            await cargarCitas();
        }

        if (errores > 0) {
            mostrarAlertaAdmin('warning', 'Advertencia', `${errores} cita${errores !== 1 ? 's' : ''} no se pudieron eliminar.`);
        }

    } catch (error) {
        console.error('Error en confirmarEliminarTodasCitas:', error);
        mostrarAlertaAdmin('error', 'Error', 'Error al eliminar las citas.');
    } finally {
        fechaDiaAEliminar = null;
    }
}

// ============================================
// EXPORTACIÓN A PDF
// ============================================

/**
 * Descarga las citas en formato PDF usando jsPDF
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

        // Generar PDF con jsPDF
        generarPDFConJsPDF(citas);

        mostrarAlertaAdmin('success', 'Descarga completada', 'El archivo PDF se ha descargado correctamente.');
    } catch (error) {
        console.error('Error en descargarPDF:', error);
        mostrarAlertaAdmin('error', 'Error', 'Error al descargar el PDF.');
    }
}

/**
 * Genera PDF usando jsPDF y autoTable
 */
function generarPDFConJsPDF(citas, fechaEspecifica = null) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('landscape', 'mm', 'a4');

    // Ordenar citas por hora (de menor a mayor)
    const citasOrdenadas = [...citas].sort((a, b) => {
        return a.hora.localeCompare(b.hora);
    });

    // Título
    const titulo = fechaEspecifica
        ? `REPORTE DE CITAS - ${fechaEspecifica}`
        : 'REPORTE DE CITAS';

    doc.setFontSize(18);
    doc.setTextColor(42, 111, 182); // Color azul principal
    doc.text(titulo, 14, 15);

    // Información del reporte
    doc.setFontSize(10);
    doc.setTextColor(100);
    const fecha = new Date().toLocaleDateString('es-ES');
    const hora = new Date().toLocaleTimeString('es-ES');
    doc.text(`Generado: ${fecha} - ${hora}`, 14, 22);
    doc.text(`Total: ${citasOrdenadas.length} cita${citasOrdenadas.length !== 1 ? 's' : ''}`, 250, 22);

    // Preparar datos para la tabla con colores de sillones
    const tableData = citasOrdenadas.map(cita => {
        // Convertir fecha de YYYY-MM-DD a DD/MM/YYYY
        let fechaFormateada = cita.fecha;
        if (cita.fecha.includes('-')) {
            const [año, mes, dia] = cita.fecha.split('-');
            fechaFormateada = `${dia}/${mes}/${año}`;
        }

        return [
            fechaFormateada,
            cita.hora,
            cita.sillon || '-',
            cita.nombre,
            cita.email
        ];
    });

    // Obtener colores RGB para los sillones
    const getSillonColor = (sillon) => {
        const colores = {
            'Rojo': [220, 53, 69],       // #DC3545
            'Azul': [13, 110, 253],      // #0D6EFD
            'Amarillo': [255, 193, 7]   // #FFC107
        };
        return colores[sillon] || [108, 117, 125]; // Gris por defecto
    };

    // Generar tabla con autoTable y colores en sillones
    doc.autoTable({
        head: [['Fecha', 'Hora', 'Sillón', 'Paciente', 'Email']],
        body: tableData,
        startY: 28,
        theme: 'striped',
        headStyles: {
            fillColor: [42, 111, 182],
            textColor: 255,
            fontSize: 11,
            fontStyle: 'bold',
            halign: 'center'
        },
        bodyStyles: {
            fontSize: 10,
            cellPadding: 3
        },
        columnStyles: {
            0: { halign: 'center', cellWidth: 28 },  // Fecha
            1: { halign: 'center', cellWidth: 22 },  // Hora
            2: { halign: 'center', cellWidth: 25 },  // Sillón
            3: { halign: 'left', cellWidth: 50 },    // Paciente
            4: { halign: 'left', cellWidth: 70 }     // Email
        },
        didParseCell: function(data) {
            // Aplicar color de fondo al sillón (columna 2)
            if (data.column.index === 2 && data.row.section === 'body') {
                const sillon = data.cell.text[0];
                const color = getSillonColor(sillon);
                data.cell.styles.fillColor = color;
                data.cell.styles.textColor = sillon === 'Amarillo' ? [0, 0, 0] : [255, 255, 255];
                data.cell.styles.fontStyle = 'bold';
            }
        },
        margin: { top: 28, left: 14, right: 14 }
    });

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
            `Página ${i} de ${pageCount} - Clínica de Higiene Bucodental`,
            doc.internal.pageSize.getWidth() / 2,
            doc.internal.pageSize.getHeight() - 10,
            { align: 'center' }
        );
    }

    // Guardar PDF
    const filename = fechaEspecifica
        ? `citas_${fechaEspecifica}.pdf`
        : `citas_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
}

/**
 * Genera el HTML para el PDF
 */
function generarHTMLParaPDF(citas, fechaEspecifica = null) {
    const fecha = new Date().toLocaleDateString('es-ES');
    const hora = new Date().toLocaleTimeString('es-ES');

    // Título del reporte
    let tituloReporte = 'REPORTE DE CITAS';
    if (fechaEspecifica) {
        const fechaObj = new Date(fechaEspecifica + 'T00:00:00');
        const fechaFormato = fechaObj.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const fechaCapitalizada = fechaFormato.charAt(0).toUpperCase() + fechaFormato.slice(1);
        tituloReporte = `REPORTE DE CITAS - ${fechaCapitalizada}`;
    }

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
            const fechaFormato = fechaObj.toLocaleDateString('es-ES'); // Formato corto DD/MM/YYYY

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
        <div style="font-family: Arial, sans-serif; color: #2c3e50; line-height: 1.4; font-size: 11px;">
            <!-- Encabezado -->
            <div style="background: linear-gradient(135deg, #2A6FB6 0%, #1e52a8 100%); color: white; padding: 15px; border-radius: 5px; margin-bottom: 15px;">
                <div style="text-align: center;">
                    <h1 style="margin: 0; font-size: 18px; font-weight: 600;">${tituloReporte}</h1>
                    <p style="margin: 5px 0 0 0; font-size: 11px;">Clínica de Higiene Bucodental</p>
                </div>
            </div>
            
            <!-- Información del reporte -->
            <div style="margin-bottom: 10px; overflow: hidden;">
                <div style="float: left;">
                    <p style="margin: 2px 0; font-size: 10px;">
                        <strong>Generado:</strong> ${fecha} - ${hora}
                    </p>
                </div>
                <div style="float: right;">
                    <p style="margin: 2px 0; font-size: 10px;">
                        <strong>Total:</strong> ${citas.length} cita${citas.length !== 1 ? 's' : ''}
                    </p>
                </div>
                <div style="clear: both;"></div>
            </div>
            
            <!-- Tabla de citas -->
            <table style="width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 10px;">
                <thead>
                    <tr style="background-color: #2A6FB6; color: white;">
                        <th style="padding: 6px 4px; text-align: center; font-weight: 600; border: 1px solid #1e52a8; width: 4%;">N°</th>
                        <th style="padding: 6px 4px; text-align: center; font-weight: 600; border: 1px solid #1e52a8; width: 14%;">Fecha</th>
                        <th style="padding: 6px 4px; text-align: center; font-weight: 600; border: 1px solid #1e52a8; width: 8%;">Hora</th>
                        <th style="padding: 6px 4px; text-align: center; font-weight: 600; border: 1px solid #1e52a8; width: 10%;">Sillón</th>
                        <th style="padding: 6px 4px; text-align: left; font-weight: 600; border: 1px solid #1e52a8; width: 22%;">Paciente</th>
                        <th style="padding: 6px 4px; text-align: left; font-weight: 600; border: 1px solid #1e52a8; width: 28%;">Email</th>
                        <th style="padding: 6px 4px; text-align: center; font-weight: 600; border: 1px solid #1e52a8; width: 14%;">Estado</th>
                    </tr>
                </thead>
                <tbody>
                    ${filasTabla}
                </tbody>
            </table>
            
            <!-- Pie de página -->
            <div style="margin-top: 15px; padding-top: 10px; border-top: 1px solid #e0e0e0;">
                <p style="font-size: 9px; color: #7f8c8d; margin: 2px 0;">
                    Documento generado automáticamente - Sistema de Gestión de Citas
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
        formularioLogin.addEventListener('submit', function (e) {
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
        botonLogout.addEventListener('click', function () {
            const modal = new bootstrap.Modal(document.getElementById('modalCerrarSesion'));
            modal.show();
        });
    }

    // Botón de confirmación de cerrar sesión
    const btnConfirmarCerrarSesion = document.getElementById('btnConfirmarCerrarSesion');
    if (btnConfirmarCerrarSesion) {
        btnConfirmarCerrarSesion.addEventListener('click', function () {
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
        usuarioInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                document.getElementById('contrasenaLogin').focus();
            }
        });
    }

    // Permitir Enter en campo de contraseña
    const contrasenaInput = document.getElementById('contrasenaLogin');
    if (contrasenaInput) {
        contrasenaInput.addEventListener('keypress', function (e) {
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

// ============================================
// NUEVAS FUNCIONALIDADES AVANZADAS
// ============================================


/**
 * Toggle (expandir/colapsar) un grupo de fechas
 * Cierra otros grupos abiertos para mantener solo uno activo
 */
function toggleGrupoFecha(fecha) {
    const filasCitas = document.querySelectorAll(`.cita-row[data-fecha="${fecha}"]`);
    const arrow = document.getElementById(`arrow-${fecha}`);

    // Verificar si este grupo está actualmente visible
    const estaVisible = filasCitas[0] && filasCitas[0].style.display !== 'none';

    // Si vamos a abrir este grupo, cerrar todos los demás primero
    if (!estaVisible) {
        // Cerrar todos los grupos
        document.querySelectorAll('.cita-row').forEach(fila => {
            fila.style.display = 'none';
        });

        // Resetear todas las flechas
        document.querySelectorAll('.arrow-icon').forEach(arrowIcon => {
            arrowIcon.classList.add('collapsed');
            arrowIcon.classList.remove('bi-chevron-down');
            arrowIcon.classList.add('bi-chevron-right');
        });
    }

    // Toggle del grupo actual
    filasCitas.forEach(fila => {
        if (fila.style.display === 'none') {
            fila.style.display = '';
            arrow.classList.remove('collapsed');
            arrow.classList.replace('bi-chevron-right', 'bi-chevron-down');
        } else {
            fila.style.display = 'none';
            arrow.classList.add('collapsed');
            arrow.classList.replace('bi-chevron-down', 'bi-chevron-right');
        }
    });
}

/**
 * Descarga el PDF de las citas de un día específico
 */
async function descargarPDFPorDia(fecha) {
    try {
        const respuesta = await fetch(`${ADMIN_CONFIG.apiUrl}?action=obtener_citas`);
        const datos = await respuesta.json();

        if (!datos.success || !datos.citas || datos.citas.length === 0) {
            mostrarAlertaAdmin('warning', 'Sin datos', 'No hay citas para descargar.');
            return;
        }

        // Filtrar citas del día específico
        const citasDelDia = datos.citas.filter(c => c.fecha === fecha);

        if (citasDelDia.length === 0) {
            mostrarAlertaAdmin('warning', 'Sin datos', 'No hay citas para este día.');
            return;
        }

        // Generar PDF con jsPDF
        generarPDFConJsPDF(citasDelDia, fecha);

        mostrarAlertaAdmin('success', 'Descarga completada', `PDF del ${fecha} descargado correctamente.`);
    } catch (error) {
        console.error('Error en descargarPDFPorDia:', error);
        mostrarAlertaAdmin('error', 'Error', 'Error al descargar el PDF.');
    }
}

// ============================================
// GESTIÓN DE DÍAS VETADOS
// ============================================

let flatpickrVetar = null;

/**
 * Inicializa el calendario Flatpickr para vetar días
 */
function inicializarFlatpickrVetar() {
    flatpickrVetar = flatpickr('#fechaVetar', {
        dateFormat: 'Y-m-d',
        minDate: 'today',
        locale: 'es',
        disable: [
            function (date) {
                // Solo permitir viernes (5)
                return date.getDay() !== 5;
            }
        ],
        onChange: function (selectedDates, dateStr, instance) {
            console.log('Fecha seleccionada para vetar:', dateStr);
        }
    });
}

/**
 * Carga los días vetados desde la API
 */
async function cargarDiasVetados() {
    try {
        const respuesta = await fetch(`${ADMIN_CONFIG.apiUrl}?action=obtener_dias_vetados`);
        const datos = await respuesta.json();

        if (datos.success && datos.dias_vetados) {
            mostrarDiasVetados(datos.dias_vetados);
        } else {
            mostrarDiasVetados([]);
        }
    } catch (error) {
        console.error('Error al cargar días vetados:', error);
        mostrarDiasVetados([]);
    }
}

/**
 * Muestra la lista de días vetados
 */
function mostrarDiasVetados(dias) {
    const listaDiv = document.getElementById('listaDiasVetados');

    if (!dias || dias.length === 0) {
        listaDiv.innerHTML = `
            <div class="text-center text-muted py-4">
                <i class="bi bi-inbox" style="font-size: 2rem;"></i>
                <p>No hay días vetados</p>
            </div>
        `;
        return;
    }

    let html = '<div class="list-group">';

    dias.forEach(dia => {
        // Convertir fecha a formato legible
        const fechaObj = new Date(dia.fecha + 'T00:00:00');
        const fechaFormato = fechaObj.toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        const fechaCapitalizada = fechaFormato.charAt(0).toUpperCase() + fechaFormato.slice(1);

        html += `
            <div class="list-group-item d-flex justify-content-between align-items-start">
                <div class="ms-2 me-auto">
                    <div class="fw-bold">
                        <i class="bi bi-calendar-x text-danger"></i> ${fechaCapitalizada}
                    </div>
                    <small class="text-muted">${dia.motivo || 'Día no disponible'}</small>
                </div>
                <button type="button" class="btn btn-sm btn-outline-danger" onclick="desvetarDia(${dia.id})" title="Desvetar este día">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        `;
    });

    html += '</div>';
    listaDiv.innerHTML = html;
}

/**
 * Veta un nuevo día
 */
async function vetarDia() {
    const fecha = document.getElementById('fechaVetar').value;
    const motivo = document.getElementById('motivoVetar').value.trim();

    if (!fecha) {
        mostrarAlertaAdmin('warning', 'Fecha requerida', 'Por favor selecciona un viernes para vetar.');
        return;
    }

    try {
        const respuesta = await fetch(`${ADMIN_CONFIG.apiUrl}?action=vetar_dia`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                fecha: fecha,
                motivo: motivo || 'Día no disponible'
            })
        });

        const datos = await respuesta.json();

        if (datos.success) {
            mostrarAlertaAdmin('success', 'Día vetado', datos.message);

            // Limpiar formulario
            document.getElementById('fechaVetar').value = '';
            document.getElementById('motivoVetar').value = '';
            if (flatpickrVetar) {
                flatpickrVetar.clear();
            }

            // Recargar lista de días vetados
            await cargarDiasVetados();
        } else {
            mostrarAlertaAdmin('error', 'Error', datos.message || 'No se pudo vetar el día.');
        }
    } catch (error) {
        console.error('Error en vetarDia:', error);
        mostrarAlertaAdmin('error', 'Error de conexión', 'No se pudo conectar con el servidor.');
    }
}

/**
 * Desveta un día (usando modal en lugar de confirm)
 */
let idDiaADesvetar = null;

async function desvetarDia(id) {
    // Guardar el ID para usarlo cuando se confirme
    idDiaADesvetar = id;

    // Mostrar modal de confirmación
    const modal = new bootstrap.Modal(document.getElementById('modalDesvetarDia'));
    modal.show();
}

/**
 * Confirma y ejecuta el desvetado del día
 */
async function confirmarDesvetarDia() {
    if (!idDiaADesvetar) return;

    try {
        const respuesta = await fetch(`${ADMIN_CONFIG.apiUrl}?action=desvetar_dia&id=${idDiaADesvetar}`, {
            method: 'DELETE'
        });

        const datos = await respuesta.json();

        if (datos.success) {
            mostrarAlertaAdmin('success', 'Día desvetado', datos.message);
            await cargarDiasVetados();

            // Cerrar modal
            const modalElement = document.getElementById('modalDesvetarDia');
            const modal = bootstrap.Modal.getInstance(modalElement);
            if (modal) {
                modal.hide();
            }
        } else {
            mostrarAlertaAdmin('error', 'Error', datos.message || 'No se pudo desvetar el día.');
        }
    } catch (error) {
        console.error('Error en confirmarDesvetarDia:', error);
        mostrarAlertaAdmin('error', 'Error de conexión', 'No se pudo conectar con el servidor.');
    } finally {
        idDiaADesvetar = null;
    }
}

// ============================================
// ALTERNANCIA DE VISTAS
// ============================================

let vistaActual = 'citas'; // 'citas' o 'vetados'

/**
 * Alterna entre la vista de citas y la vista de días vetados
 */
function alternarVista() {
    const seccionCitas = document.getElementById('seccionCitas');
    const seccionDiasVetados = document.getElementById('seccionDiasVetados');
    const botonAlternar = document.getElementById('botonAlternarVista');

    if (vistaActual === 'citas') {
        // Cambiar a vista de días vetados
        seccionCitas.style.display = 'none';
        seccionDiasVetados.style.display = 'block';
        botonAlternar.innerHTML = '<i class="bi bi-calendar-check"></i> Ver Citas';
        vistaActual = 'vetados';
    } else {
        // Cambiar a vista de citas
        seccionCitas.style.display = 'block';
        seccionDiasVetados.style.display = 'none';
        botonAlternar.innerHTML = '<i class="bi bi-calendar-x"></i> Ver Días Vetados';
        vistaActual = 'citas';
    }
}

/**
 * Configurar eventos para días vetados
 */
function configurarEventosDiasVetados() {
    const botonVetar = document.getElementById('botonVetarDia');
    if (botonVetar) {
        botonVetar.addEventListener('click', vetarDia);
    }

    // Botón de confirmación del modal
    const btnConfirmarDesvetar = document.getElementById('btnConfirmarDesvetar');
    if (btnConfirmarDesvetar) {
        btnConfirmarDesvetar.addEventListener('click', confirmarDesvetarDia);
    }

    // Botón de alternar vista
    const botonAlternar = document.getElementById('botonAlternarVista');
    if (botonAlternar) {
        botonAlternar.addEventListener('click', alternarVista);
    }

    // Botón de confirmar eliminar todas las citas
    const btnConfirmarEliminarTodas = document.getElementById('btnConfirmarEliminarTodas');
    if (btnConfirmarEliminarTodas) {
        btnConfirmarEliminarTodas.addEventListener('click', confirmarEliminarTodasCitas);
    }
}

// Actualizar la función mostrarPanelAdmin para inicializar días vetados
const mostrarPanelAdminOriginal = mostrarPanelAdmin;
mostrarPanelAdmin = function (usuario, nombre) {
    mostrarPanelAdminOriginal(usuario, nombre);

    // Inicializar gestión de días vetados
    setTimeout(() => {
        inicializarFlatpickrVetar();
        cargarDiasVetados();
        configurarEventosDiasVetados();
    }, 100);
};

// Exportar nuevas funciones globales
window.toggleGrupoFecha = toggleGrupoFecha;