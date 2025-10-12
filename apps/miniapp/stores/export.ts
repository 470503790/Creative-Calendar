import { computed, reactive, ref, watch } from 'vue'

export type ExportPresetKey = 'origin' | 'print-a4' | 'print-a3' | 'mobile-916' | 'square-1200' | 'custom'
export type ExportFormat = 'png' | 'jpg' | 'pdf'
export type ExportWatermark = 'none' | 'logo' | 'text'

interface ExportFormState {
  presetKey: ExportPresetKey
  width: number
  height: number
  dpi: number
  format: ExportFormat
  naming: string
  includeBleed: boolean
  bleed: number
  watermark: ExportWatermark
  watermarkText: string
}

export interface ExportRecord {
  id: string
  createdAt: number
  durationMs: number
  presetKey: ExportPresetKey
  presetLabel: string
  width: number
  height: number
  dpi: number
  format: ExportFormat
  includeBleed: boolean
  bleed: number
  watermark: ExportWatermark
  watermarkText?: string
  naming: string
}

interface ExportSizeOption {
  key: ExportPresetKey
  label: string
  width: number
  height: number
  ratio: string
  category: 'print' | 'screen' | 'custom'
  bleed?: number
  description: string
}

interface ValidationResult {
  valid: boolean
  errors: Partial<Record<keyof ExportFormState, string>>
}

interface ProgressStage {
  progress: number
  message: string
}

const STORAGE_KEY = 'cc_export_records_v1'

let singleton: ReturnType<typeof createExportStore> | null = null

function createId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
}

function clampNumber(value: number, min: number, max: number) {
  if (Number.isNaN(value)) return min
  if (value < min) return min
  if (value > max) return max
  return value
}

function loadRecords(): ExportRecord[] {
  try {
    if (typeof uni === 'undefined' || typeof uni.getStorageSync !== 'function') return []
    const raw = uni.getStorageSync(STORAGE_KEY)
    if (!raw) return []
    const parsed: ExportRecord[] = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (!Array.isArray(parsed)) return []
    return parsed.map((item) => ({
      ...item,
      watermarkText: item.watermarkText ?? '',
    }))
  } catch (error) {
    console.warn('[export] failed to load records', error)
    return []
  }
}

function persistRecords(records: ExportRecord[]) {
  try {
    if (typeof uni === 'undefined' || typeof uni.setStorageSync !== 'function') return
    uni.setStorageSync(STORAGE_KEY, JSON.stringify(records))
  } catch (error) {
    console.warn('[export] failed to persist records', error)
  }
}

function createExportStore() {
  const baseSize = ref({ width: 1080, height: 1920 })

  const form = reactive<ExportFormState>({
    presetKey: 'origin',
    width: baseSize.value.width,
    height: baseSize.value.height,
    dpi: 300,
    format: 'png',
    naming: '创意日历导出',
    includeBleed: false,
    bleed: 3,
    watermark: 'none',
    watermarkText: '',
  })

  const errors = ref<ValidationResult['errors']>({})

  const records = ref<ExportRecord[]>(loadRecords())

  const isExporting = ref(false)
  const progress = ref(0)
  const progressMessage = ref('')
  let progressTimer: ReturnType<typeof setInterval> | null = null
  let progressStageIndex = 0
  let startedAt = 0

  const dpiOptions = [72, 150, 300, 450]

  const formatOptions: { value: ExportFormat; label: string; description: string }[] = [
    { value: 'png', label: 'PNG', description: '透明背景，适合分享' },
    { value: 'jpg', label: 'JPG', description: '压缩体积更小' },
    { value: 'pdf', label: 'PDF', description: '保留矢量，适合打印' },
  ]

  const watermarkOptions: { value: ExportWatermark; label: string; description: string }[] = [
    { value: 'none', label: '不添加水印', description: '直接导出原图' },
    { value: 'logo', label: '右下角 Logo', description: '适合作品集展示' },
    { value: 'text', label: '文本水印', description: '可输入自定义文案' },
  ]

  const progressStages: ProgressStage[] = [
    { progress: 16, message: '整理画布图层…' },
    { progress: 38, message: '渲染像素数据…' },
    { progress: 62, message: '应用出血与水印…' },
    { progress: 85, message: '生成文件压缩包…' },
    { progress: 100, message: '写入导出记录…' },
  ]

  const sizeOptions = computed<ExportSizeOption[]>(() => {
    const ratio = baseSize.value.height && baseSize.value.width
      ? (baseSize.value.height / baseSize.value.width).toFixed(2)
      : '1.78'
    return [
      {
        key: 'origin',
        label: `画布尺寸 ${baseSize.value.width} × ${baseSize.value.height}`,
        width: baseSize.value.width,
        height: baseSize.value.height,
        ratio: `≈1:${ratio}`,
        category: 'screen',
        description: '保持当前画布比例，适合在线分享',
      },
      {
        key: 'mobile-916',
        label: '社媒竖版 1080 × 1920',
        width: 1080,
        height: 1920,
        ratio: '9:16',
        category: 'screen',
        description: '适合朋友圈、小红书等竖屏平台',
      },
      {
        key: 'square-1200',
        label: '社媒方形 1200 × 1200',
        width: 1200,
        height: 1200,
        ratio: '1:1',
        category: 'screen',
        description: '常用商品卡片尺寸',
      },
      {
        key: 'print-a4',
        label: '打印 · A4 竖版 2480 × 3508',
        width: 2480,
        height: 3508,
        ratio: '1:1.41',
        category: 'print',
        bleed: 3,
        description: '适合桌面日历、海报打印',
      },
      {
        key: 'print-a3',
        label: '打印 · A3 竖版 3508 × 4961',
        width: 3508,
        height: 4961,
        ratio: '1:1.41',
        category: 'print',
        bleed: 3,
        description: '适合展板与张贴展示',
      },
      {
        key: 'custom',
        label: '自定义尺寸',
        width: form.width,
        height: form.height,
        ratio: form.height && form.width ? `≈1:${(form.height / form.width).toFixed(2)}` : '-',
        category: 'custom',
        description: '输入任意宽高，最多 6000px',
      },
    ]
  })

  const selectedPreset = computed(() => sizeOptions.value.find((item) => item.key === form.presetKey))

  const isCustomPreset = computed(() => form.presetKey === 'custom')

  watch(
    () => form.presetKey,
    (key) => {
      const preset = sizeOptions.value.find((item) => item.key === key)
      if (!preset) return
      if (preset.category !== 'custom') {
        form.width = preset.width
        form.height = preset.height
      }
      if (preset.category === 'print') {
        form.includeBleed = true
        form.bleed = preset.bleed ?? 3
      } else if (key === 'origin') {
        form.includeBleed = false
      }
    },
    { immediate: true }
  )

  function setBaseSize(width: number, height: number) {
    baseSize.value = {
      width: Math.max(320, Math.round(width) || 1080),
      height: Math.max(320, Math.round(height) || 1920),
    }
    if (form.presetKey === 'origin') {
      form.width = baseSize.value.width
      form.height = baseSize.value.height
    }
  }

  function setPreset(key: ExportPresetKey) {
    form.presetKey = key
  }

  function updateNaming(value: string) {
    form.naming = value
  }

  function updateWidth(value: number) {
    const next = clampNumber(Math.round(value), 320, 6000)
    form.width = next
  }

  function updateHeight(value: number) {
    const next = clampNumber(Math.round(value), 320, 6000)
    form.height = next
  }

  function updateDpi(value: number) {
    form.dpi = value
  }

  function updateFormat(value: ExportFormat) {
    form.format = value
  }

  function updateIncludeBleed(value: boolean) {
    form.includeBleed = value
  }

  function updateBleed(value: number) {
    form.bleed = clampNumber(Math.round(value), 0, 20)
  }

  function updateWatermark(value: ExportWatermark) {
    form.watermark = value
    if (value === 'none') {
      form.watermarkText = ''
    }
  }

  function updateWatermarkText(value: string) {
    form.watermarkText = value
  }

  function validate(): ValidationResult {
    const result: ValidationResult['errors'] = {}
    if (!form.naming || !form.naming.trim()) {
      result.naming = '请填写导出文件名'
    }
    if (!form.width || Number.isNaN(form.width)) {
      result.width = '请输入有效宽度'
    }
    if (!form.height || Number.isNaN(form.height)) {
      result.height = '请输入有效高度'
    }
    if (form.width < 320 || form.height < 320) {
      result.width = '最小宽高为 320 像素'
      result.height = '最小宽高为 320 像素'
    }
    if (form.width > 6000 || form.height > 6000) {
      result.width = '最大宽高为 6000 像素'
      result.height = '最大宽高为 6000 像素'
    }
    if (form.dpi < 72) {
      result.dpi = '分辨率至少 72 DPI'
    }
    if (form.watermark === 'text' && !form.watermarkText.trim()) {
      result.watermarkText = '请输入水印文案'
    }
    errors.value = result
    return { valid: Object.keys(result).length === 0, errors: result }
  }

  function resetProgressState() {
    if (progressTimer) {
      clearInterval(progressTimer)
      progressTimer = null
    }
    progress.value = 0
    progressMessage.value = ''
    progressStageIndex = 0
    startedAt = 0
  }

  function completeExport() {
    const finishedAt = Date.now()
    const record: ExportRecord = {
      id: createId('export'),
      createdAt: finishedAt,
      durationMs: startedAt ? finishedAt - startedAt : 0,
      presetKey: form.presetKey,
      presetLabel: selectedPreset.value?.label ?? '自定义尺寸',
      width: form.width,
      height: form.height,
      dpi: form.dpi,
      format: form.format,
      includeBleed: form.includeBleed,
      bleed: form.includeBleed ? form.bleed : 0,
      watermark: form.watermark,
      watermarkText: form.watermark === 'text' ? form.watermarkText.trim() : '',
      naming: form.naming.trim(),
    }
    records.value = [record, ...records.value].slice(0, 20)
    persistRecords(records.value)
    if (typeof uni !== 'undefined' && typeof uni.showToast === 'function') {
      uni.showToast({ title: '导出完成（mock）', icon: 'none' })
    }
    resetProgressState()
    isExporting.value = false
  }

  function runProgress() {
    if (progressTimer) {
      clearInterval(progressTimer)
    }
    progressTimer = setInterval(() => {
      const stage = progressStages[progressStageIndex]
      if (!stage) {
        if (progress.value >= 100) {
          progressMessage.value = '导出完成'
          progressTimer && clearInterval(progressTimer)
          progressTimer = null
          completeExport()
        }
        return
      }
      progressMessage.value = stage.message
      const target = stage.progress
      const step = Math.max(1, Math.round((target - progress.value) / 3))
      progress.value = Math.min(progress.value + step, target)
      if (progress.value >= target) {
        progressStageIndex += 1
      }
    }, 320)
  }

  function startExport() {
    if (isExporting.value) return
    const result = validate()
    if (!result.valid) return
    errors.value = {}
    isExporting.value = true
    startedAt = Date.now()
    progress.value = 0
    progressMessage.value = '准备导出…'
    progressStageIndex = 0
    runProgress()
  }

  function cancelExport() {
    resetProgressState()
    isExporting.value = false
  }

  function applyRecord(record: ExportRecord) {
    form.naming = record.naming
    form.presetKey = record.presetKey
    if (record.presetKey === 'custom') {
      form.width = record.width
      form.height = record.height
    }
    form.width = record.width
    form.height = record.height
    form.dpi = record.dpi
    form.format = record.format
    form.includeBleed = record.includeBleed
    form.bleed = record.bleed
    form.watermark = record.watermark
    form.watermarkText = record.watermarkText ?? ''
  }

  function clearRecords() {
    records.value = []
    persistRecords(records.value)
  }

  return {
    form,
    errors,
    sizeOptions,
    selectedPreset,
    isCustomPreset,
    dpiOptions,
    formatOptions,
    watermarkOptions,
    records,
    isExporting,
    progress,
    progressMessage,
    setBaseSize,
    setPreset,
    updateNaming,
    updateWidth,
    updateHeight,
    updateDpi,
    updateFormat,
    updateIncludeBleed,
    updateBleed,
    updateWatermark,
    updateWatermarkText,
    startExport,
    cancelExport,
    applyRecord,
    clearRecords,
  }
}

export type ExportStore = ReturnType<typeof createExportStore>

export function useExportStore() {
  if (singleton) return singleton
  singleton = createExportStore()
  return singleton
}
