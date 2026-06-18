import { Mail } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { useToast } from '../../components/ui/Toast'
import { useAuth } from '../../hooks/useAuth'
import { getAuthErrorMessage } from '../../lib/authErrors'
import { AuthShell } from './AuthShell'

export function ForgotPassword() {
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const { resetPassword } = useAuth()
  const { showToast } = useToast()

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    setLoading(true)
    try {
      await resetPassword(String(data.get('email')))
      setSent(true)
      showToast('Instruções enviadas para o seu e-mail.', 'success')
    } catch (error) {
      showToast(getAuthErrorMessage(error, 'Não foi possível enviar as instruções.'), 'error')
    } finally {
      setLoading(false)
    }
  }

  return <AuthShell title="Recuperar senha" description="Informe seu e-mail para receber as instruções de acesso." footer={<Link className="font-semibold text-primary hover:underline" to="/login">Voltar para o login</Link>}><form className="space-y-5" onSubmit={submit}><Input name="email" type="email" label="E-mail" placeholder="voce@empresa.com" icon={<Mail size={18} />} autoComplete="email" required disabled={sent} />{sent && <p className="rounded-xl bg-emerald-50 p-3 text-sm text-success">Verifique sua caixa de entrada e também a pasta de spam.</p>}<Button type="submit" fullWidth loading={loading} disabled={sent}>{sent ? 'Instruções enviadas' : 'Enviar instruções'}</Button></form></AuthShell>
}
