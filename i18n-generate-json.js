#!/usr/bin/env node

const fs = require('fs')
const glob = require('glob')
const _ = require('lodash/fp')
const { transformise } = require('./index')

class i18nGenerateJson {
  constructor(options) {
    this.options = _.extend(
      {
        base: '',
        baseList: [],
        from: [],
        to: '',
        languages: ['en'],
        sourceLanguage: 'zh-CN',
        autoTranslate: false,
        extensions: ['vue', 'js'],
        functionName: '\\$t',
        willTransformise: false,
        deleteExpired: false,
        ignoreDefault: false
      },
      options
    )
  }

  run() {
    const { from, extensions, baseList } = this.options
    const path = from.join('|')
    const ext = extensions.join('|')
    const base = baseList.join('|')
    glob(`@(${base})/@(${path})/**/*.@(${ext})`, {}, (err, files) => {
      if (err) throw err
      this.writeJSON(this.getText(files))
    })
  }

  getText(files) {
    return _.compose(
      _.compact,
      _.uniq,
      _.flatten,
      _.map(file => {
        const text = fs.readFileSync(file, 'utf8')
        const findTranslations = new RegExp(
          `\\W${this.options.functionName}\\(\\'([^\\']*)\\'(\\)|,)`,
          'g'
        )
        let result
        let array = []
        while ((result = findTranslations.exec(text))) {
          array.push(result[1])
        }
        return array
      })
    )(files)
  }

  getLocaleConfig(language) {
    try {
      const { base, to } = this.options
      const content = fs.readFileSync(`${base}/${to}/${language}.json`)
      return JSON.parse(content)
    } catch (error) {
      console.warn(`No translation file exists for language "${language}"`)
    }
    return {}
  }

  writeJSON(value) {
    let timer, lock
    let index = 0
    const {
      languages,
      base,
      to,
      willTransformise,
      autoTranslate,
      deleteExpired,
      ignoreDefault
    } = this.options
    timer = setInterval(() => {
      if (lock) {
        return //第一个还没执行完则返回
      }
      if (languages.length <= index) {
        clearInterval(timer)
        return
      }
      lock = true
      let language = languages[index++]
      let localeText = this.getLocaleConfig(language)

      const foundMap = _.keyBy(str => {
        return willTransformise ? transformise(str) : str
      })(value)

      const newTranslations = _.pickBy((v, key) => {
        const found = localeText[key]
        return !found
      })(foundMap)

      console.log(`\n${language}: ${base}/${to}/${language}.json`)

      let report = {}

      for (let i in localeText) {
        if (value.indexOf(i) < 0) {
          if (deleteExpired) delete localeText[i]
          else report[i] = { state: 'unused' }
        }
      }

      for (let i in newTranslations) {
        if (!report[i])
          report[i] = { state: 'new item added' }
      }

      this.autoTranslateByBing(
        object => {
          let newObject = Object.assign({}, localeText, object)
          newObject = this.sortObject(newObject)
          fs.writeFileSync(
            `${base}/${to}/${language}.json`,
            JSON.stringify(newObject, null, 2),
            'utf8'
          )

          if (language != sourceLanguage || ignoreDefault == false) {
            const needTranslations = _.pickBy((v, key) => {
              return (key == (willTransformise ? transformise(v) : v) || v === '')
            })(newObject)

            for (let i in needTranslations) {
              if (!report[i]) report[i] = { state: 'needs translation' }
            }
          }

          if (Object.keys(report).length)
            console.table(report)
          else
            console.log('No issues')

          lock = false
        },
        newTranslations,
        language
      )
    }, 1000)
  }

  sortObject(obj) {
    return Object.keys(obj)
      .sort()
      .reduce(
        (result, key) =>
          Object.assign({}, result, {
            [key]: obj[key]
          }),
        {}
      )
  }

  autoTranslateByBing(callback, object, to) {
    let count = Object.keys(object).length
    //源语言则直接返回，不翻译也直接返回
    if (
      !this.options.autoTranslate ||
      to === this.options.sourceLanguage ||
      !count
    ) {
      callback(object)
      return
    }
    try {
      let translate = require('./translates/' + this.options.autoTranslate)
      translate(callback, object, this.options.sourceLanguage, to)
    } catch (e) {
      callback(object)
      console.warn(e.message)
    }
  }
}

const argv = require('minimist')(process.argv.slice(2))
const baseDir = argv.b || argv.baseDirectory || '.'
const dir = argv.d || argv.directory || '**'
const functionName = argv.f || argv.functionName || '\\$t'
const outputDirectory = argv.o || argv.output || 'lang'
const languages = argv.l || argv.languages || 'en'
const willTransformise = argv.t || argv.transformise || false
const sourceLanguage = argv.s || argv.sourceLanguage || 'zh-CN'
const autoTranslate = argv.a || argv.autotranslate || false
const deleteExpired = argv.x || argv.deleteExpired || false
const ignoreDefault = argv.g || argv.ignoreDefault || false

const baseList = baseDir.replace(/\/$/, '').split(' ')
new i18nGenerateJson({
  base: baseList[0],
  baseList: baseList,
  from: dir.split(' '),
  to: outputDirectory,
  languages: languages.split(' '),
  autoTranslate: autoTranslate,
  functionName: functionName,
  sourceLanguage: sourceLanguage,
  willTransformise: willTransformise,
  deleteExpired: deleteExpired,
  ignoreDefault: ignoreDefault
}).run()
