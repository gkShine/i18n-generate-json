# Generate translation json files for [vue-i18n](https://github.com/kazupon/vue-i18n)

[vue-i18n](https://github.com/kazupon/vue-i18n) is great, but making translation files can be a big manual job! This script will search your app and generate translation json files for you.
It's actually not tied to i18n-webpack-plugin at all. In fact I use it with my own translation function that is called at runtime. For that reason I provide the option to make your keys transformed to snake-case. This is my personal preference.

## Basic Example

### package.json
```
  scripts: {
    "i18n-generate": "i18n-generate -d src -l 'en zh-CN'"
  }
```

### App code
```
  <span>{{$t('oh hi, I need to be translated')}}</span>
  <span>{{$t('this script will save me {number} hours', {number: 73})}}</span> // variable replacement
```

### Output translation json - send it to the translator. Regenerating it won't delete existing translations.
```
  {
    "oh hi, I need to be translated": "!!oh hi, I need to be translated",
    "this script will save me {number} hours": "!!this script will save me {number} hours"
  }  
```

## Install
`npm i i18n-generate-json --save-dev`

## Run
1. add a script (see example package.json)
2. `npm run i18n-generate`

## Options
- `-d, -directory, REQUIRED, default [none]`
- `-f, -functionName, default [\\$t]`
- `-o, -outputDirectory, default [lang]`
- `-l, -languages, default ['en']`
- `-t, -transformise, default [false] : Transformises using lower snake case whilst preserving the * character to be used for variable substitution. e.g. the key for $t('i have *number* ducks') is 'i_have_*number*_ducks'`

## Advanced Example using lower-snake-case keys
```
  import { transformise } from 'i18n-generate-json';

  // custom translate function
  export function translate(translations, key) {
    const translation = translations[transformise(key)];
    if (translation) return translation;    
    return key;
  }
```