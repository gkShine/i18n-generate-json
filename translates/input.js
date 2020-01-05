const readline = require('readline')

module.exports = function() {
  return new Input(...arguments)
}

class Input {
  constructor(callback, object, from, to) {
    this.object = object
    this.keys = Object.keys(object)
    this.callback = callback
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })
    rl.question('是否现在就翻译?(y/N):', (answer) => {
      if (answer.toLocaleLowerCase() === 'y') {
        console.info(`\n当前语言为: ${from} => ${to}\n特殊命令有: 退出(:exit) 跳过(:skip)\n直接输入翻译内容并回车即可保存!\n`)
        this.ask(rl, 0)
      } else {
        rl.close()
        this.finish()
      }
    })
  }

  ask(rl, index) {
    const { keys, object } = this
    if (index === keys.length) {
      rl.close()
      return this.finish()
    }
    const key = keys[index]
    rl.question(key + '\n', (answer) => {
      switch (answer) {
        case ':exit':
          rl.close()
          this.finish()
          break
        case ':skip':
          this.ask(rl, ++index)
          break
        default:
          object[key] = answer
          this.ask(rl, ++index)
      }
    })
    rl.write(object[key])
  }

  finish() {
    const { callback, object } = this
    typeof callback === 'function' && callback(object)
  }
}
