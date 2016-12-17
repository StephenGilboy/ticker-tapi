class Quote {
  constructor(under, bid, bidSize, ask, askSize, last) {
    this.under = under;
    this.bid = bid;
    this.bidSize = bidSize;
    this.ask = ask;
    this.askSize = askSize;
    this.last = last
  }



  isValid() {
    return (this.under && this.bid !== null && this.bid >= 0.00 && this.bidSize !== null && this.bidSize >= 0
    && this.ask !== null && this.ask >= 0.00 && this.askSize !== null && this.askSize >= 0 && this.last !== null
    && this.last >= 0.00);
  }
}

module.exports = Quote;