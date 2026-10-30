import { formatPhoneInternational } from '../utils/phone';
export const CONTACT_EMAIL = 'erickaguirre@inau.mx';

export const DEFAULT_CONTACT_SUBJECT = 'Contacto desde INAU';

// FormSubmit reenvía el formulario a CONTACT_EMAIL. Se usa el alias que FormSubmit
// generó al activar el formulario para no exponer el correo en las peticiones.
const FORMSUBMIT_ALIAS = '71aa9469a602d07c3a716836391c387b';

export const CONTACT_FORM_ENDPOINT =
  import.meta.env.VITE_CONTACT_FORM_ENDPOINT || `https://formsubmit.co/ajax/${FORMSUBMIT_ALIAS}`;

export interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  company: string;
  message: string;
}

export const sendContactForm = async (data: ContactFormData, subject: string) => {
  const response = await fetch(CONTACT_FORM_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      Nombre: data.name,
      email: data.email, // FormSubmit lo usa como Reply-To
      Teléfono: data.phone ? formatPhoneInternational(data.phone) : '—',
      Empresa: data.company || '—',
      Mensaje: data.message,
      _subject: `${subject} - ${data.name}`,
      _template: 'table',
      _captcha: 'false',
    }),
  });

  const result = await response.json().catch(() => null);
  if (!response.ok || String(result?.success) !== 'true') {
    throw new Error(result?.message || 'No se pudo enviar el mensaje');
  }
};

// Alternativa para quien prefiera escribir desde su propio correo
export const buildContactLinks = (subject: string) => {
  const su = encodeURIComponent(subject);
  const to = encodeURIComponent(CONTACT_EMAIL);

  return {
    gmail: `https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${su}`,
    outlook: `https://outlook.office.com/mail/deeplink/compose?to=${to}&subject=${su}`,
  };
};
