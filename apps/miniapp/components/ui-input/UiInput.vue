<template>
  <view :class="wrapperClass">
    <input
      class="ui-input__field"
      :type="type"
      :value="value"
      :placeholder="placeholder"
      :disabled="disabled"
      :maxlength="normalizedMaxlength"
      :focus="autofocus"
      @focus="handleFocus"
      @blur="handleBlur"
      @input="handleInput"
      @confirm="handleConfirm"
    />
    <view v-if="showClear" class="ui-input__clear" role="button" @tap="clearValue">
      ×
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

/**
 * UiInput 封装原生 input，提供统一的圆角、边框与焦点态，并支持可清除的交互体验。
 * @property modelValue 绑定值，可通过 `v-model` 双向绑定。
 * @property placeholder 占位符文案。
 * @property type 输入类型，默认 `text`。
 * @property disabled 是否禁用输入框。
 * @property clearable 是否展示清空按钮。
 * @property maxlength 最大输入长度，`-1` 表示不限制。
 * @property autofocus 是否自动聚焦。
 */
interface Props {
  modelValue?: string | number
  placeholder?: string
  type?: string
  disabled?: boolean
  clearable?: boolean
  maxlength?: number
  autofocus?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: '',
  type: 'text',
  disabled: false,
  clearable: false,
  maxlength: -1,
  autofocus: false,
})

defineOptions({
  name: 'UiInput',
})

const emit = defineEmits<{
  (event: 'update:modelValue', value: string): void
  (event: 'focus', payload: Event): void
  (event: 'blur', payload: Event): void
  (event: 'confirm', payload: Event): void
  (event: 'clear'): void
}>()

const isFocused = ref(false)

const value = computed(() => (props.modelValue ?? '').toString())

const wrapperClass = computed(() => [
  'ui-input',
  isFocused.value ? 'ui-input--focused' : '',
  props.disabled ? 'ui-input--disabled' : '',
])

const showClear = computed(() => props.clearable && !props.disabled && value.value.length > 0)

const normalizedMaxlength = computed(() =>
  typeof props.maxlength === 'number' && props.maxlength >= 0 ? props.maxlength : undefined
)

function extractValue(event: any): string {
  if (event?.detail && typeof event.detail.value === 'string') return event.detail.value
  if (event?.target && typeof event.target.value === 'string') return event.target.value
  return ''
}

function handleInput(event: Event) {
  const next = extractValue(event)
  emit('update:modelValue', next)
}

function handleFocus(event: Event) {
  isFocused.value = true
  emit('focus', event)
}

function handleBlur(event: Event) {
  isFocused.value = false
  emit('blur', event)
}

function handleConfirm(event: Event) {
  emit('confirm', event)
}

function clearValue() {
  emit('update:modelValue', '')
  emit('clear')
}
</script>

<style scoped>
.ui-input {
  display: flex;
  align-items: center;
  min-height: 88rpx;
  padding: 0 24rpx;
  border-radius: var(--radius-md);
  border: 2rpx solid var(--color-border);
  background: var(--color-surface);
  transition: border-color 0.2s ease, box-shadow 0.2s ease, color 0.2s ease;
}

.ui-input--focused {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 4rpx rgba(124, 108, 255, 0.16);
}

.ui-input--disabled {
  opacity: 0.6;
}

.ui-input__field {
  flex: 1;
  font-size: var(--font-body);
  color: var(--color-text);
  background: transparent;
  line-height: 1.4;
}

.ui-input__field::placeholder {
  color: var(--color-text-muted);
}

.ui-input__clear {
  margin-left: 12rpx;
  width: 40rpx;
  height: 40rpx;
  border-radius: var(--radius-pill);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
  font-size: 28rpx;
  background: var(--color-surface-muted);
}

.ui-input__clear:active {
  background: rgba(124, 108, 255, 0.16);
  color: var(--color-primary);
}
</style>
