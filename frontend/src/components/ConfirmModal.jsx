// Modal de confirmação reutilizável, com o mesmo aspeto do "Terminar Sessão".
// variant="danger" → ícone e botão vermelhos (ações destrutivas)
// variant="primary" → ícone e botão azuis (ações normais)
export default function ConfirmModal({
  open,
  icon: Icon,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal modal-sm" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        {Icon && (
          <div className={`modal-icon ${variant}`}>
            <Icon size={28} />
          </div>
        )}
        <h3 className="modal-title">{title}</h3>
        {message && <p className="modal-text">{message}</p>}
        <div className="btn-row" style={{ marginTop: 0 }}>
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button type="button" className={`btn btn-${variant}`} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}