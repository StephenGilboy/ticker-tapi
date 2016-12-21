const request = require('request');
const eventHub = require('central-event');
const Quote = require('./quote');
const promiseTry = require('es6-promise-try');
const Rx = require('rxjs');

class Ticker {

	constructor(externalQuoter, updateFrequency = 1000) {
		if (!externalQuoter) {
			throw new Error("An external quoter is required.");
		}

		this.observables = new Map();
		this.subscribers = new Map();
		this.externalQuoter = externalQuoter;
		// Don't let people abuse the update frequency. 1 second is enough.
		this.updateFrequency = (updateFrequency > 1000) ? 1000 : updateFrequency;
	}


  /**
	 * Adds a subscriber to a feed of quotes for given symbol/under
   * @param {string} symbol - Symbol of the security/stock.
   * @returns {Promise} Quote
   */
	subscribe (subscriberId, symbol, callback) {
		return promiseTry(() => {
			return this.findSubscriber(subscriberId).then((subscriptions) => {
				if (subscriptions) {
					// Check if subscribed to symbol
					return this.findSubscription(subscriptions, symbol).then((subscription) => {
						if (subscription) {
							return;
						} else {
							return this.findObservable(symbol).then((observable) => {
								if (observable) {
									// Add new subscription
									let newSub = observable.subscribe(callback);
                  subscriptions.set(symbol, newSub);
								} else {
									return this.getQuote(symbol).then((quote) => {
										return this.addObservable(quote).then((observable) => {
                      // Add new subscription
                      let newSub = observable.subscribe(callback);
                      subscriptions.set(symbol, newSub);
										});
									});
								}
							});
						}
					});
				} else {
					// NO Subscriber
					return this.getQuote(symbol).then((quote) => {
						this.addObservable(quote).then((observable) => {
							this.addSubscriber(subscriberId).then((subscriptions) => {
                let newSub = observable.subscribe(callback);
                subscriptions.set(symbol, newSub);
							})
						})
					})
				}
			});
		});
	}

  /**
	 * Removes subscriber from quote subscription
   * @param {string} symbol - Symbol of security/stock
   * @returns {Promise} Symbol if found.
   */
	unsubscribe(subscriberId, symbol) {
	  return promiseTry(() => {
	    return this.findSubscriber(subscriberId).then((subscriptions) => {
	    	if (subscriptions) {
          return this.findSubscription(subscriptions, symbol).then((sub) => {
          	if (sub) {
          		sub.unsubscribe();
          		subscriptions.delete(symbol);
						}
          })	;
				}
			})
    });
	}

	unsubscribeAll(subscriberId) {
		return promiseTry(() => {
			return this.findSubscriber(subscriberId).then((subscriptions) => {
				if (subscriptions) {
					subscriptions.forEach((sub) => {
						if (sub) {
              sub.unsubscribe();
						}
					});
					subscriptions.clear();
					this.subscribers.delete(subscriberId);
				}
			});
		});
	}

	addObservable (quote) {
		let self = this;
		return new Promise((resolve, reject) => {
			if (quote === null || quote === undefined || quote.isValid === false) {
				reject(new Error('Argument "quote" is invalid.'));
			} else {
				if (this.observables.has(quote.symbol)) {
					resolve(this.observables.get(quote.symbol));
				} else {
					let obsv = Rx.Observable.create(observable => {
						let lastQt = quote;
						setInterval(() => {
							self.getUpdate(lastQt).then((qt) => {
								lastQt = qt;
								observable.next(lastQt);
							});
						}, 800);
					});
					this.observables.set(quote.symbol, obsv);
					resolve(obsv);
				}
			}
		});
	}

	findObservable (symbol) {
		return new Promise((resolve, reject) => {
			if (typeof symbol !== 'string' || symbol.length === 0) {
				reject(new Error('Argument "symbol" is invalid.'));
			} else {
				resolve(this.observables.get(symbol.toUpperCase()));
			}
		});
	}

	addSubscriber (subscriberId) {
		return new Promise((resolve, reject) => {
			if (subscriberId === null || subscriberId === undefined) {
				reject(new Error('Argument "subscriberId" is invalid'));
			} else {
				if (this.subscribers.has(subscriberId)) {
					resolve(this.subscribers.get(subscriberId));
				} else {
					let map = new Map();
					this.subscribers.set(subscriberId, map);
					resolve(map);
				}
			}
		});
	}

	findSubscriber (subscriberId) {
		return new Promise((resolve, reject) => {
			if (subscriberId === null || subscriberId === undefined) {
				reject(new Error('Argument "subscriberId" is invalid.'));
			} else if (typeof subscriberId !== 'string' || typeof subscriberId === 'string' && subscriberId.length === 0) {
        reject(new Error('Argument "subscriberId" is invalid.'));
			}else {
				resolve(this.subscribers.get(subscriberId));
			}
		});
	}

	findSubscription (subscriptions, symbol) {
		return new Promise((resolve, reject) => {
			if (null === subscriptions || undefined === subscriptions) {
				reject(new Error('Argument "subscriptions" is invalid.'));
			} else if (typeof symbol !== 'string' || typeof symbol === 'string' && symbol.length === 0) {
				reject(new Error('Arugment "symbol" is invalid.'));
			} else {
				resolve(subscriptions.get(symbol.toUpperCase()));
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
			} else if (!quote.isValid){
				reject(new Error("Supplied quote is invalid."));
			} else {
        let rand = Math.ceil(Math.random() * 10),
            moveUp = (rand % 2) === 0,
            size = Math.ceil(Math.random() * 100),
            point = Math.random();
        if (moveUp) {
          resolve(new Quote(quote.symbol, (parseFloat(quote.bid) + point).toFixed(2), size, (parseFloat(quote.ask) + point + 0.05).toFixed(2), size - 1, quote.ask));
        } else {
         resolve(new Quote(quote.symbol, (parseFloat(quote.bid) - point).toFixed(2), size, (parseFloat(quote.ask) - point + 0.05).toFixed(2), size - 1, quote.bid));
        }
			}
		});
  }

}

module.exports = Ticker;