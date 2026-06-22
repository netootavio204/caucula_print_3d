import { jsPDF } from 'jspdf'
import { createServer } from 'vite'

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' })
try {
  const { renderBudgetPdf } = await server.ssrLoadModule('/src/lib/pdf.ts')
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', compress: false })
  renderBudgetPdf(pdf, {
    budget: {
      id: 'budget-test', user_id: 'user-test', client_id: null, client_name: 'Cliente Teste', client_phone: '11999999999', client_email: 'cliente@example.com', client_address: 'Rua Teste', client_city: 'Sao Paulo', client_state: 'SP',
      project_name: 'Projeto PDF V1', description: 'Peca de validacao', project_url: null, local_folder_path: null, thumbnail_url: null,
      print_days: 0, print_hours: 2, print_minutes: 0, print_seconds: 0, total_time_hours: 2, pieces_per_plate: 1, plate_quantity: 1, total_pieces: 2,
      nozzle_diameter: 0.4, size_x: 10, size_y: 20, size_z: 30, machine_id: null, filament_cost: 10, service_cost: 5, energy_cost: 1,
      maintenance_cost: 1, depreciation_cost: 1, supplies_cost: 1, extra_costs: 0, failure_margin_value: 1, total_production_cost: 20,
      gross_profit: 10, fees_value: 2, suggested_price: 32, price_per_piece: 16, net_profit: 10, net_profit_per_piece: 5,
      status: 'pendente', validity_days: 7, created_at: '2026-06-22T12:00:00Z', updated_at: '2026-06-22T12:00:00Z',
    },
    profile: {
      id: 'user-test', full_name: 'Usuario Teste', email: 'usuario@example.com', company_name: 'Empresa 3D', company_phone: '11988888888',
      company_email: 'empresa@example.com', company_instagram: null, company_address: 'Rua Empresa', company_city: 'Sao Paulo', company_state: 'SP',
      company_logo_url: null, company_logo_path: null, created_at: '2026-06-22T12:00:00Z', updated_at: '2026-06-22T12:00:00Z',
    },
    materials: ['PLA Azul: 100 g'],
  })
  const width = pdf.internal.pageSize.getWidth()
  const height = pdf.internal.pageSize.getHeight()
  if (Math.abs(width - 210) > 0.2 || Math.abs(height - 297) > 0.2) throw new Error(`PDF is not A4: ${width}x${height}`)
  const content = Buffer.from(pdf.output('arraybuffer')).toString('latin1').toLowerCase()
  if (content.length < 1000) throw new Error('PDF output is unexpectedly small')
  for (const forbidden of ['lucro', 'markup', 'custo interno', 'gross_profit', 'net_profit']) {
    if (content.includes(forbidden)) throw new Error(`PDF leaked internal term: ${forbidden}`)
  }
  console.log('pdf_v1_a4_and_private=ok')
} finally {
  await server.close()
}
