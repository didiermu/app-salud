import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import clsx from 'clsx';

/**
 * Modal de confirmación/información reutilizable.
 *
 * @param {boolean} isOpen        - Controla la visibilidad.
 * @param {('info'|'success'|'confirm')} type - Variante visual.
 * @param {string} title          - Título del modal.
 * @param {string} message        - Mensaje de apoyo.
 * @param {Function} [onConfirm]  - Acción del botón principal.
 * @param {Function} onClose      - Cierra el modal (botón cancelar o backdrop).
 * @param {string} [confirmLabel] - Texto del botón principal.
 * @param {string} [cancelLabel]  - Texto del botón secundario.
 * @param {boolean} [dismissible=true] - Permite cerrar con el backdrop.
 * @param {ReactNode} [icon]      - Icono personalizado (sobreescribe el por defecto).
 */
const Modal = ({
  isOpen,
  type = 'info',
  title = '',
  message = '',
  onConfirm,
  onClose,
  confirmLabel,
  cancelLabel = 'Cancelar',
  dismissible = true,
  icon,
}) => {
  if (!isOpen) return null;

  const defaultConfirmLabel = type === 'confirm' ? 'Eliminar' : 'Entendido';

  const defaultIcon = type === 'confirm' ? <AlertTriangle size={40} /> : type === 'success' ? <CheckCircle2 size={40} /> : <Info size={40} />;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div
        className="absolute inset-0 bg-neutral-900/90 backdrop-blur-md"
        onClick={() => dismissible && onClose?.()}
      />
      <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-10 relative z-10 flex flex-col items-center text-center animate-in zoom-in-95 duration-500 shadow-2xl">
        <div
          className={clsx(
            "w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-xl",
            type === 'confirm' ? "bg-red-50 text-red-500" : type === 'success' ? "bg-green-50 text-green-500" : "bg-blue-50 text-blue-500",
          )}
        >
          {icon || defaultIcon}
        </div>

        <h3 className="text-3xl font-black text-neutral-900 uppercase tracking-tighter mb-2 leading-none">
          {title}
        </h3>
        <p className="text-neutral-500 font-bold text-sm mb-8 leading-relaxed">
          {message}
        </p>

        <div className="flex gap-3 w-full">
          {type === 'confirm' && (
            <button
              onClick={onClose}
              className="flex-1 py-4 bg-neutral-100 text-neutral-600 font-bold rounded-2xl hover:bg-neutral-200 transition-colors uppercase tracking-widest text-[10px]"
            >
              {cancelLabel}
            </button>
          )}
          <button
            onClick={() => {
              if (onConfirm) onConfirm();
              onClose?.();
            }}
            className={clsx(
              "flex-1 py-4 font-black rounded-2xl transition-all shadow-xl uppercase tracking-widest text-[10px]",
              type === 'confirm' ? "bg-red-500 text-white hover:bg-red-600 shadow-red-200" : "bg-neutral-900 text-white hover:bg-black shadow-neutral-200",
            )}
          >
            {confirmLabel || defaultConfirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
