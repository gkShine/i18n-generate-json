#!/usr/bin/env node

const fs = require('fs');
const glob = require('glob');
const _ = require('lodash/fp');
const {transformise} = require('./index');

class i18nGenerateJson {
  constructor(options) {
    this.options = _.extend({
      from: [],
      to: '',
      languages: ['en'],
      sourceLanguage: 'zh-CN',
      autoTranslate: false,
      extensions: ['vue', 'js'],
      functionName: '\\$t',
      willTransformise: false
    }, options);
  }

  run() {
    let path = this.options.from.join('|');
    let ext = this.options.extensions.join('|');
    glob(`@(${path})/**/*.@(${ext})`, {}, (err, files) => {
      if (err) throw err;
      this.writeJSON(this.getText(files));
    });
  }

  getText(files) {
    return _.compose(
      _.compact,
      _.uniq,
      _.flatten,
      _.map((file) => {
        const text = fs.readFileSync(file, 'utf8');
        const findTranslations = new RegExp(`\\W${this.options.functionName}\\(\\'([^\\']*)\\'(\\)|,)`, "g");
        let result;
        let array = [];
        while (result = findTranslations.exec(text)) {
          array.push(result[1]);
        }
        return array;
      })
    )(files);
  }

  getLocaleConfig(language) {
    try {
      let dir = this.options.to;
      const content = fs.readFileSync(`${dir}/${language}.json`);
      return JSON.parse(content);
    } catch (error) {
      console.warn(`No translation file exists for language "${language}"`);
    }
    return {};
  }

  writeJSON(value) {
    let timer, lock;
    let index = 0;
    const languages = this.options.languages;
    timer = setInterval(() => {
      if (lock) {
        return; //第一个还没执行完则返回
      }
      if (languages.length <= index) {
        clearInterval(timer);
        return;
      }
      lock = true;
      let language = languages[index++];
      const localeText = this.getLocaleConfig(language);
      const foundMap = _.keyBy((str) => {
        return this.options.willTransformise ? transformise(str) : str;
      })(value);
      const newTranslations = _.pickBy((v, key) => {
        const found = localeText[key];
        return !found;
      })(foundMap);
      console.log(`${language}: new translations found\n`, _.keys(newTranslations));
      this.autoTranslateByBing((object) => {
        let newObject = Object.assign({},
          localeText,
          object
        );
        newObject = this.sortObject(newObject);
        fs.writeFileSync(
          `${this.options.to}/${language}.json`,
          JSON.stringify(newObject, null, 2), 'utf8'
        );
        lock = false;
      }, newTranslations, language);
    }, 1000);
  }

  sortObject(obj) {
    return Object.keys(obj).sort().reduce((result, key) => (
      Object.assign({}, result, {
        [key]: obj[key],
      })
    ), {});
  }

  autoTranslateByBing(callback, object, to) {
    let count = Object.keys(object).length;
    //源语言则直接返回，不翻译也直接返回
    if (!this.options.autoTranslate || to === this.options.sourceLanguage || !count) {
      callback(object);
      return;
    }
    try {
      let translate = require('./translates/' + this.options.autoTranslate);
      translate(callback, object, this.options.sourceLanguage, to);
    } catch (e) {
      callback(object);
      console.warn(e.message);
    }
  }
}

const argv = require('minimist')(process.argv.slice(2));
const dir = argv.d || argv.directory;
const functionName = argv.f || argv.functionName || '\\$t';
const outputDirectory = argv.o || argv.output || 'lang';
const languages = argv.l || argv.languages || 'en';
const willTransformise = argv.t || argv.transformise || false;
const sourceLanguage = argv.s || argv.sourceLanguage || false;
const autoTranslate = argv.a || argv.autotranslate || false;

new i18nGenerateJson({
  from: dir.split(' '),
  to: outputDirectory,
  languages: languages.split(' '),
  autoTranslate: autoTranslate,
  functionName: functionName,
  sourceLanguage: sourceLanguage,
  willTransformise: willTransformise
}).run();
