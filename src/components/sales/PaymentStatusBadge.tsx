import type {SaleRow} from '../../types/database'
const labels={pago:'Pago',nao_pago:'Não pago',parcialmente_pago:'Parcial',cancelado:'Cancelado'}
export function PaymentStatusBadge({status}:{status:SaleRow['payment_status']}){const color=status==='pago'?'bg-emerald-50 text-emerald-700':status==='cancelado'?'bg-red-50 text-red-700':status==='parcialmente_pago'?'bg-amber-50 text-amber-700':'bg-slate-100 text-slate-600';return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${color}`}>{labels[status]}</span>}
