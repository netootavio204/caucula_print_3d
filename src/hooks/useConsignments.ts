import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { ConsignmentItemRow, ConsignmentRow, Json, SaleRow } from '../types/database'
import { useAuth } from './useAuth'

export interface ConsignmentWithItems extends ConsignmentRow { items: ConsignmentItemRow[] }
export interface ConsignmentItemInput { readyStockId: string; quantitySent: number; unitPrice: number }
export interface ConsignmentInput {
  consigneeClientId: string
  consignmentCode: string
  sentDate: string
  expectedSettlementDate: string
  notes: string
  items: ConsignmentItemInput[]
}
export interface ConsignmentPaymentInput {
  amount: number
  paymentMethod: SaleRow['payment_method']
  paymentDate: string
  notes: string
}

function lotPayload(input: ConsignmentInput) {
  return {
    consignee_client_id: input.consigneeClientId,
    consignment_code: input.consignmentCode,
    sent_date: input.sentDate,
    expected_settlement_date: input.expectedSettlementDate || null,
    notes: input.notes,
  } as Json
}

function itemPayload(input: ConsignmentItemInput) {
  return {
    ready_stock_id: input.readyStockId,
    quantity_sent: input.quantitySent,
    consignment_unit_price: input.unitPrice,
  } as Json
}

export function useConsignments() {
  const { user } = useAuth()
  const [consignments, setConsignments] = useState<ConsignmentWithItems[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const [lotsResult, itemsResult] = await Promise.all([
      supabase.from('consignments').select('*').eq('user_id', user.id).order('sent_date', { ascending: false }),
      supabase.from('consignment_items').select('*').eq('user_id', user.id).order('created_at'),
    ])
    const queryError = lotsResult.error ?? itemsResult.error
    if (queryError) setError(queryError.message)
    else {
      const items = itemsResult.data ?? []
      setConsignments((lotsResult.data ?? []).map((lot) => ({ ...lot, items: items.filter((item) => item.consignment_id === lot.id) })))
      setError(null)
    }
    setLoading(false)
  }, [user])

  useEffect(() => { void load() }, [load])

  const createConsignment = async (input: ConsignmentInput) => {
    const { error: mutationError } = await supabase.rpc('create_consignment', {
      p_consignment: lotPayload(input),
      p_items: input.items.map(itemPayload) as Json,
    })
    if (mutationError) throw new Error(mutationError.message)
    await load()
  }
  const updateConsignment = async (id: string, input: ConsignmentInput) => {
    const { error: mutationError } = await supabase.rpc('update_consignment_details', { p_consignment_id: id, p_consignment: lotPayload(input) })
    if (mutationError) throw new Error(mutationError.message)
    await load()
  }
  const addItem = async (id: string, item: ConsignmentItemInput) => {
    const { error: mutationError } = await supabase.rpc('add_consignment_item', { p_consignment_id: id, p_item: itemPayload(item) })
    if (mutationError) throw new Error(mutationError.message)
    await load()
  }
  const registerSale = async (itemId: string, quantity: number) => {
    const { error: mutationError } = await supabase.rpc('register_consignment_sale', { p_item_id: itemId, p_quantity: quantity })
    if (mutationError) throw new Error(mutationError.message)
    await load()
  }
  const registerReturn = async (itemId: string, quantity: number) => {
    const { error: mutationError } = await supabase.rpc('register_consignment_return', { p_item_id: itemId, p_quantity: quantity })
    if (mutationError) throw new Error(mutationError.message)
    await load()
  }
  const registerPayment = async (itemId: string, input: ConsignmentPaymentInput) => {
    const { error: mutationError } = await supabase.rpc('register_consignment_payment', {
      p_item_id: itemId,
      p_amount: input.amount,
      p_payment_method: input.paymentMethod,
      p_payment_date: input.paymentDate,
      p_notes: input.notes,
    })
    if (mutationError) throw new Error(mutationError.message)
    await load()
  }
  const cancelConsignment = async (id: string) => {
    const { error: mutationError } = await supabase.rpc('cancel_consignment', { p_consignment_id: id })
    if (mutationError) throw new Error(mutationError.message)
    await load()
  }

  return { consignments, loading, error, reload: load, createConsignment, updateConsignment, addItem, registerSale, registerReturn, registerPayment, cancelConsignment }
}
