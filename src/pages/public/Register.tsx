import { LockKeyhole, Mail, UserRound } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { useToast } from '../../components/ui/Toast'
import { useAuth } from '../../hooks/useAuth'
import { getAuthErrorMessage } from '../../lib/authErrors'
import { AuthShell } from './AuthShell'

export function Register() {
  const [passwordError, setPasswordError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const { showToast } = useToast()

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const password = String(data.get('password'))
    if (password !== data.get('confirmation')) {
      setPasswordError('As senhas precisam ser iguais.')
      return
    }

    setPasswordError('')
    setLoading(true)
    try {
      const result = await signUp(String(data.get('name')), String(data.get('email')), password)
      if (result.requiresEmailConfirmation) {
        showToast('Conta criada. Confirme seu e-mail para entrar.', 'success')
        navigate('/login', { replace: true })
      } else {
        showToast('Conta criada com sucesso.', 'success')
        navigate('/app/orcamento', { replace: true })
      }
    } catch (error) {
      showToast(getAuthErrorMessage(error, 'Não foi possível criar a conta.'), 'error')
    } finally {
      setLoading(false)
    }
  }

  return <AuthShell title="Crie sua conta" description="Comece a organizar seus orçamentos de impressão 3D." footer={<>Já possui uma conta? <Link className="font-semibold text-primary hover:underline" to="/login">Entrar</Link></>}><form className="space-y-4" onSubmit={submit}><Input name="name" label="Nome completo" placeholder="Seu nome" icon={<UserRound size={18} />} autoComplete="name" required /><Input name="email" type="email" label="E-mail" placeholder="voce@empresa.com" icon={<Mail size={18} />} autoComplete="email" required /><Input name="password" type="password" label="Senha" placeholder="Mínimo de 6 caracteres" icon={<LockKeyhole size={18} />} autoComplete="new-password" required minLength={6} /><Input name="confirmation" type="password" label="Confirmar senha" placeholder="Repita sua senha" icon={<LockKeyhole size={18} />} autoComplete="new-password" error={passwordError} required minLength={6} /><Button type="submit" fullWidth loading={loading}>Criar conta grátis</Button></form></AuthShell>
}
