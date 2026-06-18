import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Json, ProjectModelExtraCostRow, ProjectModelRow, ProjectModelSupplyRow } from '../types/database'
import { useAuth } from './useAuth'

export interface ProjectModelInput {
  name: string; description: string; localFolderPath: string; projectUrl: string; thumbnailUrl: string
  printDays: number; printHours: number; printMinutes: number; printSeconds: number; piecesPerPlate: number; plateQuantity: number
  nozzleDiameter: number | null; sizeX: number | null; sizeY: number | null; sizeZ: number | null
  defaultMachineId: string | null; defaultFilamentId: string | null; defaultFilamentWeightG: number | null
  supplies: Array<{ supplyId: string; quantityUsed: number }>; extraCosts: Array<{ name: string; value: number }>
}
export interface ProjectModelDetails { model: ProjectModelRow; supplies: ProjectModelSupplyRow[]; extraCosts: ProjectModelExtraCostRow[] }

export function useProjects() {
  const { user } = useAuth(); const [projects, setProjects] = useState<ProjectModelRow[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null)
  const load = useCallback(async () => { if (!user) return; setLoading(true); const { data, error: queryError } = await supabase.from('project_models').select('*').eq('user_id', user.id).order('created_at', { ascending: false }); if (queryError) setError(queryError.message); else { setProjects(data ?? []); setError(null) }; setLoading(false) }, [user])
  useEffect(() => { void load() }, [load])
  const getProject = async (id: string): Promise<ProjectModelDetails> => { const [model, supplies, extras] = await Promise.all([supabase.from('project_models').select('*').eq('id', id).eq('user_id', user!.id).single(), supabase.from('project_model_supplies').select('*').eq('project_model_id', id), supabase.from('project_model_extra_costs').select('*').eq('project_model_id', id)]); const queryError = model.error ?? supplies.error ?? extras.error; if (queryError) throw new Error(queryError.message); if (!model.data) throw new Error('Projeto não encontrado.'); return { model: model.data, supplies: supplies.data ?? [], extraCosts: extras.data ?? [] } }
  const saveProject = async (input: ProjectModelInput, id?: string) => { const model = { name: input.name, description: input.description, local_folder_path: input.localFolderPath, project_url: input.projectUrl, thumbnail_url: input.thumbnailUrl, print_days: input.printDays, print_hours: input.printHours, print_minutes: input.printMinutes, print_seconds: input.printSeconds, pieces_per_plate: input.piecesPerPlate, plate_quantity: input.plateQuantity, nozzle_diameter: input.nozzleDiameter, size_x: input.sizeX, size_y: input.sizeY, size_z: input.sizeZ, default_machine_id: input.defaultMachineId, default_filament_id: input.defaultFilamentId, default_filament_weight_g: input.defaultFilamentWeightG }; const { data, error: mutationError } = await supabase.rpc('save_project_model', { p_model: model as Json, p_supplies: input.supplies.map((item) => ({ supply_id: item.supplyId, quantity_used: item.quantityUsed })) as Json, p_extra_costs: input.extraCosts as unknown as Json, p_model_id: id ?? null }); if (mutationError) throw new Error(mutationError.message); await load(); return data }
  const deleteProject = async (id: string) => { const { error: deleteError } = await supabase.from('project_models').delete().eq('id', id).eq('user_id', user!.id); if (deleteError) throw new Error(deleteError.message); await load() }
  return { projects, loading, error, reload: load, getProject, saveProject, deleteProject }
}
