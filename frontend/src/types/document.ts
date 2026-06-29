export type DocumentData = Record<string, string | undefined>

export interface CatalogEntry {
  id: string
  name: string
  description: string
  filename: string
}
