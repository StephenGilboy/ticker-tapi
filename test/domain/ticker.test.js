const path = require('path');
const chai = require('chai');
const asPromised = require('chai-as-promised');
const sinon = require('sinon');
const sinonAsPromised = require('sinon-as-promised');
const expect = chai.expect;
const Quote = require(path.join(__dirname, '../../src/domain/quote'));
const Ticker = require(path.join(__dirname, '../../src/domain/ticker'));
chai.use(asPromised);

describe('Ticker', () => {

  it('should have a default timer of 1 second', () => {
    let ticker = new Ticker({});
    expect(ticker.updateFrequency).to.equals(1000);
  });

  describe('#getQuote', () => {


    it('should return a valid quote if given a valid symbol', () => {
      let stub = sinon.stub();
      let symbol = 'GOOG';
      let quoter = { getQuote: stub };
      let ticker = new Ticker(quoter);
      stub.resolves(new Quote(symbol, 10, 1, 12, 1, 11));

      return ticker.getQuote(symbol).then((quote) => {
        expect(quote.isValid).to.be.true;
      });
    });

    it('should return null if given an invalid symbol', () => {
      let stub = sinon.stub();
      let symbol = '';
      let quoter = { getQuote: stub };
      let ticker = new Ticker(quoter);
      stub.resolves(null);

      return ticker.getQuote(symbol).then((quote) => {
        expect(quote).to.be.null;
      });
    });
  });

  describe('#findSubscription', () => {

    it('should resolve with a subscription when one exists with the given symbol', () => {

    });

    it('should reject if a subscription does not exist with the given symbol.', () => {

    })

  });

  describe('#subscribe', () => {

    describe('success', () => {
      let stub = sinon.stub();
      let symbol = 'GOOG';
      stub.resolves(new Quote(symbol, 10.00, 1, 12.00, 1, 11.00));
      let quoter = { getQuote: stub };
      let ticker = null;

      beforeEach(() => {
        ticker = new Ticker(quoter);
      });

      it('should create a new subscription when symbol has not been subscribed to', () => {
        return ticker.subscribe(symbol).then(() => {
          expect(ticker.subscriptions.length).to.equal(1);
        });
      });

      it('should create a subscription with a single subscriber', () => {
        return ticker.subscribe(symbol).then(() => {
          if (ticker.subscriptions.length) {
            expect(ticker.subscriptions[0].numberOfSubscribers).to.equal(1);
          } else {
            chai.fail();
          }
        });
      });

      it('should create a subscription with the symbol given.', () => {
        return ticker.subscribe(symbol).then(() => {
          if (ticker.subscriptions.length) {
            expect(ticker.subscriptions[0].symbol).to.equal(symbol);
          } else {
            chai.fail();
          }
        });
      });

      it('should create a subscription that has subscribers.', () => {
        return ticker.subscribe(symbol).then(() => {
          if (ticker.subscriptions.length) {
            expect(ticker.subscriptions[0].hasSubscribers()).to.be.true;
          } else {
            chai.fail();
          }
        });
      });

      it('should increment the number of subscribers when a subscription for the given symbol exists', () => {
        return ticker.subscribe(symbol).then(() => {
          return ticker.subscribe(symbol).then(() => {
            if (ticker.subscriptions.length) {
              expect(ticker.subscriptions[0].numberOfSubscribers).to.equal(2);
            } else {
              chai.fail();
            }
          });
        });
      });

    });

    it('should reject creation when given an invalid stock symbol', () => {
      let stub = sinon.stub();
      let symbol = '';
      stub.rejects(new Error("INVALID"));
      let quoter = { getQuote: stub };
      let ticker = new Ticker(quoter);
      return ticker.subscribe(symbol).then(() => {
      }, (err) => {
        expect(err).to.not.be.null;
      });
    });

  });

  describe('#unsubscribe', () => {
    it('should decrement the number of subscribers for the given symbol', () => {
      let stub = sinon.stub();
      let symbol = 'GOOG';
      stub.resolves(new Quote(symbol, 10.00, 1, 12.00, 1, 11.00));
      let quoter = { getQuote: stub };
      let ticker = new Ticker(quoter);
      return ticker.subscribe(symbol).then(() => {
        return ticker.subscribe(symbol).then(() => {
          return ticker.unsubscribe(symbol).then(() => {
            expect(ticker.subscriptions.length).to.equal(1);
            if(ticker.subscriptions.length) {
              let sub = ticker.subscriptions[0];
              expect(sub.numberOfSubscribers).to.equal(1);
            }
          });
        });
      });
    });

    it('should remove the subscription if it removed the last subscriber', () => {
      let stub = sinon.stub();
      let symbol = 'GOOG';
      stub.resolves(new Quote(symbol, 10.00, 1, 12.00, 1, 11.00));
      let quoter = { getQuote: stub };
      let ticker = new Ticker(quoter);
      return ticker.subscribe(symbol).then(() => {
        return ticker.unsubscribe(symbol).then(() => {
          expect(ticker.subscriptions.length).to.equal(0);
        });
      });
    });

  })
});

