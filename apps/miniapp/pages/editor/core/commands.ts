export type Command = {
  name: string
  do: () => void
  undo: () => void
  timestamp?: number
  mergeKey?: string
  mergeWith?: (next: Command) => boolean
}

export type ExecuteOptions = {
  merge?: boolean
}

export class CommandBus {
  private done: Command[] = []
  private undone: Command[] = []
  private max = 100

  constructor(limit = 100) {
    this.max = limit
  }

  setLimit(limit: number) {
    this.max = Math.max(1, Math.floor(limit))
    if (this.done.length > this.max) {
      const overflow = this.done.length - this.max
      this.done.splice(0, overflow)
    }
  }

  execute(cmd: Command, options: ExecuteOptions = {}) {
    cmd.timestamp = Date.now()
    cmd.do()
    const last = this.done[this.done.length - 1]
    const sameMergeKey = !!cmd.mergeKey && !!last?.mergeKey && cmd.mergeKey === last.mergeKey
    const shouldMerge = options.merge && !!last && (sameMergeKey || cmd.name === last.name)

    if (shouldMerge && last?.mergeWith?.(cmd)) {
      last.timestamp = cmd.timestamp
      this.undone.length = 0
      return
    }

    this.done.push(cmd)
    this.undone.length = 0
    if (this.done.length > this.max) this.done.shift()
  }

  undo() {
    const c = this.done.pop()
    if (!c) return false
    c.undo()
    this.undone.push(c)
    return true
  }

  redo() {
    const c = this.undone.pop()
    if (!c) return false
    c.do()
    this.done.push(c)
    return true
  }

  canUndo() {
    return this.done.length > 0
  }

  canRedo() {
    return this.undone.length > 0
  }

  clear() {
    this.done.length = 0
    this.undone.length = 0
  }
}
