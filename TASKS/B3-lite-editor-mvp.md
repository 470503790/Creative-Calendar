# 任务卡

## 背景
提供基础的月历生成与轻量化编辑能力，为云端导出提供场景 JSON。

## 输入
- `packages/core`：日历网格与节假渲染算法
- `packages/canvas-lite`：Canvas 2D 封装
- 组件：ColorPicker、LayerList、Toolbar、ExportDialog

## 目标
- [ ] 生成月历网格（周起始/农历/节假开关）
- [ ] 文本/贴纸/背景替换；图层排序与锁定
- [ ] 颜色主题切换（tokens 驱动）
- [ ] 导出参数面板（尺寸/格式/DPI/页码）生成“场景 JSON”

## 输出
- `/pages/editor/index` 初版
- `packages/canvas-lite` API：addText/addImage/addSticker/setTheme/snapshot 等
- 场景 JSON 示例与校验（zod）

## 实施步骤
1. 落地 core 的网格/节假算法；渲染到 canvas-lite
2. 图层与操作：选中/移动/缩放/锁定/删除
3. 主题切换与取色器
4. 导出参数面板 → 场景 JSON（预览缩略图）

## 验收标准
- [ ] 主流机型轻编辑 ≥ 30fps
- [ ] 场景 JSON 对接导出 API 无误
