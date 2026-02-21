import os
import logging
import asyncio
import resend

RESEND_API_KEY = os.environ.get('RESEND_API_KEY')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')

if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY

logger = logging.getLogger(__name__)

async def send_email_async(to_email: str, subject: str, html_content: str):
    """Send email asynchronously using Resend"""
    if not RESEND_API_KEY:
        logger.warning("RESEND_API_KEY not configured, skipping email")
        return None
    params = {
        "from": SENDER_EMAIL,
        "to": [to_email],
        "subject": subject,
        "html": html_content
    }
    try:
        email = await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Email sent to {to_email}: {email.get('id')}")
        return email
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {str(e)}")
        return None

def get_client_reminder_email(appointment: dict, tenant_name: str) -> str:
    """Generate HTML email for client reminder"""
    return f"""
    <div style=\"font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;\">
        <div style=\"background: linear-gradient(135deg, #2C4A3B 0%, #3d6350 100%); padding: 30px; border-radius: 12px 12px 0 0;\">
            <h1 style=\"color: white; margin: 0; font-size: 24px;\">✨ Lembrete de Agendamento</h1>
        </div>
        <div style=\"background: #ffffff; padding: 30px; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 12px 12px;\">
            <p style=\"color: #333; font-size: 16px; margin-bottom: 20px;\">
                Olá <strong>{appointment.get('client_name', 'Cliente')}</strong>!
            </p>
            <p style=\"color: #666; font-size: 15px;\">
                Este é um lembrete do seu agendamento em <strong>{tenant_name}</strong>:
            </p>
            <div style=\"background: #f8f7f5; padding: 20px; border-radius: 8px; margin: 20px 0;\">
                <table style=\"width: 100%; border-collapse: collapse;\">
                    <tr>
                        <td style=\"padding: 8px 0; color: #888;\">📅 Data:</td>
                        <td style=\"padding: 8px 0; color: #333; font-weight: 600;\">{appointment.get('date', '')}</td>
                    </tr>
                    <tr>
                        <td style=\"padding: 8px 0; color: #888;\">⏰ Horário:</td>
                        <td style=\"padding: 8px 0; color: #333; font-weight: 600;\">{appointment.get('time', '')}</td>
                    </tr>
                    <tr>
                        <td style=\"padding: 8px 0; color: #888;\">💇 Serviço:</td>
                        <td style=\"padding: 8px 0; color: #333; font-weight: 600;\">{appointment.get('service_name', '')}</td>
                    </tr>
                    <tr>
                        <td style=\"padding: 8px 0; color: #888;\">👤 Profissional:</td>
                        <td style=\"padding: 8px 0; color: #333; font-weight: 600;\">{appointment.get('employee_name', '')}</td>
                    </tr>
                    <tr>
                        <td style=\"padding: 8px 0; color: #888;\">💰 Valor:</td>
                        <td style=\"padding: 8px 0; color: #2C4A3B; font-weight: 600;\">R$ {appointment.get('service_price', 0):.2f}</td>
                    </tr>
                </table>
            </div>
            <p style=\"color: #666; font-size: 14px;\">
                Caso precise reagendar ou cancelar, acesse nosso sistema online.
            </p>
            <p style=\"color: #888; font-size: 13px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;\">
                {tenant_name} - Sistema de Agendamentos
            </p>
        </div>
    </div>
    """

def get_employee_reminder_email(appointment: dict, tenant_name: str) -> str:
    """Generate HTML email for employee reminder"""
    return f"""
    <div style=\"font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;\">
        <div style=\"background: linear-gradient(135deg, #2C4A3B 0%, #3d6350 100%); padding: 30px; border-radius: 12px 12px 0 0;\">
            <h1 style=\"color: white; margin: 0; font-size: 24px;\">📋 Lembrete de Atendimento</h1>
        </div>
        <div style=\"background: #ffffff; padding: 30px; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 12px 12px;\">
            <p style=\"color: #333; font-size: 16px; margin-bottom: 20px;\">
                Olá <strong>{appointment.get('employee_name', 'Profissional')}</strong>!
            </p>
            <p style=\"color: #666; font-size: 15px;\">
                Você tem um atendimento agendado:
            </p>
            <div style=\"background: #f8f7f5; padding: 20px; border-radius: 8px; margin: 20px 0;\">
                <table style=\"width: 100%; border-collapse: collapse;\">
                    <tr>
                        <td style=\"padding: 8px 0; color: #888;\">📅 Data:</td>
                        <td style=\"padding: 8px 0; color: #333; font-weight: 600;\">{appointment.get('date', '')}</td>
                    </tr>
                    <tr>
                        <td style=\"padding: 8px 0; color: #888;\">⏰ Horário:</td>
                        <td style=\"padding: 8px 0; color: #333; font-weight: 600;\">{appointment.get('time', '')}</td>
                    </tr>
                    <tr>
                        <td style=\"padding: 8px 0; color: #888;\">💇 Serviço:</td>
                        <td style=\"padding: 8px 0; color: #333; font-weight: 600;\">{appointment.get('service_name', '')}</td>
                    </tr>
                    <tr>
                        <td style=\"padding: 8px 0; color: #888;\">👤 Cliente:</td>
                        <td style=\"padding: 8px 0; color: #333; font-weight: 600;\">{appointment.get('client_name', '')}</td>
                    </tr>
                    <tr>
                        <td style=\"padding: 8px 0; color: #888;\">📧 Email:</td>
                        <td style=\"padding: 8px 0; color: #333;\">{appointment.get('client_email', '')}</td>
                    </tr>
                    <tr>
                        <td style=\"padding: 8px 0; color: #888;\">📱 Telefone:</td>
                        <td style=\"padding: 8px 0; color: #333;\">{appointment.get('client_phone', '-')}</td>
                    </tr>
                </table>
            </div>
            <p style=\"color: #888; font-size: 13px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;\">
                {tenant_name} - Sistema de Agendamentos
            </p>
        </div>
    </div>
    """
