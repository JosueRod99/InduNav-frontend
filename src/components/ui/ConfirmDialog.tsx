import { useEffect } from 'react';
import { create } from 'zustand';
import Button from './Button';
import Modal from './Modal';

// One confirmation for the whole app, mounted once in App.tsx. Call it from anywhere:
//   if (await confirmar({ title: 'Eliminar tour', message: 'Se eliminará "Planta 1".' })) ...
// By default it is a red "Eliminar"; for something else, give the button its word.

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
}

interface ConfirmState {
  options: ConfirmOptions | null;
  resolve: ((confirmed: boolean) => void) | null;
}

const useConfirmStore = create<ConfirmState>(() => ({ options: null, resolve: null }));

const answer = (confirmed: boolean) => {
  useConfirmStore.getState().resolve?.(confirmed);
  useConfirmStore.setState({ options: null, resolve: null });
};

export const confirmar = (options: ConfirmOptions): Promise<boolean> =>
  new Promise((resolve) => {
    answer(false); // a question left open counts as cancelled
    useConfirmStore.setState({ options, resolve });
  });

const ConfirmDialog = () => {
  const options = useConfirmStore((state) => state.options);

  // Over another modal, Esc only closes this one
  useEffect(() => {
    if (!options) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.stopPropagation();
      answer(false);
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [options]);

  if (!options) return null;

  return (
    <Modal
      isOpen
      onClose={() => answer(false)}
      title={options.title}
      size="sm"
      footer={
        <>
          {/* The focus starts here, so a stray Enter does not delete anything */}
          <Button variant="outline" autoFocus onClick={() => answer(false)}>
            Cancelar
          </Button>
          <Button variant={options.danger === false ? 'primary' : 'danger'} onClick={() => answer(true)}>
            {options.confirmLabel || 'Eliminar'}
          </Button>
        </>
      }
    >
      <p className="whitespace-pre-line text-sm text-gray-700">{options.message}</p>
    </Modal>
  );
};

export default ConfirmDialog;
