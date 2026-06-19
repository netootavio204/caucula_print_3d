import { ImagePlus, Trash2 } from 'lucide-react'
import { useId, type ChangeEvent } from 'react'
import { Button } from '../ui/Button'

interface ProductImageUploaderProps {
  position: 1 | 2
  imageUrl: string | null
  disabled?: boolean
  loading?: boolean
  onUpload: (file: File) => void
  onRemove: () => void
}

export function ProductImageUploader({ position, imageUrl, disabled, loading, onUpload, onRemove }: ProductImageUploaderProps) {
  const inputId = useId()
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (file) onUpload(file)
  }

  return <div className="flex min-w-0 flex-col rounded-2xl border border-border bg-white p-4">
    <div className="flex min-h-12 items-start justify-between gap-3">
      <div className="min-w-0"><p className="text-sm font-semibold text-slate-900">{position === 1 ? 'Imagem principal' : 'Segunda imagem'}</p><p className="mt-1 text-xs leading-5 text-slate-500">{position === 1 ? 'Obrigatória para publicar.' : 'Opcional.'} WEBP, JPG ou PNG até 2 MB.</p></div>
      {imageUrl && <Button type="button" variant="ghost" className="min-h-9 px-3 text-danger hover:bg-red-50" disabled={disabled || loading} onClick={onRemove}><Trash2 size={16} />Remover</Button>}
    </div>
    {imageUrl ? <img src={imageUrl} alt={`Imagem ${position} do produto`} className="mt-3 h-44 w-full rounded-xl bg-slate-100 object-cover" /> : <div className="mt-3 flex h-44 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 text-center text-slate-400"><ImagePlus size={34} /><span className="mt-2 text-xs">Nenhuma imagem enviada</span></div>}
    <label htmlFor={inputId} className={`mt-3 inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-primary/20 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-primary transition hover:bg-blue-100 ${(disabled || loading) ? 'pointer-events-none opacity-50' : ''}`}>
      <ImagePlus size={18} />{loading ? 'Enviando imagem...' : imageUrl ? 'Substituir imagem' : 'Selecionar imagem'}
    </label>
    <input id={inputId} type="file" className="sr-only" accept=".webp,.jpg,.jpeg,.png,image/webp,image/jpeg,image/png" disabled={disabled || loading} onChange={handleChange} />
  </div>
}
