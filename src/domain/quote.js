class Quote {
  constructor(symbol, bid, bidSize, ask, askSize, last) {
    this.symbol = symbol;
    this.bid = parseFloat(bid).toFixed(2);
    this.bidSize = parseInt(bidSize);
    this.ask = parseFloat(ask).toFixed(2);
    this.askSize = parseInt(askSize);
    this.last = parseFloat(last).toFixed(2);
  }

  get isValid() {
    return (this.symbol && this.bid !== null && this.bid >= 0.00 && this.bidSize !== null && this.bidSize >= 0
    && this.ask !== null && this.ask >= 0.00 && this.askSize !== null && this.askSize >= 0 && this.last !== null
    && this.last >= 0.00);
  }
}

module.exports = Quote;