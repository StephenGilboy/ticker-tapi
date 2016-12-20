const request = require('request');
const eventHub = require('central-event');
const Quote = require('./quote');
const promiseTry = require('es6-promise-try');


class QuoteSubscription {
	constructor(currentQuote) {
    if (!currentQuote || !currentQuote.isValid) {
			throw new Error("Argument 'currentQuote' is null or invalid.");
		}
		this.currentQuote = currentQuote;
    this.symbol = currentQuote.symbol.toUpperCase();
		this.numberOfSubscribers = 1;
	}

	equals(symbol) {
		return (symbol && typeof symbol === 'string' && symbol.toUpperCase() === this.symbol);
	}

	addSubscriber() {
		this.numberOfSubscribers += 1;
		return true;
	}

	removeSubscriber() {
		this.numberOfSubscribers -= 1;
		return true;
	}

	hasSubscribers() {
		return this.numberOfSubscribers > 0;
	}
}

class Ticker {

	constructor(externalQuoter, updateFrequency = 1000) {
		if (!externalQuoter) {
			throw new Error("An external quoter is required.");
		}

		this.subscriptions = [];
		this.externalQuoter = externalQuoter;
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
				// Ticker has been stopped. No reason to update
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
						console.log('Err');
						eventHub.emit('error', err);
					});
				} else {
					console.log('No Subscribers');
				}
			}
		}
	}

  /**
	 * Adds a subscriber to a feed of quotes for given symbol/under
   * @param {string} symbol - Symbol of the security/stock.
   * @returns {Promise} Quote
   */
	subscribe(symbol) {
		return promiseTry(() => {
			return this.findSubscription(symbol).then((subscription) => {
				if (subscription) {
				  subscription.addSubscriber();
				} else {
					return this.getQuote(symbol).then((quote) => {
            subscription = new QuoteSubscription(quote);
            this.subscriptions.push(subscription);
            return quote;
					}, (err) => {
					  throw new Error("Invalid Stock Symbol.");
          });
				}
			});
		});

		/*
		return new Promise((resolve, reject) => {
      // Find existing subscription
      let self = this;
      this.findSubscription(symbol).then((subscription) => {
        if (subscription && subscription.addSubscriber) {
          subscription.addSubscriber();
          resolve(subscription.currentQuote);
        } else {
          // Get a quote from Google so we have real numbers to start with
          self.getQuote(symbol).then((quote) => {
            if (!quote) {
              reject(new Error("No quote for " + symbol));
            } else {
              try {
                // Add a new subscription
                let subscription = new QuoteSubscription(quote);
                console.log('Added subscriber');
                self.subscriptions.push(subscription);
                self.startTicker();
                resolve(quote);
              } catch (ex) {
                reject(ex);
              }
            }
          }, reject);
        }
      }, reject);
		});
		*/
	}

  /**
	 * Removes subscriber from quote subscription
   * @param {string} symbol - Symbol of security/stock
   * @returns {Promise} Symbol if found.
   */
	unsubscribe(symbol) {

	  return promiseTry(() => {
	    return this.findSubscription(symbol).then((subscription) => {
	      if (subscription) {
	        subscription.removeSubscriber();
	        if (!subscription.hasSubscribers()) {
	          this.removeSubscription(subscription).then(() => {
	            if (this.subscriptions.length === 0) {
	              this.stopTicker();
              }
            });
          }
        }
      });
    });
	}

  /**
	 * Finds a subscription in the subscribers for the given symbol
   * @param {string} symbol - Symbol of the security/stock
   * @returns {Promise} resolves a subscription if found. Null if none exists.
   */
	findSubscription(symbol) {
		return new Promise((resolve, reject) => {
      let sub = this.subscriptions.filter(s => s.equals(symbol));
      if (sub.length) {
      	resolve(sub[0]);
			} else {
      	resolve(null);
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
        if (subIndex >= 0) {
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
		return promiseTry(() => this.externalQuoter.getQuote(symbol));
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