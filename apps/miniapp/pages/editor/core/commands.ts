export type Command = {
  name: string
  do: () => void
  undo: () => void
}

export class CommandBus {
  private done: Command[] = []
  private undone: Command[] = []
  private max = 100

  execute(cmd: Command) {
    cmd.do()
    this.done.push(cmd)
    this.undone.length = 0
    if (this.done.length > this.max) this.done.shift()
  }
  undo() {
    const c = this.done.pop()
    if (!c) return
    c.undo()
    this.undone.push(c)
  }
  redo() {
    const c = this.undone.pop()
    if (!c) return
    c.do()
    this.done.push(c)
  }
  clear() {
    this.done.length = 0
    this.undone.length = 0
  }
}
