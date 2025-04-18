const fs = require('fs')
const readline = require('readline')

module.exports = function() {
  return new JSONF(...arguments)
}

class JSONF {
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
        console.info(`\n当前语言为: ${from} => ${to}\n特殊命令有: 退出(:exit)\n`)
        console.info(object)
        this.ask(rl)
      } else {
        rl.close()
        this.finish()
      }
    })
  }

  ask(rl) {
    rl.question('请输入JSON文件地址:\n', (answer) => {
      try {
        if (answer !== ':exit') {
          const content = fs.readFileSync(answer)
          const data = JSON.parse(content)
          for (let k of this.keys) {
            if (k in data) {
              this.object[k] = data[k]
            }
          }
        }
        rl.close()
        this.finish()
      } catch (error) {
        console.warn(`No translation file exists or JSON connect error`)
        this.ask(rl)
      }
    })
  }

  finish() {
    const { callback, object } = this
    typeof callback === 'function' && callback(object)
  }
}
