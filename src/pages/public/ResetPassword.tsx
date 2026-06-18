import { LockKeyhole } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { useToast } from '../../components/ui/Toast'
import { useAuth } from '../../hooks/useAuth'
import { getAuthErrorMessage } from '../../lib/authErrors'
import { AuthShell } from './AuthShell'

export function ResetPassword() {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { updatePassword } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const password = String(data.get('password'))
    if (password !== data.get('confirmation')) {
      setError('As senhas precisam ser iguais.')
      return
    }
    setError('')
    setLoading(true)
    try {
      await updatePassword(password)
      showToast('Senha atualizada com sucesso.', 'success')
      navigate('/app/orcamento', { replace: true })
    } catch (authError) {
      showToast(getAuthErrorMessage(authError, 'O link expirou ou não é válido.'), 'error')
    } finally {
      setLoading(false)
    }
  }

  return <AuthShell title="Definir nova senha" description="Escolha uma nova senha para sua conta." footer={<Link className="font-semibold text-primary hover:underline" to="/login">Voltar para o login</Link>}><form className="space-y-5" onSubmit={submit}><Input name="password" type="password" label="Nova senha" placeholder="Mínimo de 6 caracteres" icon={<LockKeyhole size={18} />} autoComplete="new-password" required minLength={6} /><Input name="confirmation" type="password" label="Confirmar nova senha" placeholder="Repita a nova senha" icon={<LockKeyhole size={18} />} autoComplete="new-password" error={error} required minLength={6} /><Button type="submit" fullWidth loading={loading}>Atualizar senha</Button></form></AuthShell>
}
