import { supabase } from './supabase'

export type StorageBucket = 'catalog-products' | 'company-assets'
export type CatalogImagePosition = 1 | 2

export interface CatalogProductImageParams {
  file: File
  readyStockId: string
  position: CatalogImagePosition
}

export interface StorageUploadResult {
  path: string
  url: string
}

const PRODUCT_MAX_SIZE = 2 * 1024 * 1024
const LOGO_MAX_SIZE = 1024 * 1024
const allowedExtensions = new Set(['webp', 'jpg', 'jpeg', 'png'])
const allowedMimeTypes = new Set(['image/webp', 'image/jpeg', 'image/png'])

async function requireUserId() {
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) throw new Error('Faça login para gerenciar imagens.')
  return data.user.id
}

function validateFile(file: File | null | undefined, maxSize: number) {
  if (!file) throw new Error('Selecione uma imagem.')
  const extension = getFileExtension(file)
  if (!allowedExtensions.has(extension) || !allowedMimeTypes.has(file.type.toLowerCase())) {
    throw new Error('Use uma imagem WEBP, JPG, JPEG ou PNG.')
  }
  if (file.size > maxSize) {
    const limit = maxSize === PRODUCT_MAX_SIZE ? '2 MB' : '1 MB'
    throw new Error(`A imagem deve ter no máximo ${limit}.`)
  }
  return extension === 'jpg' ? 'jpeg' : extension
}

function getFileExtension(file: File) {
  return file.name.split('.').pop()?.toLowerCase() ?? ''
}

function normalizeCode(code: string) {
  const normalized = code.trim().replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '')
  if (!normalized) throw new Error('Defina um código público válido antes de enviar imagens.')
  return normalized
}

function assertOwnPath(path: string, userId: string) {
  const normalized = path.replace(/^\/+/, '')
  if (!normalized.startsWith(`${userId}/`)) throw new Error('O caminho da imagem não pertence ao usuário logado.')
  return normalized
}

async function getCatalogProduct(userId: string, readyStockId: string) {
  if (!readyStockId) throw new Error('Produto do estoque não informado.')
  const { data, error } = await supabase
    .from('ready_stock')
    .select('id, public_code')
    .eq('id', readyStockId)
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) throw new Error('Produto não encontrado.')
  const publicCode = data.public_code?.trim()
  if (!publicCode) throw new Error('Salve o código público antes de enviar imagens.')
  return { id: data.id, publicCode }
}

export function getPublicStorageUrl(bucket: StorageBucket, path: string) {
  const normalized = path.replace(/^\/+/, '')
  if (!normalized) throw new Error('Caminho da imagem não informado.')
  return supabase.storage.from(bucket).getPublicUrl(normalized).data.publicUrl
}

export async function uploadCatalogProductImage({ file, readyStockId, position }: CatalogProductImageParams): Promise<StorageUploadResult> {
  if (position !== 1 && position !== 2) throw new Error('A posição da imagem deve ser 1 ou 2.')
  const extension = validateFile(file, PRODUCT_MAX_SIZE)
  const userId = await requireUserId()
  const product = await getCatalogProduct(userId, readyStockId)
  const path = `${userId}/${normalizeCode(product.publicCode)}/image-${position}.${extension}`
  const { error } = await supabase.storage.from('catalog-products').upload(path, file, {
    cacheControl: '3600',
    contentType: file.type,
    upsert: false,
  })
  if (error) throw new Error(error.message)
  return { path, url: getPublicStorageUrl('catalog-products', path) }
}

export async function deleteCatalogProductImage(path: string) {
  const userId = await requireUserId()
  const ownPath = assertOwnPath(path, userId)
  const { error } = await supabase.storage.from('catalog-products').remove([ownPath])
  if (error) throw new Error(error.message)
}

export async function replaceCatalogProductImage(params: CatalogProductImageParams & { currentPath?: string | null }): Promise<StorageUploadResult> {
  if (params.position !== 1 && params.position !== 2) throw new Error('A posição da imagem deve ser 1 ou 2.')
  const extension = validateFile(params.file, PRODUCT_MAX_SIZE)
  const userId = await requireUserId()
  const product = await getCatalogProduct(userId, params.readyStockId)
  const path = `${userId}/${normalizeCode(product.publicCode)}/image-${params.position}.${extension}`
  const currentPath = params.currentPath ? assertOwnPath(params.currentPath, userId) : null
  const { error } = await supabase.storage.from('catalog-products').upload(path, params.file, {
    cacheControl: '3600',
    contentType: params.file.type,
    upsert: path === currentPath,
  })
  if (error) throw new Error(error.message)
  if (currentPath && currentPath !== path) {
    const { error: deleteError } = await supabase.storage.from('catalog-products').remove([currentPath])
    if (deleteError) {
      await supabase.storage.from('catalog-products').remove([path])
      throw new Error(deleteError.message)
    }
  }
  return { path, url: getPublicStorageUrl('catalog-products', path) }
}

export async function uploadCompanyLogo(file: File): Promise<StorageUploadResult> {
  const extension = validateFile(file, LOGO_MAX_SIZE)
  const userId = await requireUserId()
  const path = `${userId}/logo.${extension}`
  const { error } = await supabase.storage.from('company-assets').upload(path, file, {
    cacheControl: '3600',
    contentType: file.type,
    upsert: true,
  })
  if (error) throw new Error(error.message)
  return { path, url: getPublicStorageUrl('company-assets', path) }
}

export async function deleteCompanyLogo(path: string) {
  const userId = await requireUserId()
  const ownPath = assertOwnPath(path, userId)
  const { error } = await supabase.storage.from('company-assets').remove([ownPath])
  if (error) throw new Error(error.message)
}
