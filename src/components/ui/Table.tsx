import type { ReactNode } from 'react'

export function Table({ headers, children }: { headers: string[]; children: ReactNode }) {
  return <div className="overflow-x-auto rounded-xl border border-border"><table className="w-full min-w-[640px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr>{headers.map((header) => <th className="px-4 py-3 font-semibold" key={header}>{header}</th>)}</tr></thead><tbody className="divide-y divide-border bg-white">{children}</tbody></table></div>
}
