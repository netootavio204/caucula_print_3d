import type {SaleRow} from '../../types/database'
const labels={pendente:'Pendente',entregue:'Entregue',retirado:'Retirado',enviado:'Enviado',cancelado:'Cancelado'}
export function SaleStatusBadge({status}:{status:SaleRow['delivery_status']}){return <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">{labels[status]}</span>}
