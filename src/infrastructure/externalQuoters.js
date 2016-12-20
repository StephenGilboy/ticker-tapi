const request = require('request-promise');
const Quote = require('../domain/quote');
const promiseTry = require("es6-promise-try");

class GoogleQuoter {

  constructor() {
    this.endpoint = 'http://finance.google.com/finance/info?client=ig&q=NASDAQ%3A';
  }

  getQuote(symbol) {
    return promiseTry(() => {
      return request.get(this.endpoint + symbol);
    }).then((body) => {
      let quote = JSON.parse(body.substr(3, body.length));
      if (quote.length) {
        let bid = (quote[0].el_fix) ? parseFloat(quote[0].el_fix) : parseFloat(quote[0].l_fix);
        let ask = parseFloat(quote[0].pcls_fix);
        if (bid > ask) {
          let tmp = bid;
          bid = ask;
          ask = tmp;
        }
        let size = Math.ceil(Math.random() * 100);
        let qt = new Quote(symbol, bid.toFixed(2), size, ask.toFixed(2), size - 1, parseFloat(quote[0].l_fix).toFixed(2));
        return qt;
      } else {
        return null;
      }
    });
  }
}

module.exports.Google = GoogleQuoter;