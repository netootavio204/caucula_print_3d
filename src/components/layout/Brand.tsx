import { Box } from 'lucide-react'
import { Link } from 'react-router-dom'

export function Brand({ light = false }: { light?: boolean }) {
  return <Link to="/" className="inline-flex items-center gap-3 font-bold" aria-label="CalculaPrint 3D - inicio"><span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-primary to-blue-400 text-white shadow-lg shadow-blue-900/20"><Box size={22} strokeWidth={2.5} /></span><span className={light ? 'text-white' : 'text-slate-950'}>Calcula<span className="text-accent">Print</span> 3D</span></Link>
}
