import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { EmptyState } from '../../components/ui/EmptyState'

export function PageIntro({ icon, title, description, action }: { icon: LucideIcon; title: string; description: string; action?: ReactNode }) { return <EmptyState icon={icon} title={title} description={description} action={action} /> }
