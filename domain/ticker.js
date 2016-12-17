const request = require('request');
const eventHub = require('central-event');
const Quote = require('./quote');


class QuoteSubscription {
	constructor(currentQuote) {
    if (!currentQuote || !currentQuote.isValid()) {
			throw new Error("Argument 'currentQuote' is null or invalid.");
		}
		this.currentQuote = currentQuote;
    this.symbol = currentQuote.under.toUpperCase();
		this.numberOfSubscribers = 0;
	}

	equals(symbol) {
		return (symbol && typeof symbol === 'string' && symbol.toUpperCase() === this.symbol);
	}

	addSubscriber() {
		this.numberOfSubscribers += 1;
	}

	removeSubscriber() {
		this.numberOfSubscribers -= 1;
	}

	hasSubscribers() {
		return this.numberOfSubscribers > 0;
	}
}

class Ticker {

	constructor(updateFrequency = 1000) {
		this.subscriptions = [];
		// Don't let people abuse the update frequency. 1 second is enough.
		this.updateFrequency = (updateFrequency > 1000) ? 1000 : updateFrequency;
		this.intervalObj = null;
		this.canTick = false;
	}

  /**
	 * Starts the ticker
   */
	startTicker() {
		if (this.canTick) return;

		this.canTick = true;
		this.intervalObj = setInterval(() => {
			this.tick();
		}, this.updateFrequency);
	}

  /**
	 * Stops the ticker
   */
	stopTicker() {
		this.canTick = false;
		if (this.intervalObj) {
			clearInterval(this.intervalObj);
		}
	}

  /**
	 * Updates quotes and emits 'tick' event on update.
   */
	tick() {
		for(let i = 0; i < this.subscriptions.length; i++) {
			if (!this.canTick) {
				return;
			} else {
				let sub = this.subscriptions[i];
				// Only update when there are subscribers.
				// Let unsubscribe deal with cleanup
				if (sub.hasSubscribers()) {
					this.getUpdate(sub.currentQuote).then((quote) => {
						sub.currentQuote = quote;
						eventHub.emit('tick', quote);
					}, (err) => {
						eventHub.emit('error', err);
					});
				}
			}
		}
	}

  /**
	 * Adds a subscriber to a feed of quotes for given symbol/under
   * @param {string} symbol - Symbol of the security/stock.
   * @param {function} next = (error, quote)
   */
	subscribe(symbol, next) {
		// Find existing subscription
		let self = this;
		this.findSubscription(symbol).then((subscription) => {
			if (subscription) {
				// Add the subscriber and return the current quote
				subscription.addSubscriber();
				next(null, subscription.currentQuote);
			} else {
				// Get a quote from Google so we have real numbers to start with
				self.getQuote(symbol).then((quote) => {
					if (!quote) {
						next(new Error("No quote for " + symbol));
					} else {
            try {
							// Add a new subscription
              let subscription = new QuoteSubscription(quote);
              console.log('Added subscriber');
              self.subscriptions.push(subscription);
              if (this.canTick === false) {
              	this.startTicker();
							}
              next(null, quote);
            } catch (ex) {
              next(ex);
            }
					}
				}, next);
			}
		}, next);
	}

  /**
	 * Removes subscriber from quote subscription
   * @param {string} symbol - Symbol of security/stock
   * @param {function} next - (err, null);
   */
	unsubscribe(symbol, next) {
		// Find existing subscription
		this.findSubscription(symbol).then((subscription) => {
			if (subscription) {
				subscription.removeSubscriber();
				if (!subscription.hasSubscribers()) {
					this.removeSubscription(subscription).then(() => {
						if (this.subscriptions.length === 0) {
							this.stopTicker();
						}
            next(null, subscription.symbol)
					}, next);
				}
			} else {
				next(null, null);
			}
		}, next);
	}

  /**
	 * Finds a subscription in the subscribers for the given symbol
   * @param {string} symbol - Symbol of the security/stock
   * @returns {Promise} resolves a subscription if found. Null if none exists.
   */
	findSubscription(symbol) {
		return new Promise((resolve, reject) => {
			try {
        let sub = this.subscriptions.filter(s => s.equals(symbol));
        if (sub.length) {
        	resolve(sub);
				} else {
        	resolve(null);
				}
			} catch (e) {
				reject(e);
			}
		});
	}

  /**
	 * Removes subscription from subscribers if it is in the array
   * @param {QuoteSubscription} subscription
   * @returns {Promise} Resolves either way
   */
	removeSubscription(subscription) {
		return new Promise((resolve, reject) => {
			try {
        let subIndex = this.subscriptions.indexOf(subscription);
        if (subIndex) {
        	this.subscriptions.splice(subIndex, 1);
				}
				resolve();
			} catch (ex) {
        	reject(ex);
			}
		});
	}

  /**
	 * Gets a real quote from Google's finance API endpoint.
   * @param {string} symbol - Symbol of security/stock
   * @returns {Promise} resolves Quote if found, null if not found
   */
	getQuote(symbol) {
		return new Promise((resolve, reject) => {
      let size = Math.ceil(Math.random() * 100);
      request.get('http://finance.google.com/finance/info?client=ig&q=NASDAQ%3A' + symbol, (err, resp) => {
        if (err) {
          reject(err);
        } else {
          let quote = JSON.parse(resp.body.substr(3, resp.body.length));
          if (quote.length) {
          	try {
              let bid = (quote[0].el_fix) ? parseFloat(quote[0].el_fix).toFixed(2) : parseFloat(quote[0].l_fix).toFixed(2);
              let qt = new Quote(symbol, bid, size, parseFloat(quote[0].pcls_fix).toFixed(2), size - 1, parseFloat(quote[0].l_fix).toFixed(2));
              resolve(qt);
						} catch (ex) {
          		reject(ex);
						}
					} else {
          	resolve(null);
					}
        }
      });
		});
	}

  /**
	 * Updates a quote with fake numbers.
   * @param {Quote} quote - Quote object to update
   * @returns {Promise} resolves a new Quote with updated numbers
   */
  getUpdate(quote) {
		return new Promise((resolve, reject) => {
			if (!quote) {
				reject(new Error("Argument 'quote' is null or undefined."));
			} else if (!quote.isValid()){
				reject(new Error("Supplied quote is invalid."));
			} else {
        let rand = Math.random() * 100,
            moveUp = (rand % 2) === 0,
            size = Math.ceil(Math.random() * 100),
            point = Math.random(),
            qte = (moveUp) ?
                new Quote(quote.under, (quote.bid + point).toFixed(2), size, (quote.ask + point + 0.05).toFixed(2), size - 1, quote.ask) :
                new Quote(quote.under, (quote.bid - point).toFixed(2), size, (quote.ask - point + 0.05).toFixed(2), size - 1, quote.bid);
        resolve(qte);
			}
		});
  }

}

module.exports = Ticker;