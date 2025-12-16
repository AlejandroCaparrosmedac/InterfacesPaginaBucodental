// ============================================
// GESTIÓN DE CITAS - SISTEMA COMPLETO
// ============================================

// Configuración inicial
const CONFIG = {
    apiUrl: 'api.php',
    emailDomain: '@alu.medac.es',
    horasDisponibles: ['15:15', '15:55', '16:35', '17:15', '17:55', '18:35', '19:15', '19:55', '20:35'],
    sillones: ['Rojo', 'Azul', 'Amarillo'],
    archivoExcel: 'citas.xlsx'
};

// Cache de citas en memoria
let citasCache = [];
let ultimaCargaCitas = 0;
const CACHE_DURACION = 60000; // 1 minuto

// Almacenar estilos originales de los sillones
const estilosSillonesOriginales = {
    'Rojo': { backgroundColor: '#DC3545', color: 'white' },
    'Azul': { backgroundColor: '#0D6EFD', color: 'white' },
    'Amarillo': { backgroundColor: '#FFC107', color: 'black' }
};

// ============================================
// INICIALIZACIÓN
// ============================================

document.addEventListener('DOMContentLoaded', async function () {
    inicializarFlatpickr();
    configurarEventos();
    await cargarCitasDelServidor();
});

// ============================================
// FLATPICKR - CALENDARIO INTERACTIVO INLINE
// ============================================

let diasVetados = [];

/**
 * Carga los días vetados desde la API
 */
async function cargarDiasVetados() {
    try {
        const respuesta = await fetch(`${CONFIG.apiUrl}?action=obtener_dias_vetados`);
        const datos = await respuesta.json();

        if (datos.success && datos.dias_vetados) {
            // Convertir fechas de YYYY-MM-DD a objetos Date
            diasVetados = datos.dias_vetados.map(dia => dia.fecha);
            console.log('Días vetados cargados:', diasVetados);
        } else {
            diasVetados = [];
        }
    } catch (error) {
        console.error('Error al cargar días vetados:', error);
        diasVetados = [];
    }
}

async function inicializarFlatpickr() {
    // Cargar días vetados primero
    await cargarDiasVetados();

    // Calendario inline en la columna izquierda
    flatpickr('#calendarioInline', {
        inline: true,  // Mostrar calendario siempre visible
        mode: 'single',
        dateFormat: 'd/m/Y',
        minDate: 'today',
        locale: 'es',
        disable: [
            function (date) {
                // Deshabilitar todos los días excepto viernes (5)
                if (date.getDay() !== 5) {
                    return true;
                }

                // Deshabilitar días vetados
                const fechaStr = date.getFullYear() + '-' +
                    String(date.getMonth() + 1).padStart(2, '0') + '-' +
                    String(date.getDate()).padStart(2, '0');

                if (diasVetados.includes(fechaStr)) {
                    return true;
                }

                return false;
            }
        ],
        onChange: async function (selectedDates, dateStr, instance) {
            console.log('Fecha seleccionada:', dateStr);

            // Actualizar el campo de fecha en el formulario
            document.getElementById('fechaCita').value = dateStr;

            // Habilitar select de hora
            document.getElementById('horaCita').disabled = false;

            // Resetear hora seleccionada
            document.getElementById('horaCita').value = '';

            // Cargar citas y actualizar disponibilidad
            await cargarCitasDelServidor();
            actualizarDisponibilidadHoras();

            // Limpiar selección de sillones
            setTimeout(() => {
                limpiarSeleccionSillon();
            }, 100);
        }
    });
}

// ============================================
// CONFIGURAR EVENTOS
// ============================================

function configurarEventos() {
    // Botón confirmar cita
    document.getElementById('botonConfirmarCita').addEventListener('click', function () {
        if (validarFormularioCita()) {
            guardarCita();
        }
    });

    // Botón buscar cita
    document.getElementById('botonBuscarCita').addEventListener('click', function () {
        buscarCita();
    });

    // Permitir Enter en los campos de búsqueda
    document.getElementById('emailConsulta').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            buscarCita();
        }
    });

    // Validaciones en tiempo real
    document.getElementById('nombreCita').addEventListener('blur', validarNombre);
    document.getElementById('emailCita').addEventListener('blur', validarEmail);

    // Deshabilitar select de hora inicialmente
    document.getElementById('horaCita').disabled = true;

    // Eventos para actualizar disponibilidad
    document.getElementById('fechaCita').addEventListener('change', async function () {
        await cargarCitasDelServidor();
        actualizarDisponibilidadHoras();

        // Habilitar select de hora
        document.getElementById('horaCita').disabled = false;

        // Resetear hora seleccionada
        document.getElementById('horaCita').value = '';

        // Limpiar selección de sillones (con delay para asegurar que el DOM esté listo)
        setTimeout(() => {
            limpiarSeleccionSillon();
        }, 100);
    });

    document.getElementById('horaCita').addEventListener('change', async function () {
        await cargarCitasDelServidor();
        actualizarDisponibilidadSillones();
    });

    // Eventos para los botones de sillón
    document.getElementById('sillonRojo').addEventListener('click', function () {
        seleccionarSillon('Rojo', 'sillonRojo');
    });

    document.getElementById('sillonAzul').addEventListener('click', function () {
        seleccionarSillon('Azul', 'sillonAzul');
    });

    document.getElementById('sillonAmarillo').addEventListener('click', function () {
        seleccionarSillon('Amarillo', 'sillonAmarillo');
    });

    // Evento cuando se cierra el modal de confirmación
    const modalConfirmacion = document.getElementById('modalConfirmacionCita');
    if (modalConfirmacion) {
        modalConfirmacion.addEventListener('hidden.bs.modal', async function () {
            // Recargar citas del servidor para asegurar que los cambios se reflejen
            await cargarCitasDelServidor(true); // true para forzar recarga

            // Ocultar los detalles de disponibilidad
            const avisoDiv = document.getElementById('avisoDisponibilidad');
            if (avisoDiv) {
                avisoDiv.style.display = 'none';
            }

            // Si hay fecha y hora seleccionadas, actualizar disponibilidad
            const fecha = document.getElementById('fechaCita').value.trim();
            const hora = document.getElementById('horaCita').value;

            if (fecha && hora) {
                actualizarDisponibilidadSillones();
            }
        });
    }
}

// ============================================
// VALIDACIONES
// ============================================

function validarFormularioCita() {
    const fecha = document.getElementById('fechaCita').value.trim();
    const hora = document.getElementById('horaCita').value;
    const sillon = document.getElementById('sillonCita').value;
    const nombre = document.getElementById('nombreCita').value.trim();
    const email = document.getElementById('emailCita').value.trim();

    // Resetear mensajes de error
    limpiarErrores();

    let esValido = true;

    // Validar fecha
    if (!fecha) {
        mostrarError('fechaCita', 'Por favor selecciona una fecha');
        esValido = false;
    }

    // Validar hora
    if (!hora) {
        mostrarError('horaCita', 'Por favor selecciona una hora');
        esValido = false;
    }

    // Validar sillón
    if (!sillon) {
        mostrarError('sillonCita', 'Por favor selecciona un sillón');
        esValido = false;
    }

    // Validar nombre
    if (!validarNombre()) {
        esValido = false;
    }

    // Validar email
    if (!validarEmail()) {
        esValido = false;
    }

    // Validar que no haya cita del mismo email en el mismo día
    if (esValido && !validarEmailUnicoEnDia(fecha, email)) {
        esValido = false;
    }

    return esValido;
}

function validarNombre() {
    const nombre = document.getElementById('nombreCita').value.trim();
    const errorDiv = document.getElementById('errorNombre');

    if (!nombre) {
        errorDiv.textContent = 'El nombre es requerido';
        document.getElementById('nombreCita').classList.add('is-invalid');
        return false;
    }

    if (nombre.length < 3) {
        errorDiv.textContent = 'El nombre debe tener al menos 3 caracteres';
        document.getElementById('nombreCita').classList.add('is-invalid');
        return false;
    }

    document.getElementById('nombreCita').classList.remove('is-invalid');
    errorDiv.textContent = '';
    return true;
}

function validarEmail() {
    const email = document.getElementById('emailCita').value.trim();
    const errorDiv = document.getElementById('errorEmail');

    if (!email) {
        errorDiv.textContent = 'El email es requerido';
        document.getElementById('emailCita').classList.add('is-invalid');
        return false;
    }

    // Aceptar @alu.medac.es, @medac.es y @doc.medac.es
    const regexEmail = /^[^\s@]+@(alu\.|doc\.)?medac\.es$/;
    if (!regexEmail.test(email)) {
        errorDiv.textContent = 'Solo se aceptan emails de @medac.es, @alu.medac.es o @doc.medac.es';
        document.getElementById('emailCita').classList.add('is-invalid');
        return false;
    }

    document.getElementById('emailCita').classList.remove('is-invalid');
    errorDiv.textContent = '';
    return true;
}

/**
 * Valida que el email no tenga cita registrada en el mismo día
 * @param {string} fecha - Fecha en formato d/m/Y
 * @param {string} email - Email a validar
 * @returns {boolean} - true si es válido, false si ya existe cita en ese día
 */
function validarEmailUnicoEnDia(fecha, email) {
    const citas = cargarCitasDelLocalStorage();
    const emailNormalizado = email.toLowerCase();

    // Buscar si existe cita del mismo email para la misma fecha
    const citaEnMismoDia = citas.find(cita =>
        cita.email.toLowerCase() === emailNormalizado &&
        cita.fecha === fecha
    );

    if (citaEnMismoDia) {
        const errorDiv = document.getElementById('errorEmail');
        errorDiv.textContent = `Ya existe una cita para este email el ${fecha} a las ${citaEnMismoDia.hora}.`;
        document.getElementById('emailCita').classList.add('is-invalid');
        return false;
    }

    return true;
}

function limpiarErrores() {
    document.querySelectorAll('.invalid-feedback').forEach(el => {
        el.textContent = '';
    });
    document.querySelectorAll('.is-invalid').forEach(el => {
        el.classList.remove('is-invalid');
    });
}

function mostrarError(elementId, mensaje) {
    const elemento = document.getElementById(elementId);
    if (elemento) {
        elemento.classList.add('is-invalid');
    }
}

// ============================================
// GUARDAR CITA
// ============================================

async function guardarCita() {
    const fecha = document.getElementById('fechaCita').value.trim();
    const hora = document.getElementById('horaCita').value;
    const sillon = document.getElementById('sillonCita').value;
    const nombre = document.getElementById('nombreCita').value.trim();
    const email = document.getElementById('emailCita').value.trim();

    if (!fecha || !hora || !sillon || !nombre || !email) {
        mostrarAlerta('error', 'Error', 'Por favor completa todos los campos');
        return;
    }

    // Convertir fecha de d/m/Y a YYYY-MM-DD
    const [dia, mes, año] = fecha.split('/');
    const fechaFormato = `${año}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;

    try {
        const respuesta = await fetch('api.php?action=crear_cita', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                fecha: fechaFormato,
                hora: hora,
                sillon: sillon,
                nombre: nombre,
                email: email
            })
        });

        if (!respuesta.ok) {
            throw new Error(`HTTP error! status: ${respuesta.status}`);
        }

        // Obtener texto de respuesta primero
        const textoRespuesta = await respuesta.text();
        console.log('Respuesta del servidor (texto):', textoRespuesta);

        // Intentar parsear como JSON
        let datos;
        try {
            datos = JSON.parse(textoRespuesta);
        } catch (parseError) {
            console.error('Error al parsear JSON. Respuesta recibida:', textoRespuesta);
            mostrarAlerta('error', 'Error del servidor', 'El servidor devolvió una respuesta inválida. Por favor contacta al administrador.');
            return;
        }

        if (datos.success) {
            // Actualizar caché de citas antes de mostrar confirmación
            await cargarCitasDelServidor();

            // Ya no hay modal que cerrar, el formulario está siempre visible

            // Llenar datos del modal de confirmación
            const fechaObj = new Date(fechaFormato + 'T00:00:00');
            const fechaLegible = fechaObj.toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            const fechaCapitalizada = fechaLegible.charAt(0).toUpperCase() + fechaLegible.slice(1);

            document.getElementById('confirmFecha').textContent = fechaCapitalizada;
            document.getElementById('confirmHora').textContent = hora;
            document.getElementById('confirmSillon').textContent = sillon;
            document.getElementById('confirmNombre').textContent = nombre;
            document.getElementById('confirmEmail').textContent = email;

            // Mostrar modal de confirmación
            const modalConfirmacion = new bootstrap.Modal(document.getElementById('modalConfirmacionCita'));
            modalConfirmacion.show();

            // Limpiar formulario
            limpiarFormulario();

            // Actualizar disponibilidad después de guardar
            setTimeout(() => {
                actualizarDisponibilidadHoras();
            }, 500);
        } else {
            mostrarAlerta('error', 'Error al registrar cita', datos.message || 'No se pudo guardar la cita.');
        }
    } catch (error) {
        console.error('Error en guardarCita:', error);
        mostrarAlerta('error', 'Error de conexión', 'No se pudo conectar con el servidor. Por favor intenta nuevamente.');
    }
}

// ============================================
// GESTIÓN DE LOCALSTORAGE
// ============================================

function guardarEnLocalStorage(cita) {
    let citas = JSON.parse(localStorage.getItem('citas')) || [];
    citas.push(cita);
    localStorage.setItem('citas', JSON.stringify(citas));
    console.log('Cita guardada en localStorage:', cita);
}

/**
 * Carga las citas del servidor (con caché para evitar sobrecarga)
 * @param {boolean} forzar - Si true, ignora el caché y recarga desde el servidor
 */
async function cargarCitasDelServidor(forzar = false) {
    const ahora = Date.now();

    // Si el caché es reciente y no se fuerza, usarlo
    if (!forzar && citasCache.length > 0 && (ahora - ultimaCargaCitas) < CACHE_DURACION) {
        return citasCache;
    }

    try {
        const respuesta = await fetch(`${CONFIG.apiUrl}?action=obtener_citas`);

        // Obtener texto de respuesta primero
        const textoRespuesta = await respuesta.text();

        // Intentar parsear como JSON
        let datos;
        try {
            datos = JSON.parse(textoRespuesta);
        } catch (parseError) {
            console.error('Error al parsear JSON en cargarCitasDelServidor. Respuesta:', textoRespuesta);
            citasCache = [];
            return [];
        }

        if (datos.success && Array.isArray(datos.citas)) {
            // Convertir formato de fecha de BD (YYYY-MM-DD) a formato de UI (DD/MM/YYYY)
            citasCache = datos.citas.map(cita => ({
                ...cita,
                fecha: convertirFechaAFormato(cita.fecha)
            }));
            ultimaCargaCitas = ahora;
            console.log('Citas cargadas desde servidor:', citasCache);
            return citasCache;
        } else {
            citasCache = [];
            return [];
        }
    } catch (error) {
        console.error('Error al cargar citas del servidor:', error);
        citasCache = [];
        return [];
    }
}

/**
 * Convierte fecha de YYYY-MM-DD a DD/MM/YYYY
 */
function convertirFechaAFormato(fechaBD) {
    const [año, mes, dia] = fechaBD.split('-');
    return `${dia}/${mes}/${año}`;
}

/**
 * Obtiene el caché de citas en memoria
 */
function cargarCitasDelLocalStorage() {
    return citasCache;
}

async function obtenerCitaPorEmail(email) {
    const citas = await cargarCitasDelServidor();
    return citas.find(cita => cita.email.toLowerCase() === email.toLowerCase());
}

function limpiarFormulario() {
    document.getElementById('formularioCita').reset();
    document.getElementById('fechaCita').value = '';
    document.getElementById('horaCita').value = '';
    document.getElementById('horaCita').disabled = true; // Deshabilitar hora hasta seleccionar fecha
    document.getElementById('sillonCita').value = '';
    document.getElementById('nombreCita').value = '';
    document.getElementById('emailCita').value = '';
    limpiarErrores();
    limpiarSeleccionSillon();
}

/**
 * Limpia la selección de sillón y restaura estilos originales
 */
function limpiarSeleccionSillon() {
    // Remover clase active de todos los botones de sillón
    document.querySelectorAll('.sillon-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Restaurar estilos originales de cada sillón
    CONFIG.sillones.forEach(sillon => {
        const botonesSillon = {
            'Rojo': 'sillonRojo',
            'Azul': 'sillonAzul',
            'Amarillo': 'sillonAmarillo'
        };
        const boton = document.getElementById(botonesSillon[sillon]);
        const estiloOriginal = estilosSillonesOriginales[sillon];

        if (boton) {
            boton.disabled = false;
            boton.style.opacity = '1';
            boton.style.cursor = 'pointer';
            boton.style.filter = 'none';
            boton.style.backgroundColor = estiloOriginal.backgroundColor;
            boton.style.color = estiloOriginal.color;
            boton.style.fontWeight = 'bold';
            boton.classList.remove('sillon-disabled');
            boton.title = `Sillón ${sillon}`;
            boton.innerHTML = `<i class="bi bi-check-circle"></i> ${sillon}`;
        }
    });

    // Limpiar el valor del input hidden
    document.getElementById('sillonCita').value = '';
}

// ============================================
// BUSCAR CITA
// ============================================

async function buscarCita() {
    const email = document.getElementById('emailConsulta').value.trim();
    const resultadoDiv = document.getElementById('resultadoConsulta');

    if (!email) {
        resultadoDiv.innerHTML = '<div class="alert alert-warning">Por favor ingresa un email</div>';
        return;
    }

    // Validar que sea un email de @medac.es, @alu.medac.es o @doc.medac.es
    const regexEmail = /^[^\s@]+@(alu\.|doc\.)?medac\.es$/;
    if (!regexEmail.test(email)) {
        resultadoDiv.innerHTML = '<div class="alert alert-danger">Solo se aceptan emails de @medac.es, @alu.medac.es o @doc.medac.es</div>';
        return;
    }

    const cita = await obtenerCitaPorEmail(email);

    if (cita) {
        resultadoDiv.innerHTML = `
            <div class="alert alert-success mt-3">
                <h5><i class="bi bi-check-circle"></i> ¡Cita Encontrada!</h5>
                <hr>
                <p><strong>Nombre:</strong> ${cita.nombre}</p>
                <p><strong>Fecha:</strong> ${cita.fecha}</p>
                <p><strong>Hora:</strong> ${cita.hora}</p>
                <p><strong>Sillón:</strong> ${cita.sillon || '-'}</p>
                <p><strong>Email:</strong> ${cita.email}</p>
                <p><strong>Estado:</strong> ${cita.estado}</p>
            </div>
        `;
    } else {
        resultadoDiv.innerHTML = '<div class="alert alert-info">No existen citas registradas con este correo electrónico.</div>';
    }
}

// ============================================
// GESTIÓN DE EXCEL (SheetJS)
// ============================================

function guardarEnExcel(cita) {
    try {
        // Obtener citas existentes
        const citas = cargarCitasDelLocalStorage();

        // Preparar datos para el Excel
        const datosExcel = citas.map(c => ({
            'Fecha': c.fecha,
            'Hora': c.hora,
            'Sillón': c.sillon,
            'Nombre': c.nombre,
            'Email': c.email,
            'Fecha de Registro': c.fechaCreacion
        }));

        // Crear workbook y worksheet
        const ws = XLSX.utils.json_to_sheet(datosExcel);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Citas');

        // Ajustar ancho de columnas
        const colWidths = [
            { wch: 15 }, // Fecha
            { wch: 10 }, // Hora
            { wch: 15 }, // Sillón
            { wch: 20 }, // Nombre
            { wch: 25 }, // Email
            { wch: 15 }, // Teléfono
            { wch: 20 }  // Fecha de Registro
        ];
        ws['!cols'] = colWidths;

        // Descargar el archivo
        XLSX.writeFile(wb, CONFIG.archivoExcel);
        console.log('Excel actualizado:', CONFIG.archivoExcel);
    } catch (error) {
        console.error('Error al guardar en Excel:', error);
        mostrarAlerta('warning', 'Cita registrada', 'La cita se guardó correctamente, pero hubo un problema al crear el Excel. Por favor, copia los datos manualmente.');
    }
}

function descargarExcel() {
    const citas = cargarCitasDelLocalStorage();
    if (citas.length === 0) {
        mostrarAlerta('warning', 'No hay citas', 'No hay citas registradas para descargar.');
        return;
    }

    const datosExcel = citas.map(c => ({
        'Fecha': c.fecha,
        'Hora': c.hora,
        'Sillón': c.sillon,
        'Nombre': c.nombre,
        'Email': c.email,
        'Fecha de Registro': c.fechaCreacion
    }));

    const ws = XLSX.utils.json_to_sheet(datosExcel);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Citas');

    const colWidths = [
        { wch: 15 },
        { wch: 10 },
        { wch: 15 },
        { wch: 20 },
        { wch: 25 },
        { wch: 15 },
        { wch: 20 }
    ];
    ws['!cols'] = colWidths;

    XLSX.writeFile(wb, 'citas_' + new Date().toISOString().slice(0, 10) + '.xlsx');
}

// ============================================
// GESTIÓN DE DISPONIBILIDAD DE SILLONES Y HORAS
// ============================================

/**
 * Obtiene todas las citas para una fecha específica
 * @param {string} fecha - Formato dd/mm/yyyy
 * @returns {Array} Array de citas de esa fecha
 */
function obtenerCitasPorFecha(fecha) {
    const citas = cargarCitasDelLocalStorage();
    return citas.filter(cita => cita.fecha === fecha);
}

/**
 * Obtiene todas las citas para una fecha y hora específica
 * @param {string} fecha - Formato dd/mm/yyyy
 * @param {string} hora - Formato HH:MM
 * @returns {Array} Array de citas de esa fecha y hora
 */
function obtenerCitasPorFechaYHora(fecha, hora) {
    const citas = cargarCitasDelLocalStorage();
    return citas.filter(cita => cita.fecha === fecha && cita.hora === hora);
}

/**
 * Verifica si un sillón está disponible para una fecha y hora
 * @param {string} fecha - Formato dd/mm/yyyy
 * @param {string} hora - Formato HH:MM
 * @param {string} sillon - Nombre del sillón
 * @returns {boolean} true si está disponible, false si está ocupado
 */
function esSillonDisponible(fecha, hora, sillon) {
    const citas = obtenerCitasPorFechaYHora(fecha, hora);
    return !citas.some(cita => cita.sillon === sillon);
}

/**
 * Verifica si una hora está completamente ocupada (3 sillones)
 * @param {string} fecha - Formato dd/mm/yyyy
 * @param {string} hora - Formato HH:MM
 * @returns {boolean} true si está ocupada, false si hay lugares
 */
function estaHoraOcupada(fecha, hora) {
    const citas = obtenerCitasPorFechaYHora(fecha, hora);
    return citas.length >= CONFIG.sillones.length;
}

/**
 * Actualiza la disponibilidad de las horas basado en la fecha seleccionada
 */
function actualizarDisponibilidadHoras() {
    const fecha = document.getElementById('fechaCita').value.trim();
    const selectHora = document.getElementById('horaCita');

    if (!fecha) {
        return;
    }

    // Habilitar todas las horas primero
    Array.from(selectHora.options).forEach(option => {
        if (option.value !== '') {
            option.disabled = false;
            option.text = option.text.replace(' (Completa)', '');
        }
    });

    // Deshabilitar horas ocupadas
    CONFIG.horasDisponibles.forEach(hora => {
        if (estaHoraOcupada(fecha, hora)) {
            const option = Array.from(selectHora.options).find(opt => opt.value === hora);
            if (option) {
                option.disabled = true;
                option.text = `${hora} (Completa)`;
            }
        }
    });

    // Mostrar información de disponibilidad
    mostrarInfoDisponibilidad(fecha);
    console.log('Disponibilidad de horas actualizada para la fecha:', fecha);
}

/**
 * Muestra información visual sobre la disponibilidad
 */
function mostrarInfoDisponibilidad(fecha) {
    const avisoDiv = document.getElementById('avisoDisponibilidad');
    const detalleDiv = document.getElementById('detalleDisponibilidad');

    if (!fecha) {
        avisoDiv.style.display = 'none';
        return;
    }

    let html = '<ul style="margin: 0; padding-left: 1.5rem;">';
    let sillonesTotalesDisponibles = 0;

    CONFIG.horasDisponibles.forEach(hora => {
        const ocupada = estaHoraOcupada(fecha, hora);
        const estado = ocupada ? '❌ Completa' : '✅ Disponible';
        html += `<li>${hora} ${estado}</li>`;

        // Si la hora no está ocupada, contar cuántos sillones hay disponibles en esa hora
        if (!ocupada) {
            const sillonesDisponiblesEnHora = CONFIG.sillones.filter(sillon =>
                esSillonDisponible(fecha, hora, sillon)
            ).length;
            sillonesTotalesDisponibles += sillonesDisponiblesEnHora;
        }
    });

    html += '</ul>';

    if (sillonesTotalesDisponibles > 0) {
        const pluralSillon = sillonesTotalesDisponibles === 1 ? 'sillón disponible' : 'sillones disponibles';
        detalleDiv.innerHTML = `${sillonesTotalesDisponibles} ${pluralSillon} en total. ${html}`;
        avisoDiv.className = 'alert alert-success small';
        avisoDiv.style.display = 'block';
    } else {
        detalleDiv.innerHTML = `No hay sillones disponibles este día. ${html}`;
        avisoDiv.className = 'alert alert-danger small';
        avisoDiv.style.display = 'block';
    }
}

/**
 * Actualiza la disponibilidad de los sillones basado en fecha y hora seleccionadas
 */
/**
 * Selecciona un sillon y actualiza el estado visual de los botones
 */
function seleccionarSillon(nombreSillon, idBoton) {
    const boton = document.getElementById(idBoton);

    console.log(`Intento de seleccionar ${nombreSillon}, disabled: ${boton.disabled}, opacity: ${boton.style.opacity}`);

    // Verificar si el boton esta deshabilitado (sillon ocupado)
    if (boton.disabled) {
        console.log(`${nombreSillon} esta deshabilitado`);
        mostrarAlerta('danger', 'Sillon No Disponible',
            `El sillon ${nombreSillon} ya ha sido reservado para esta hora. Por favor selecciona otro.`);
        return;
    }

    // Actualizar el valor del input hidden
    document.getElementById('sillonCita').value = nombreSillon;

    // Remover clase active de todos los botones
    document.querySelectorAll('.sillon-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Agregar clase active al boton seleccionado
    boton.classList.add('active');

    console.log(`Sillon seleccionado: ${nombreSillon}`);
}

/**
 * Actualiza la disponibilidad de sillones según la fecha y hora seleccionada
 */
function actualizarDisponibilidadSillones() {
    const fecha = document.getElementById('fechaCita').value.trim();
    const hora = document.getElementById('horaCita').value;

    if (!fecha || !hora) {
        return;
    }

    // Mapeo de botones de sillón
    const botonesSillon = {
        'Rojo': 'sillonRojo',
        'Azul': 'sillonAzul',
        'Amarillo': 'sillonAmarillo'
    };

    let sillonesBloqueados = 0;

    CONFIG.sillones.forEach(sillon => {
        const boton = document.getElementById(botonesSillon[sillon]);
        const disponible = esSillonDisponible(fecha, hora, sillon);
        const estiloOriginal = estilosSillonesOriginales[sillon];

        if (disponible) {
            // Sillón disponible - restaurar estilos originales
            boton.disabled = false;
            boton.style.opacity = '1';
            boton.style.cursor = 'pointer';
            boton.style.filter = 'none';
            boton.style.backgroundColor = estiloOriginal.backgroundColor;
            boton.style.color = estiloOriginal.color;
            boton.style.fontWeight = 'bold';
            boton.classList.remove('sillon-disabled');
            boton.title = `Sillon ${sillon} disponible`;
            // Restaurar contenido original
            boton.innerHTML = `<i class="bi bi-check-circle"></i> ${sillon}`;
            console.log(`${sillon} disponible`);
        } else {
            // Sillón ocupado - cambiar a color gris oscuro
            boton.disabled = true;
            boton.style.opacity = '0.8';
            boton.style.cursor = 'not-allowed';
            boton.style.filter = 'grayscale(100%)';
            boton.style.backgroundColor = '#6c757d'; // Gris Bootstrap
            boton.style.color = 'white';
            boton.style.fontWeight = 'bold';
            boton.classList.add('sillon-disabled');
            boton.title = `Sillon ${sillon} - RESERVADO`;
            // Cambiar contenido para mostrar que está reservado
            boton.innerHTML = `<i class="bi bi-x-circle"></i> RESERVADO`;
            sillonesBloqueados++;
            console.log(`${sillon} RESERVADO`);

            // Si estaba seleccionado, deseleccionar
            if (document.getElementById('sillonCita').value === sillon) {
                document.getElementById('sillonCita').value = '';
                boton.classList.remove('active');
            }
        }
    });

    // Mostrar aviso si no hay sillones disponibles
    if (sillonesBloqueados === CONFIG.sillones.length) {
        mostrarAlerta('danger', 'Sin disponibilidad',
            `No hay sillones disponibles para esta hora en la fecha seleccionada.`);
        document.getElementById('sillonCita').value = '';
    }

    console.log(`Disponibilidad de sillones actualizada para ${fecha} a las ${hora} (${sillonesBloqueados} ocupados)`);
}

/**
 * Limpia la selección del sillón cuando se cambia la fecha
 */

// ============================================
// ALERTAS Y NOTIFICACIONES
// ============================================

function mostrarAlerta(tipo, titulo, mensaje) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${tipo} alert-dismissible fade show`;
    alertDiv.setAttribute('role', 'alert');
    alertDiv.innerHTML = `
        <strong>${titulo}:</strong> ${mensaje}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;

    // Insertar después del header
    const header = document.querySelector('header');
    header.insertAdjacentElement('afterend', alertDiv);

    // Auto-cerrar después de 5 segundos
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================

// Exportar función para usar en consola/desarrollador si es necesario
window.exportarCitasAExcel = descargarExcel;
window.obtenerTodasLasCitas = cargarCitasDelLocalStorage;