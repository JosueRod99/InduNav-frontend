import { useState } from 'react';
import type { FormEvent } from 'react';
import { CheckCircle, Copy, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from './ui/Modal';
import {
  CONTACT_EMAIL,
  DEFAULT_CONTACT_SUBJECT,
  buildContactLinks,
  sendContactForm,
} from '../constants/contact';
import type { ContactFormData } from '../constants/contact';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  subject?: string;
}

const emptyForm: ContactFormData = { name: '', email: '', phone: '', company: '', message: '' };

const ContactModal = ({ isOpen, onClose, subject = DEFAULT_CONTACT_SUBJECT }: ContactModalProps) => {
  const [form, setForm] = useState<ContactFormData>(emptyForm);
  const [honeypot, setHoneypot] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const links = buildContactLinks(subject);

  const update = (field: keyof ContactFormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleClose = () => {
    onClose();
    if (isSent) {
      setForm(emptyForm);
      setIsSent(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    // Campo trampa: solo los bots lo llenan
    if (honeypot) return;

    setIsSending(true);
    try {
      await sendContactForm(form, subject);
      setIsSent(true);
    } catch (err) {
      console.error('Error enviando formulario de contacto:', err);
      toast.error(`No se pudo enviar. Escríbenos a ${CONTACT_EMAIL}`);
    } finally {
      setIsSending(false);
    }
  };

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(CONTACT_EMAIL);
      toast.success('Correo copiado');
    } catch {
      toast.error(`No se pudo copiar. Escríbenos a ${CONTACT_EMAIL}`);
    }
  };

  const inputClass =
    'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20';
  const labelClass = 'mb-1 block text-xs font-medium text-slate-600';

  if (isSent) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Contáctanos" size="md">
        <div className="flex flex-col items-center py-6 text-center">
          <CheckCircle className="mb-3 h-12 w-12 text-green-600" />
          <h4 className="mb-1 text-lg font-semibold text-slate-900">¡Mensaje enviado!</h4>
          <p className="mb-6 text-sm text-slate-600">
            Gracias, {form.name.split(' ')[0]}. Te contactaremos pronto a {form.email}.
          </p>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Cerrar
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Contáctanos" size="md">
      <form onSubmit={handleSubmit} className="space-y-3">
        <p className="text-sm text-slate-600">
          Déjanos tus datos y tu mensaje, te responderemos a la brevedad.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Nombre *</label>
            <input className={inputClass} required value={form.name} onChange={update('name')} />
          </div>
          <div>
            <label className={labelClass}>Empresa</label>
            <input className={inputClass} value={form.company} onChange={update('company')} />
          </div>
          <div>
            <label className={labelClass}>Correo *</label>
            <input
              type="email"
              className={inputClass}
              required
              value={form.email}
              onChange={update('email')}
            />
          </div>
          <div>
            <label className={labelClass}>Teléfono</label>
            <input type="tel" className={inputClass} value={form.phone} onChange={update('phone')} />
          </div>
        </div>
        <div>
          <label className={labelClass}>Mensaje *</label>
          <textarea
            className={`${inputClass} min-h-[110px] resize-y`}
            required
            placeholder="¿En qué podemos ayudarte?"
            value={form.message}
            onChange={update('message')}
          />
        </div>

        <input
          type="text"
          tabIndex={-1}
          autoComplete="off"
          className="hidden"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />

        <button
          type="submit"
          disabled={isSending}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Send className="h-4 w-4" />
          {isSending ? 'Enviando...' : 'Enviar mensaje'}
        </button>

        <div className="border-t border-slate-200 pt-3 text-center text-xs text-slate-500">
          ¿Prefieres escribirnos tú?{' '}
          <a href={links.gmail} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:underline">
            Gmail
          </a>
          {' · '}
          <a href={links.outlook} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:underline">
            Outlook
          </a>
          {' · '}
          <button type="button" onClick={copyEmail} className="inline-flex items-center gap-1 font-medium text-blue-600 hover:underline">
            <Copy className="h-3 w-3" />
            {CONTACT_EMAIL}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ContactModal;
