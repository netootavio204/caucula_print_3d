import type { jsPDF as JsPdfDocument } from 'jspdf'
import type { BudgetRow, ProfileRow } from '../types/database'
import { formatCurrency, formatDate } from './formatters'
import { supabase } from './supabase'

export interface BudgetPdfData {
  budget: BudgetRow
  profile: ProfileRow
  materials: string[]
}

const page = { width: 210, height: 297, left: 18, right: 192, footerY: 282 }

export async function generateBudgetPdf(budgetId: string): Promise<void> {
  const { jsPDF } = await import('jspdf')
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) throw new Error('Usuário não autenticado.')

  const [budgetResult, profileResult, filamentItemsResult, supplyItemsResult] = await Promise.all([
    supabase.from('budgets').select('*').eq('id', budgetId).eq('user_id', auth.user.id).single(),
    supabase.from('profiles').select('*').eq('id', auth.user.id).single(),
    supabase.from('budget_filaments').select('*').eq('budget_id', budgetId),
    supabase.from('budget_supplies').select('*').eq('budget_id', budgetId),
  ])
  const queryError = budgetResult.error ?? profileResult.error ?? filamentItemsResult.error ?? supplyItemsResult.error
  if (queryError) throw new Error(queryError.message)
  if (!budgetResult.data || !profileResult.data) throw new Error('Dados do orçamento não encontrados.')

  const filamentIds = (filamentItemsResult.data ?? []).map((item) => item.filament_id)
  const supplyIds = (supplyItemsResult.data ?? []).map((item) => item.supply_id)
  const [filamentResult, supplyResult] = await Promise.all([
    filamentIds.length ? supabase.from('filaments').select('id,type_brand,color').in('id', filamentIds) : Promise.resolve({ data: [], error: null }),
    supplyIds.length ? supabase.from('supplies').select('id,name,unit').in('id', supplyIds) : Promise.resolve({ data: [], error: null }),
  ])
  const materialError = filamentResult.error ?? supplyResult.error
  if (materialError) throw new Error(materialError.message)

  const filamentLines = (filamentItemsResult.data ?? []).map((item) => {
    const filament = filamentResult.data?.find((entry) => entry.id === item.filament_id)
    return `${filament?.type_brand ?? 'Filamento'}${filament?.color ? ` - ${filament.color}` : ''}: ${formatQuantity(item.weight_used_g)} g`
  })
  const supplyLines = (supplyItemsResult.data ?? []).map((item) => {
    const supply = supplyResult.data?.find((entry) => entry.id === item.supply_id)
    return `${supply?.name ?? 'Insumo'}: ${formatQuantity(item.quantity_used)} ${supply?.unit ?? 'unidade(s)'}`
  })

  const pdf = new jsPDF({ unit: 'mm', format: 'a4', compress: true })
  renderBudgetPdf(pdf, {
    budget: budgetResult.data,
    profile: profileResult.data,
    materials: [...filamentLines, ...supplyLines],
  })
  pdf.save(`orcamento-${slugify(budgetResult.data.project_name)}.pdf`)
}

export function renderBudgetPdf(pdf: JsPdfDocument, { budget, profile, materials }: BudgetPdfData): void {
  drawHeader(pdf, profile)
  let y = 45

  pdf.setTextColor(15, 23, 42)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(17)
  pdf.text(budget.project_name, page.left, y)
  y += 7
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(9)
  pdf.setTextColor(100, 116, 139)
  pdf.text(`Orçamento emitido em ${formatDate(budget.created_at)}  |  Validade: ${budget.validity_days} dias`, page.left, y)
  y += 10

  const clientLocation = [budget.client_address, budget.client_city, budget.client_state].filter(Boolean).join(' - ')
  y = drawCard(pdf, y, 'Cliente', [
    budget.client_name || 'Cliente não informado',
    ...[budget.client_phone, budget.client_email, clientLocation].filter(Boolean) as string[],
  ])

  const dimensions = [budget.size_x, budget.size_y, budget.size_z].some((value) => value !== null)
    ? `${budget.size_x ?? 0} x ${budget.size_y ?? 0} x ${budget.size_z ?? 0} mm`
    : 'Não informadas'
  y = drawCard(pdf, y, 'Projeto', [
    `Quantidade: ${budget.total_pieces} peça(s)`,
    `Diâmetro do bico: ${budget.nozzle_diameter ? `${formatQuantity(budget.nozzle_diameter)} mm` : 'Não informado'}`,
    `Medidas X / Y / Z: ${dimensions}`,
    ...(budget.description ? [`Descrição: ${budget.description}`] : []),
  ])

  y = drawCard(pdf, y, 'Materiais utilizados', materials.length ? materials.map((item) => `• ${item}`) : ['Nenhum material detalhado.'])
  y = drawTotalCard(pdf, y, budget.suggested_price, budget.price_per_piece)

  const termLines = [
    `Este orçamento tem validade de ${budget.validity_days} dias a partir da data de emissão.`,
    'Condições de pagamento: pagamento de 50% de entrada para aprovação e início da produção, e 50% restantes na entrega ou envio da peça.',
    'O prazo de produção inicia-se apenas após a confirmação do pagamento de entrada.',
    'Alterações no projeto podem alterar o valor final do orçamento.',
  ]
  drawCard(pdf, y, 'Termos e condições', termLines)
  drawFooters(pdf, profile)
}

function drawHeader(pdf: JsPdfDocument, profile: ProfileRow) {
  pdf.setFillColor(15, 23, 42)
  pdf.rect(0, 0, page.width, 30, 'F')
  pdf.setFillColor(37, 99, 235)
  pdf.rect(0, 30, page.width, 2, 'F')
  pdf.setTextColor(255, 255, 255)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(18)
  pdf.text(profile.company_name || 'CalculaPrint 3D', page.left, 16)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(8.5)
  const contact = [profile.company_phone, profile.company_email, profile.company_instagram].filter(Boolean).join('  |  ')
  if (contact) pdf.text(contact, page.left, 23)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(11)
  pdf.text('ORÇAMENTO', page.right, 18, { align: 'right' })
}

function drawCard(pdf: JsPdfDocument, currentY: number, title: string, sourceLines: string[]): number {
  const contentWidth = page.right - page.left - 12
  const wrappedLines = sourceLines.flatMap((line) => pdf.splitTextToSize(line, contentWidth) as string[])
  const height = 14 + Math.max(wrappedLines.length, 1) * 4.5
  const y = ensureSpace(pdf, currentY, height)

  pdf.setDrawColor(226, 232, 240)
  pdf.setLineWidth(0.35)
  pdf.roundedRect(page.left, y, page.right - page.left, height, 2.5, 2.5, 'S')
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(9)
  pdf.setTextColor(37, 99, 235)
  pdf.text(title.toUpperCase(), page.left + 6, y + 7)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(9)
  pdf.setTextColor(51, 65, 85)
  wrappedLines.forEach((line, index) => pdf.text(line, page.left + 6, y + 13 + index * 4.5))
  return y + height + 5
}

function drawTotalCard(pdf: JsPdfDocument, currentY: number, total: number, unitPrice: number): number {
  const height = 28
  const y = ensureSpace(pdf, currentY, height)
  pdf.setFillColor(239, 246, 255)
  pdf.setDrawColor(147, 197, 253)
  pdf.roundedRect(page.left, y, page.right - page.left, height, 3, 3, 'FD')
  pdf.setTextColor(37, 99, 235)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(9)
  pdf.text('VALOR TOTAL', page.left + 7, y + 8)
  pdf.setFontSize(20)
  pdf.text(formatCurrency(total), page.left + 7, y + 20)
  pdf.setFontSize(9)
  pdf.setTextColor(51, 65, 85)
  pdf.text(`${formatCurrency(unitPrice)} por peça`, page.right - 7, y + 20, { align: 'right' })
  return y + height + 5
}

function ensureSpace(pdf: JsPdfDocument, y: number, height: number): number {
  if (y + height <= page.footerY - 7) return y
  pdf.addPage('a4', 'portrait')
  return 18
}

function drawFooters(pdf: JsPdfDocument, profile: ProfileRow) {
  const address = [profile.company_address, profile.company_city, profile.company_state].filter(Boolean).join(' - ')
  const contact = [profile.company_phone, profile.company_email, profile.company_instagram].filter(Boolean).join(' | ')
  const pages = pdf.getNumberOfPages()
  for (let index = 1; index <= pages; index += 1) {
    pdf.setPage(index)
    pdf.setDrawColor(226, 232, 240)
    pdf.line(page.left, page.footerY, page.right, page.footerY)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(7.5)
    pdf.setTextColor(100, 116, 139)
    if (address) pdf.text(address, page.left, page.footerY + 5)
    if (contact) pdf.text(contact, page.left, page.footerY + 9)
    pdf.text(`Página ${index} de ${pages}`, page.right, page.footerY + 7, { align: 'right' })
  }
}

function formatQuantity(value: number): string {
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(value)
}

function slugify(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'projeto'
}
