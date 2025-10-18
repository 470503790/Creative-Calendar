# S2-09 · “日历”属性面板 UI 与联动

## 实施
- 新建 `CalendarProps.vue`，提供周起始/开关/滑条等控件
- 联动 `store.updateLayerProps(id, partial)` → `renderer.requestRender()`

## 验收
- 切换参数即生效；未选中日历层时禁用提示
