import { Button } from './Button'
import { Modal } from './Modal'

interface ConfirmDialogProps { open: boolean; title: string; description: string; onConfirm: () => void; onCancel: () => void; confirmLabel?: string }
export function ConfirmDialog({ open, title, description, onConfirm, onCancel, confirmLabel = 'Confirmar' }: ConfirmDialogProps) {
  return <Modal open={open} title={title} onClose={onCancel} footer={<><Button variant="outline" onClick={onCancel}>Cancelar</Button><Button variant="danger" onClick={onConfirm}>{confirmLabel}</Button></>}><p className="text-sm leading-6 text-slate-600">{description}</p></Modal>
}
