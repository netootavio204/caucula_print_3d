import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Json, ProjectModelExtraCostRow, ProjectModelFilamentRow, ProjectModelRow, ProjectModelSupplyRow } from '../types/database'
import { useAuth } from './useAuth'

const PROJECT_MODEL_IMAGE_BUCKET = 'project-model-images'

export interface ProjectModelFilamentInput { filamentId: string; colorName: string; weightG: number }
export interface ProjectModelInput {
  name: string; description: string; localFolderPath: string; projectUrl: string; thumbnailUrl: string
  printDays: number; printHours: number; printMinutes: number; printSeconds: number; piecesPerPlate: number; plateQuantity: number
  nozzleDiameter: number | null; sizeX: number | null; sizeY: number | null; sizeZ: number | null
  defaultMachineId: string | null; defaultFilamentId: string | null; defaultFilamentWeightG: number | null
  filaments: ProjectModelFilamentInput[]
  supplies: Array<{ supplyId: string; quantityUsed: number }>; extraCosts: Array<{ name: string; value: number }>
}
export interface ProjectModelDetails { model: ProjectModelRow; filaments: ProjectModelFilamentRow[]; supplies: ProjectModelSupplyRow[]; extraCosts: ProjectModelExtraCostRow[] }

export function modelFilamentsFromDetails(model: ProjectModelRow, filaments: ProjectModelFilamentRow[]): ProjectModelFilamentInput[] {
  if (filaments.length > 0) return filaments.map((item) => ({ filamentId: item.filament_id, colorName: item.color_name ?? '', weightG: item.weight_used_g ?? item.weight_g }))
  if (model.default_filament_id && (model.default_filament_weight_g ?? 0) > 0) return [{ filamentId: model.default_filament_id, colorName: '', weightG: model.default_filament_weight_g ?? 0 }]
  return [{ filamentId: '', colorName: '', weightG: 0 }]
}

function activeFilaments(input: ProjectModelInput) {
  return input.filaments.filter((item) => item.filamentId || item.colorName.trim() || item.weightG > 0)
}

export function useProjects() {
  const { user } = useAuth(); const [projects, setProjects] = useState<ProjectModelRow[]>([]); const [projectFilaments, setProjectFilaments] = useState<ProjectModelFilamentRow[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null)
  const loadFilaments = useCallback(async (models: ProjectModelRow[]) => {
    if (!user || models.length === 0) { setProjectFilaments([]); return }
    const { data, error: queryError } = await supabase.from('project_model_filaments').select('*').eq('user_id', user.id).in('project_model_id', models.map((model) => model.id)).order('created_at', { ascending: true })
    if (queryError && isMissingProjectFilamentsTable(queryError.message)) {
      console.info('[projects.loadFilaments] project_model_filaments unavailable, using legacy model filament fields', classifySupabaseError(queryError))
      setProjectFilaments([])
      return
    }
    if (queryError) setError(queryError.message); else setProjectFilaments(data ?? [])
  }, [user])
  const load = useCallback(async () => {
    if (!user) { setProjects([]); setProjectFilaments([]); setLoading(false); return }
    setLoading(true)
    const { data, error: queryError } = await supabase.from('project_models').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    if (queryError) setError(queryError.message)
    else {
      const models = await Promise.all((data ?? []).map(resolveProjectThumbnail))
      setProjects(models)
      setError(null)
      await loadFilaments(models)
    }
    setLoading(false)
  }, [loadFilaments, user])
  useEffect(() => { void load() }, [load])
  const getProject = async (id: string): Promise<ProjectModelDetails> => { const [model, filaments, supplies, extras] = await Promise.all([supabase.from('project_models').select('*').eq('id', id).eq('user_id', user!.id).single(), supabase.from('project_model_filaments').select('*').eq('project_model_id', id).eq('user_id', user!.id).order('created_at', { ascending: true }), supabase.from('project_model_supplies').select('*').eq('project_model_id', id), supabase.from('project_model_extra_costs').select('*').eq('project_model_id', id)]); const filamentError = filaments.error && !isMissingProjectFilamentsTable(filaments.error.message) ? filaments.error : null; if (filaments.error && !filamentError) console.info('[projects.getProject] project_model_filaments unavailable, using legacy model filament fields', classifySupabaseError(filaments.error)); const queryError = model.error ?? filamentError ?? supplies.error ?? extras.error; if (queryError) throw new Error(queryError.message); if (!model.data) throw new Error('Projeto não encontrado.'); return { model: model.data, filaments: filaments.error ? [] : filaments.data ?? [], supplies: supplies.data ?? [], extraCosts: extras.data ?? [] } }
  const saveProject = async (input: ProjectModelInput, id?: string) => {
    const rows = activeFilaments(input)
    const firstFilament = rows[0]
    const model = { name: input.name, description: input.description, local_folder_path: input.localFolderPath, project_url: input.projectUrl, thumbnail_url: input.thumbnailUrl, print_days: input.printDays, print_hours: input.printHours, print_minutes: input.printMinutes, print_seconds: input.printSeconds, pieces_per_plate: input.piecesPerPlate, plate_quantity: input.plateQuantity, nozzle_diameter: input.nozzleDiameter, size_x: input.sizeX, size_y: input.sizeY, size_z: input.sizeZ, default_machine_id: input.defaultMachineId, default_filament_id: firstFilament?.filamentId ?? null, default_filament_weight_g: firstFilament?.weightG ?? null }
    const supplies = input.supplies.map((item) => ({ supply_id: item.supplyId, quantity_used: item.quantityUsed })) as Json
    const extraCosts = input.extraCosts as unknown as Json
    const filaments = rows.map((item) => ({ filament_id: item.filamentId, color_name: item.colorName.trim() || null, weight_g: item.weightG })) as unknown as Json
    const { data, error: mutationError } = await supabase.rpc('save_project_model', { p_model: model as Json, p_supplies: supplies, p_extra_costs: extraCosts, p_filaments: filaments, p_model_id: id ?? null })
    if (!mutationError) { await load(); return data }
    console.info('[projects.saveProject] save_project_model with filaments failed', classifySupabaseError(mutationError))
    if (!isRpcSignatureError(mutationError.message)) throw new Error(projectSaveErrorMessage(mutationError.message))

    const fallback = await supabase.rpc('save_project_model', { p_model: model as Json, p_supplies: supplies, p_extra_costs: extraCosts, p_model_id: id ?? null })
    if (fallback.error) {
      console.info('[projects.saveProject] legacy save_project_model failed', classifySupabaseError(fallback.error))
      throw new Error(projectSaveErrorMessage(fallback.error.message))
    }
    await saveProjectFilamentsDirect(fallback.data, rows)
    await load()
    return fallback.data
  }
  const deleteProject = async (id: string) => { const { error: deleteError } = await supabase.from('project_models').delete().eq('id', id).eq('user_id', user!.id); if (deleteError) throw new Error(deleteError.message); await load() }
  const filamentsForProject = (model: ProjectModelRow) => projectFilaments.filter((item) => item.project_model_id === model.id || item.model_id === model.id)
  return { projects, projectFilaments, loading, error, reload: load, getProject, saveProject, deleteProject, filamentsForProject }
}

async function resolveProjectThumbnail(model: ProjectModelRow): Promise<ProjectModelRow> {
  if (!model.thumbnail_url || isExternalUrl(model.thumbnail_url)) return model
  const { data, error } = await supabase.storage.from(PROJECT_MODEL_IMAGE_BUCKET).createSignedUrl(model.thumbnail_url, 60 * 60)
  if (error || !data?.signedUrl) {
    console.info('[projects.load] project thumbnail signed url failed', error?.message ?? 'signed url not returned')
    return model
  }
  return { ...model, thumbnail_url: data.signedUrl }
}

function isExternalUrl(value: string) {
  return value.startsWith('http://') || value.startsWith('https://') || value.startsWith('data:')
}

function isMissingProjectFilamentsTable(message: string) {
  const normalized = message.toLowerCase()
  return normalized.includes('project_model_filaments') && (normalized.includes('could not find the table') || normalized.includes('schema cache') || normalized.includes('does not exist'))
}

function isRpcSignatureError(message: string) {
  const normalized = message.toLowerCase()
  return normalized.includes('could not find the function') || normalized.includes('schema cache') || normalized.includes('p_filaments')
}

function projectSaveErrorMessage(message: string) {
  const normalized = message.toLowerCase()
  if (normalized.includes('row-level security') || normalized.includes('permission denied')) return 'Erro de permissao ao salvar modelo. Verifique as regras RLS.'
  if (normalized.includes('invalid machine')) return 'Selecione uma impressora valida.'
  if (normalized.includes('invalid filament')) return 'Selecione filamentos validos para este usuario.'
  if (normalized.includes('at least one filament')) return 'Adicione pelo menos um filamento.'
  if (normalized.includes('foreign key')) return 'Um dos vinculos do modelo e invalido.'
  return message || 'Erro ao salvar modelo.'
}

function classifySupabaseError(error: { message: string; code?: string; details?: string | null; hint?: string | null }) {
  const message = error.message.toLowerCase()
  return {
    code: error.code,
    table: message.includes('project_model_filaments') ? 'project_model_filaments' : message.includes('project_models') ? 'project_models' : undefined,
    kind: message.includes('row-level security') ? 'rls' : message.includes('foreign key') ? 'foreign_key' : message.includes('schema cache') ? 'schema_cache' : message.includes('invalid input syntax') ? 'type' : 'unknown',
    message: error.message,
    details: error.details,
    hint: error.hint,
  }
}

async function saveProjectFilamentsDirect(projectId: string | null, rows: ProjectModelFilamentInput[]) {
  if (!projectId || rows.length === 0) return
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return
  const payload = rows.map((item) => ({
    user_id: userData.user!.id,
    project_model_id: projectId,
    model_id: projectId,
    filament_id: item.filamentId,
    color_name: item.colorName.trim() || null,
    weight_used_g: item.weightG,
    weight_g: item.weightG,
    cost: 0,
  }))
  const { error } = await supabase.from('project_model_filaments').insert(payload)
  if (!error) return
  console.info('[projects.saveProject] direct project_model_filaments insert failed', classifySupabaseError(error))
  if (!isRpcSignatureError(error.message) && !error.message.toLowerCase().includes('could not find the table')) {
    throw new Error(projectSaveErrorMessage(error.message))
  }
}
