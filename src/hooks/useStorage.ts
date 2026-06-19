import { useCallback, useState } from 'react'
import {
  deleteCatalogProductImage,
  deleteCompanyLogo,
  getPublicStorageUrl,
  replaceCatalogProductImage,
  uploadCatalogProductImage,
  uploadCompanyLogo,
  type CatalogProductImageParams,
  type StorageBucket,
} from '../lib/storage'

export function useStorage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const run = useCallback(async <T,>(operation: () => Promise<T>) => {
    setLoading(true)
    setError(null)
    try {
      return await operation()
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Erro ao gerenciar imagem.'
      setError(message)
      throw caught
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    loading,
    error,
    uploadCatalogProductImage: (params: CatalogProductImageParams) => run(() => uploadCatalogProductImage(params)),
    replaceCatalogProductImage: (params: CatalogProductImageParams & { currentPath?: string | null }) => run(() => replaceCatalogProductImage(params)),
    deleteCatalogProductImage: (path: string) => run(() => deleteCatalogProductImage(path)),
    uploadCompanyLogo: (file: File) => run(() => uploadCompanyLogo(file)),
    deleteCompanyLogo: (path: string) => run(() => deleteCompanyLogo(path)),
    getPublicStorageUrl: (bucket: StorageBucket, path: string) => getPublicStorageUrl(bucket, path),
  }
}
