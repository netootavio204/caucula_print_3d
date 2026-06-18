import { LockKeyhole, Mail } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { useToast } from '../../components/ui/Toast'
import { useAuth } from '../../hooks/useAuth'
import { getAuthErrorMessage } from '../../lib/authErrors'
import { AuthShell } from './AuthShell'

export function Login() {
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { showToast } = useToast()

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    setLoading(true)
    try {
      await signIn(String(data.get('email')), String(data.get('password')))
      showToast('Login realizado com sucesso.', 'success')
      navigate((location.state as { from?: string } | null)?.from ?? '/app/orcamento', { replace: true })
    } catch (error) {
      showToast(getAuthErrorMessage(error, 'Não foi possível entrar. Tente novamente.'), 'error')
    } finally {
      setLoading(false)
    }
  }

  return <AuthShell title="Bem-vindo de volta" description="Entre para acessar seu painel." footer={<>Ainda não tem uma conta? <Link className="font-semibold text-primary hover:underline" to="/cadastro">Criar conta grátis</Link></>}><form className="space-y-5" onSubmit={submit}><Input name="email" type="email" label="E-mail" placeholder="voce@empresa.com" icon={<Mail size={18} />} autoComplete="email" required /><Input name="password" type="password" label="Senha" placeholder="Sua senha" icon={<LockKeyhole size={18} />} autoComplete="current-password" required minLength={6} /><div className="text-right"><Link className="text-sm font-medium text-primary hover:underline" to="/recuperar-senha">Esqueci minha senha</Link></div><Button type="submit" fullWidth loading={loading}>Entrar</Button></form></AuthShell>
}
