const http = require('http');
const querystring = require('querystring');

module.exports = bing;

function bing(callback, object, from, to) {
  let count = Object.keys(object).length;
  let timer;
  timer = setInterval(() => {
    if (count) {
      return;
    }
    clearInterval(timer);
    callback(object);
  }, 1000);

  let map = {
    'zh-CN': 'zh-CHS'
  };

  for (let text in object) {
    const contents = querystring.stringify({
      text: text,
      from: map[from] || from,
      to: map[to] || to
    });

    const req = http.request({
      host: 'cn.bing.com',
      path: '/ttranslate?IG=107707E3E84949BF8FDDE8265148BA07',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': contents.length
      }
    }, function (res) {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        data += chunk;
      }).on('end', () => {
        try {
          let res = JSON.parse(data);
          object[text] = res.translationResponse;
        } catch (e) {
          console.warn(e);
        }
        count--;
      });
    });
    req.write(contents);
    req.end;
  }
}