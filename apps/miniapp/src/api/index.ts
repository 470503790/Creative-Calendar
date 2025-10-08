import { mockTemplates, mockTemplateDetail, TemplateItem, TemplateDetail } from '../mock/templates'

const USE_MOCK = true

export async function getTemplates(): Promise<TemplateItem[]> {
  if (USE_MOCK) return Promise.resolve(mockTemplates)
  // TODO: prod fetch
  return []
}

export async function getTemplateDetail(id: string): Promise<TemplateDetail> {
  if (USE_MOCK) return Promise.resolve(mockTemplateDetail[id])
  return {} as any
}

export async function createProjectFromTemplate(tplId: string) {
  // mock: 返回一个临时 projectId
  return Promise.resolve({ projectId: `p_${tplId}_${Date.now()}` })
}
