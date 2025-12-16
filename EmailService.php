<?php
/**
 * Servicio de Email
 * Gestiona el envío de correos electrónicos usando PHPMailer
 */

// Importar PHPMailer
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require_once 'email_config.php';

class EmailService
{
    private $mailer;

    public function __construct()
    {
        $this->mailer = new PHPMailer(true);
        $this->configurarSMTP();
    }

    /**
     * Configura los parámetros SMTP
     */
    private function configurarSMTP()
    {
        try {
            // Configuración del servidor
            $this->mailer->isSMTP();
            $this->mailer->Host = SMTP_HOST;
            $this->mailer->SMTPAuth = true;
            $this->mailer->Username = SMTP_USERNAME;
            $this->mailer->Password = SMTP_PASSWORD;
            $this->mailer->SMTPSecure = SMTP_SECURE;
            $this->mailer->Port = SMTP_PORT;

            // Configuración del remitente
            $this->mailer->setFrom(EMAIL_FROM, EMAIL_FROM_NAME);
            $this->mailer->CharSet = EMAIL_CHARSET;

            // Debug (solo en desarrollo)
            if (EMAIL_DEBUG) {
                $this->mailer->SMTPDebug = 2;
            }
        } catch (Exception $e) {
            error_log("Error configurando SMTP: " . $e->getMessage());
        }
    }

    /**
     * Envía email de confirmación de cita
     * 
     * @param array $datosCita Datos de la cita (fecha, hora, nombre, email, sillon)
     * @return bool True si se envió correctamente, false si hubo error
     */
    public function enviarConfirmacionCita($datosCita)
    {
        try {
            // Resetear destinatarios
            $this->mailer->clearAddresses();
            $this->mailer->clearAttachments();

            // Destinatario
            $this->mailer->addAddress($datosCita['email'], $datosCita['nombre']);

            // Asunto
            $this->mailer->Subject = '✅ Confirmación de Cita - Higiene Bucodental';

            // Cuerpo del email
            $this->mailer->isHTML(true);
            $this->mailer->Body = $this->generarPlantillaConfirmacion($datosCita);
            $this->mailer->AltBody = $this->generarTextoPlano($datosCita);

            // Enviar
            $resultado = $this->mailer->send();

            if ($resultado) {
                error_log("Email enviado correctamente a: " . $datosCita['email']);
            }

            return $resultado;

        } catch (Exception $e) {
            error_log("Error enviando email: " . $this->mailer->ErrorInfo);
            return false;
        }
    }

    /**
     * Genera la plantilla HTML para el email de confirmación
     */
    private function generarPlantillaConfirmacion($datos)
    {
        // Formatear fecha
        $fechaObj = new DateTime($datos['fecha']);
        $fechaFormateada = $fechaObj->format('d/m/Y');
        $diaSemana = $this->obtenerDiaSemana($fechaObj->format('N'));

        $html = '
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirmación de Cita</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
        }
        .container {
            max-width: 600px;
            margin: 20px auto;
            background: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            background: linear-gradient(135deg, #2A6FB6 0%, #1e52a8 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
        }
        .content {
            padding: 30px;
        }
        .cita-info {
            background: #f8f9fa;
            border-left: 4px solid #2A6FB6;
            padding: 20px;
            margin: 20px 0;
            border-radius: 5px;
        }
        .cita-info h2 {
            margin-top: 0;
            color: #2A6FB6;
            font-size: 18px;
        }
        .info-row {
            display: flex;
            padding: 10px 0;
            border-bottom: 1px solid #e0e0e0;
        }
        .info-row:last-child {
            border-bottom: none;
        }
        .info-label {
            font-weight: bold;
            width: 120px;
            color: #666;
        }
        .info-value {
            flex: 1;
            color: #333;
        }
        .sillon-badge {
            display: inline-block;
            padding: 5px 15px;
            border-radius: 20px;
            color: white;
            font-weight: bold;
            font-size: 14px;
        }
        .sillon-rojo { background-color: #DC3545; }
        .sillon-azul { background-color: #0D6EFD; }
        .sillon-amarillo { background-color: #FFC107; color: black; }
        .alert {
            background: #fff3cd;
            border: 1px solid #ffc107;
            border-radius: 5px;
            padding: 15px;
            margin: 20px 0;
        }
        .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #666;
        }
        .icon {
            font-size: 48px;
            margin-bottom: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="icon">🦷</div>
            <h1>¡Cita Confirmada!</h1>
            <p style="margin: 10px 0 0 0;">Higiene Bucodental - Clínica Dental</p>
        </div>
        
        <div class="content">
            <p>Hola <strong>' . htmlspecialchars($datos['nombre']) . '</strong>,</p>
            
            <p>Tu cita ha sido <strong>confirmada exitosamente</strong>. A continuación encontrarás los detalles:</p>
            
            <div class="cita-info">
                <h2>📅 Detalles de tu Cita</h2>
                
                <div class="info-row">
                    <div class="info-label">📆 Fecha:</div>
                    <div class="info-value"><strong>' . $diaSemana . ', ' . $fechaFormateada . '</strong></div>
                </div>
                
                <div class="info-row">
                    <div class="info-label">⏰ Hora:</div>
                    <div class="info-value"><strong>' . htmlspecialchars($datos['hora']) . '</strong></div>
                </div>
                
                <div class="info-row">
                    <div class="info-label">🪑 Sillón:</div>
                    <div class="info-value">
                        <span class="sillon-badge sillon-' . strtolower($datos['sillon']) . '">' . htmlspecialchars($datos['sillon']) . '</span>
                    </div>
                </div>
                
                <div class="info-row">
                    <div class="info-label">📧 Email:</div>
                    <div class="info-value">' . htmlspecialchars($datos['email']) . '</div>
                </div>
            </div>
            
            <div class="alert">
                <strong>⚠️ Importante:</strong>
                <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                    <li>Por favor, llega <strong>5 minutos antes</strong> de tu cita</li>
                    <li>Si necesitas cancelar o modificar tu cita, contacta con nosotros lo antes posible</li>
                    <li>Recuerda traer tu tarjeta sanitaria</li>
                </ul>
            </div>
            
            <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
            
            <p style="margin-top: 30px;">
                Saludos cordiales,<br>
                <strong>Equipo de Higiene Bucodental</strong>
            </p>
        </div>
        
        <div class="footer">
            <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
            <p>© ' . date('Y') . ' Higiene Bucodental. Todos los derechos reservados.</p>
        </div>
    </div>
</body>
</html>';

        return $html;
    }

    /**
     * Genera versión de texto plano del email
     */
    private function generarTextoPlano($datos)
    {
        $fechaObj = new DateTime($datos['fecha']);
        $fechaFormateada = $fechaObj->format('d/m/Y');
        $diaSemana = $this->obtenerDiaSemana($fechaObj->format('N'));

        $texto = "CONFIRMACIÓN DE CITA - HIGIENE BUCODENTAL\n\n";
        $texto .= "Hola " . $datos['nombre'] . ",\n\n";
        $texto .= "Tu cita ha sido confirmada exitosamente.\n\n";
        $texto .= "DETALLES DE TU CITA:\n";
        $texto .= "------------------------\n";
        $texto .= "Fecha: " . $diaSemana . ", " . $fechaFormateada . "\n";
        $texto .= "Hora: " . $datos['hora'] . "\n";
        $texto .= "Sillón: " . $datos['sillon'] . "\n";
        $texto .= "Email: " . $datos['email'] . "\n\n";
        $texto .= "IMPORTANTE:\n";
        $texto .= "- Por favor, llega 5 minutos antes de tu cita\n";
        $texto .= "- Si necesitas cancelar o modificar tu cita, contacta con nosotros\n";
        $texto .= "- Recuerda traer tu tarjeta sanitaria\n\n";
        $texto .= "Saludos cordiales,\n";
        $texto .= "Equipo de Higiene Bucodental\n\n";
        $texto .= "---\n";
        $texto .= "Este es un correo automático, por favor no respondas a este mensaje.\n";

        return $texto;
    }

    /**
     * Obtiene el nombre del día de la semana en español
     */
    private function obtenerDiaSemana($numeroDia)
    {
        $dias = [
            1 => 'Lunes',
            2 => 'Martes',
            3 => 'Miércoles',
            4 => 'Jueves',
            5 => 'Viernes',
            6 => 'Sábado',
            7 => 'Domingo'
        ];

        return $dias[$numeroDia] ?? 'Viernes';
    }

    /**
     * Envía email de cancelación de cita
     * 
     * @param array $datosCita Datos de la cita (fecha, hora, nombre, email, motivo)
     * @return bool True si se envió correctamente, false si hubo error
     */
    public function enviarCancelacionCita($datosCita)
    {
        try {
            // Resetear destinatarios
            $this->mailer->clearAddresses();
            $this->mailer->clearAttachments();

            // Destinatario
            $this->mailer->addAddress($datosCita['email'], $datosCita['nombre']);

            // Asunto
            $this->mailer->Subject = '❌ Cancelación de Cita - Higiene Bucodental';

            // Cuerpo del email
            $this->mailer->isHTML(true);
            $this->mailer->Body = $this->generarPlantillaCancelacion($datosCita);
            $this->mailer->AltBody = $this->generarTextoPlainCancelacion($datosCita);

            // Enviar
            $resultado = $this->mailer->send();

            if ($resultado) {
                error_log("Email de cancelación enviado correctamente a: " . $datosCita['email']);
            }

            return $resultado;

        } catch (Exception $e) {
            error_log("Error enviando email de cancelación: " . $this->mailer->ErrorInfo);
            return false;
        }
    }

    /**
     * Genera la plantilla HTML para el email de cancelación
     */
    private function generarPlantillaCancelacion($datos)
    {
        // Formatear fecha
        $fechaObj = new DateTime($datos['fecha']);
        $fechaFormateada = $fechaObj->format('d/m/Y');
        $diaSemana = $this->obtenerDiaSemana($fechaObj->format('N'));

        $html = '
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cancelación de Cita</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
        }
        .container {
            max-width: 600px;
            margin: 20px auto;
            background: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            background: linear-gradient(135deg, #DC3545 0%, #c82333 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
        }
        .content {
            padding: 30px;
        }
        .cita-info {
            background: #f8f9fa;
            border-left: 4px solid #DC3545;
            padding: 20px;
            margin: 20px 0;
            border-radius: 5px;
        }
        .cita-info h2 {
            margin-top: 0;
            color: #DC3545;
            font-size: 18px;
        }
        .info-row {
            display: flex;
            padding: 10px 0;
            border-bottom: 1px solid #e0e0e0;
        }
        .info-row:last-child {
            border-bottom: none;
        }
        .info-label {
            font-weight: bold;
            width: 120px;
            color: #666;
        }
        .info-value {
            flex: 1;
            color: #333;
        }
        .motivo-box {
            background: #ffe6e6;
            border: 2px solid #DC3545;
            border-radius: 5px;
            padding: 15px;
            margin: 20px 0;
        }
        .motivo-box h3 {
            color: #DC3545;
            margin-top: 0;
            margin-bottom: 10px;
            font-size: 16px;
        }
        .motivo-texto {
            background: white;
            padding: 10px;
            border-radius: 3px;
            color: #333;
            font-style: italic;
        }
        .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #666;
        }
        .icon {
            font-size: 48px;
            margin-bottom: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="icon">❌</div>
            <h1>Cancelación de Cita</h1>
        </div>
        
        <div class="content">
            <p>Estimado/a <strong>' . htmlspecialchars($datos['nombre']) . '</strong>,</p>
            
            <p>Te informamos que tu cita ha sido cancelada por la siguiente razón:</p>
            
            <div class="motivo-box">
                <h3>Motivo de la Cancelación:</h3>
                <div class="motivo-texto">' . nl2br(htmlspecialchars($datos['motivo'])) . '</div>
            </div>
            
            <div class="cita-info">
                <h2>Detalles de la Cita Cancelada</h2>
                <div class="info-row">
                    <div class="info-label">📅 Fecha:</div>
                    <div class="info-value">' . $diaSemana . ', ' . $fechaFormateada . '</div>
                </div>
                <div class="info-row">
                    <div class="info-label">🕐 Hora:</div>
                    <div class="info-value">' . htmlspecialchars($datos['hora']) . '</div>
                </div>
                <div class="info-row">
                    <div class="info-label">📧 Email:</div>
                    <div class="info-value">' . htmlspecialchars($datos['email']) . '</div>
                </div>
            </div>
            
            <p>Si tienes preguntas sobre esta cancelación o deseas reprogramar tu cita, por favor <strong>contacta con nosotros</strong> lo antes posible.</p>
            
            <p>Agradecemos tu comprensión.</p>
        </div>
        
        <div class="footer">
            <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
            <p>© ' . date('Y') . ' Higiene Bucodental. Todos los derechos reservados.</p>
        </div>
    </div>
</body>
</html>';

        return $html;
    }

    /**
     * Genera versión de texto plano del email de cancelación
     */
    private function generarTextoPlainCancelacion($datos)
    {
        $fechaObj = new DateTime($datos['fecha']);
        $fechaFormateada = $fechaObj->format('d/m/Y');
        $diaSemana = $this->obtenerDiaSemana($fechaObj->format('N'));

        $texto = "CANCELACIÓN DE CITA - HIGIENE BUCODENTAL\n\n";
        $texto .= "Estimado/a " . $datos['nombre'] . ",\n\n";
        $texto .= "Tu cita ha sido cancelada.\n\n";
        $texto .= "MOTIVO DE LA CANCELACIÓN:\n";
        $texto .= "------------------------\n";
        $texto .= $datos['motivo'] . "\n\n";
        $texto .= "DETALLES DE LA CITA CANCELADA:\n";
        $texto .= "------------------------\n";
        $texto .= "Fecha: " . $diaSemana . ", " . $fechaFormateada . "\n";
        $texto .= "Hora: " . $datos['hora'] . "\n";
        $texto .= "Email: " . $datos['email'] . "\n\n";
        $texto .= "Si tienes preguntas sobre esta cancelación o deseas reprogramar tu cita,\n";
        $texto .= "por favor contacta con nosotros lo antes posible.\n\n";
        $texto .= "Agradecemos tu comprensión.\n\n";
        $texto .= "Saludos cordiales,\n";
        $texto .= "Equipo de Higiene Bucodental\n\n";
        $texto .= "---\n";
        $texto .= "Este es un correo automático, por favor no respondas a este mensaje.\n";

        return $texto;
    }
}
