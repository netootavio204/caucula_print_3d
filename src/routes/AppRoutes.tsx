import { LoaderCircle } from 'lucide-react'
import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '../components/layout/AppLayout'
import { PublicLayout } from '../components/layout/PublicLayout'
import { ProtectedRoute } from './ProtectedRoute'
import { PublicOnlyRoute } from './PublicOnlyRoute'

const Account = lazy(() => import('../pages/app/Account').then((module) => ({ default: module.Account })))
const Budgets = lazy(() => import('../pages/app/Budgets').then((module) => ({ default: module.Budgets })))
const Calculator = lazy(() => import('../pages/app/Calculator').then((module) => ({ default: module.Calculator })))
const Catalog = lazy(() => import('../pages/app/Catalog').then((module) => ({ default: module.Catalog })))
const Consignments = lazy(() => import('../pages/app/Consignments').then((module) => ({ default: module.Consignments })))
const Clients = lazy(() => import('../pages/app/Clients').then((module) => ({ default: module.Clients })))
const Costs = lazy(() => import('../pages/app/Costs').then((module) => ({ default: module.Costs })))
const Projects = lazy(() => import('../pages/app/Projects').then((module) => ({ default: module.Projects })))
const QuickCalculator = lazy(() => import('../pages/app/QuickCalculator').then((module) => ({ default: module.QuickCalculator })))
const Stock = lazy(() => import('../pages/app/Stock').then((module) => ({ default: module.Stock })))
const Sales = lazy(() => import('../pages/app/Sales').then((module) => ({ default: module.Sales })))
const ForgotPassword = lazy(() => import('../pages/public/ForgotPassword').then((module) => ({ default: module.ForgotPassword })))
const LandingPage = lazy(() => import('../pages/public/LandingPage').then((module) => ({ default: module.LandingPage })))
const Login = lazy(() => import('../pages/public/Login').then((module) => ({ default: module.Login })))
const Register = lazy(() => import('../pages/public/Register').then((module) => ({ default: module.Register })))
const ResetPassword = lazy(() => import('../pages/public/ResetPassword').then((module) => ({ default: module.ResetPassword })))

export function AppRoutes() {
  return <Suspense fallback={<RouteLoader />}><Routes>
    <Route element={<PublicLayout />}><Route index element={<LandingPage />} /></Route>
    <Route element={<PublicOnlyRoute />}>
      <Route path="/login" element={<Login />} />
      <Route path="/cadastro" element={<Register />} />
      <Route path="/recuperar-senha" element={<ForgotPassword />} />
    </Route>
    <Route path="/redefinir-senha" element={<ResetPassword />} />
    <Route element={<ProtectedRoute />}>
      <Route path="/app" element={<AppLayout />}>
        <Route index element={<Navigate to="orcamento" replace />} />
        <Route path="orcamento" element={<Calculator />} />
        <Route path="calculadora-rapida" element={<QuickCalculator />} />
        <Route path="orcamentos" element={<Budgets />} />
        <Route path="projetos" element={<Projects />} />
        <Route path="estoque" element={<Stock />} />
        <Route path="catalogo" element={<Catalog />} />
        <Route path="vendas" element={<Sales />} />
        <Route path="consignacao" element={<Consignments />} />
        <Route path="clientes" element={<Clients />} />
        <Route path="insumos" element={<Costs />} />
        <Route path="minha-conta" element={<Account />} />
      </Route>
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></Suspense>
}

function RouteLoader() {
  return <div className="grid min-h-[45vh] place-items-center text-primary" role="status" aria-label="Carregando página"><LoaderCircle className="animate-spin" size={30} /></div>
}
