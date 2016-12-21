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

  describe('#addObservable', () => {

    let stub = sinon.stub();
    let symbol = 'GOOG';
    let quoter = { getQuote: stub };
    let ticker = null;
    let quote = new Quote(symbol, 10.00, 1, 12.00, 1, 11.00);

    beforeEach(() => {
      ticker = new Ticker(quoter);
    });

    it('should resolve with an observable given a valid quote', () => {
      return ticker.addObservable(quote).then((obs) => {
        expect(obs).to.not.be.null;
      });
    });

    it('should resolve with an observable if one exists with given a valid quote', () => {
      return ticker.addObservable(quote).then(() => {
        return ticker.addObservable(quote).then((obs) => {
          expect(obs).to.not.be.null;
        });
      });
    });

    it('should reject if given quote if null', () => {
      return ticker.addObservable(null).catch((ex) => {
        expect(ex).to.not.be.null;
      });
    });

  });

  describe('#findObservable', () => {
    let stub = sinon.stub();
    let symbol = 'GOOG';
    let quoter = { getQuote: stub };
    let ticker = new Ticker(quoter);
    let obj = { id: 1 };
    ticker.observables.set(symbol, obj);

    it('should resolve with an observable when one exists with the given symbol', () => {

      return ticker.findObservable(symbol).then((result) => {
        expect(result.id).to.equal(obj.id);
      });

    });

    it('should resolve with undefined if an observable is not found for the given symbol', () => {
      return ticker.findObservable('MSFT').then((result) => {
        expect(result).to.be.undefined;
      });
    });

    it('should reject if the given symbol is invalid.', () => {
      return ticker.findObservable('').catch((ex) => {
        expect(ex).to.not.be.null;
      });
    });

  });

  describe('#addSubscriber', () => {
    let stub = sinon.stub();
    let quoter = { getQuote: stub };
    let ticker = null;
    let subscriberId = 'SUB1';

    beforeEach(() => {
      ticker = new Ticker(quoter);
    });

    it('should add a subscriber with the given id', () => {
      return ticker.addSubscriber(subscriberId).then((map) => {
        expect(ticker.subscribers.has(subscriberId));
      });
    });

    it('should resolve with a map', () => {
      return ticker.addSubscriber(subscriberId).then((map) => {
        map.set('hi', 'world');
        expect(map.get('hi')).to.equal('world');
      });
    });

    it('should resolve with a map if the subscriber already exists', () => {
      return ticker.addSubscriber(subscriberId).then(() => {
        return ticker.addSubscriber(subscriberId).then((map) => {
          expect(map).to.not.be.null;
        });
      });
    });

    it('should reject if subscriberid is null', () => {
      return ticker.addSubscriber(null).catch((ex) => {
        expect(ex).to.not.be.null;
      });
    });

  });

  describe('#findSubscriber', () => {
    let stub = sinon.stub();
    let quoter = { getQuote: stub };
    let ticker = new Ticker(quoter);
    let subscriberId = 'SUB1';
    let arr = [{id: 1}];
    ticker.subscribers.set(subscriberId, arr);

    it('should resolve with a result when a subscriber exists with given subscriberId', () => {

      return ticker.findSubscriber(subscriberId).then((result) => {
        expect(result[0].id).to.equal(arr[0].id);
      });

    });

    it('should resolve with undefined a subscriber is not found given symbol', () => {
      return ticker.findSubscriber('NOTHERE').then((result) => {
        expect(result).to.be.undefined;
      });
    });

    it('should reject if the given symbol is null.', () => {
      return ticker.findSubscriber(null).catch((ex) => {
        expect(ex).to.not.be.null;
      });
    });

    it('should reject if the given symbol is an empty string.', () => {
      return ticker.findSubscriber('').catch((ex) => {
        expect(ex).to.not.be.null;
      });
    });

  });

  describe('#findSubscription', () => {
    let stub = sinon.stub();
    let quoter = { getQuote: stub };
    let ticker = new Ticker(quoter);
    let subscriptions = new Map();
    subscriptions.set('KEY', { id: 'value' });

    it('should resolve with a result when a subscription exists with given key', () => {

      return ticker.findSubscription(subscriptions, 'KEY').then((result) => {
        expect(result.id).to.equal('value');
      });

    });

    it('should resolve with undefined a subscriber is not found given symbol', () => {
      return ticker.findSubscription(subscriptions, 'NOTHERE').then((result) => {
        expect(result).to.be.undefined;
      });
    });

    it('should reject if the given subscriptions is null', () => {
      return ticker.findSubscription(null, 'KEY').catch((ex) => {
        expect(ex).to.not.be.null;
      });
    })

    it('should reject if the given symbol is null.', () => {
      return ticker.findSubscription(subscriptions, null).catch((ex) => {
        expect(ex).to.not.be.null;
      });
    });

    it('should reject if the given symbol is an empty string.', () => {
      return ticker.findSubscription(subscriptions, '').catch((ex) => {
        expect(ex).to.not.be.null;
      });
    });

  });

  /*

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

  });
  */
});

