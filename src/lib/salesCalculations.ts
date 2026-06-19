export type PaymentStatus = 'pago' | 'nao_pago' | 'parcialmente_pago' | 'cancelado'
export function calculateSale(quantity: number, unitPrice: number, paidValue: number) {
  const safeQuantity=Number.isFinite(quantity)?quantity:0, safePrice=Number.isFinite(unitPrice)?unitPrice:0, safePaid=Number.isFinite(paidValue)?paidValue:0
  if(safeQuantity<=0) throw new Error('A quantidade deve ser maior que zero.')
  if(safePrice<0||safePaid<0) throw new Error('Valores não podem ser negativos.')
  const totalValue=safeQuantity*safePrice, paid=Math.min(safePaid,totalValue), openValue=Math.max(totalValue-paid,0)
  const paymentStatus: PaymentStatus=paid<=0?'nao_pago':paid<totalValue?'parcialmente_pago':'pago'
  return {totalValue,paidValue:paid,openValue,paymentStatus}
}
