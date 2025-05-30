#!/usr/bin/env node

const fs = require('fs')
const { glob } = require('glob')
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
        extensions: ['vue', 'js', 'ts', 'jsx'],
        functionName: '\\$t|\\i18n[^\\(]*\\.t',
        willTransformise: false,
        deleteExpired: false,
        ignoreDefault: false,
        reportType: 'table'
      },
      options
    )
  }

  run() {
    const { from, extensions, baseList } = this.options
    let path = from.join('|')
    path = path.length ? `@(${path})` : '**'
    const ext = extensions.join('|')
    let base = baseList.join('|')
    base = baseList.length > 1 ? `@(${base})` : base
    glob(`${base}/${path}/**/*.@(${ext})`).then(files => {
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
          `\\W(${this.options.functionName})\\(\\'([^\\']*)\\'(\\)|,)`,
          'g'
        )
        let result
        let array = []
        while ((result = findTranslations.exec(text))) {
          array.push(result[2])
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

  getNeedTranslations(language, object) {
    const { sourceLanguage, ignoreDefault } = this.options
    if (language != sourceLanguage || ignoreDefault == false) {
      return _.pickBy((v, key) => {
        return (key == (willTransformise ? transformise(v) : v) || v === '')
      })(object)
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
          if (deleteExpired) {
            delete localeText[i]
            report[i] = { state: 'removed' }
          } else report[i] = { state: 'unused' }
        }
      }

      for (let i in newTranslations) {
        if (!report[i])
          report[i] = { state: 'new item added' }
      }

      this.autoTranslate(
        object => {
          let newObject = Object.assign({}, localeText, object)
          newObject = this.sortObject(newObject)
          fs.writeFileSync(
            `${base}/${to}/${language}.json`,
            JSON.stringify(newObject, null, 2),
            'utf8'
          )

          for (let i in this.getNeedTranslations(language, newObject)) {
            if (!report[i]) report[i] = { state: 'needs translation' }
          }

          if (Object.keys(report).length) {
            if (reportType === 'json') {
              for (let i in report) {
                report[i] = report[i].state
              }
              console.info(report)
            } else {
              console.table(report)
            }
          } else {
            console.log('No issues')
          }

          lock = false
        },
        Object.assign(this.getNeedTranslations(language, localeText), newTranslations),
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

  autoTranslate(callback, object, to) {
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
const dir = argv.d || argv.directory || ''
const functionName = argv.f || argv.functionName || '\\$t|\\i18n[^\\(]*\\.t'
const outputDirectory = argv.o || argv.output || 'lang'
const languages = argv.l || argv.languages || 'en'
const willTransformise = argv.t || argv.transformise || false
const sourceLanguage = argv.s || argv.sourceLanguage || 'zh-CN'
const autoTranslate = argv.a || argv.autoTranslate || false
const deleteExpired = argv.x || argv.deleteExpired || false
const ignoreDefault = argv.g || argv.ignoreDefault || false
const reportType = argv.r || argv.reportType || 'table'

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
  ignoreDefault: ignoreDefault,
  reportType: reportType
}).run()
