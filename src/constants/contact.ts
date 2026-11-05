import apiClient from '../api/client';

export const CONTACT_EMAIL = 'erickaguirre@inau.mx';

export const DEFAULT_CONTACT_SUBJECT = 'Contacto desde INAU';

export interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  company: string;
  message: string;
}

// El backend envía el correo a CONTACT_EMAIL con Resend; la llave nunca llega al navegador
export const sendContactForm = async (data: ContactFormData, subject: string) => {
  await apiClient.post('/public/contact', { ...data, subject });
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
