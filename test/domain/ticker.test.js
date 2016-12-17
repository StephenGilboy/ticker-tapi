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
  let quoter = {
    getQuote(symbol) {}
  };

  it('should have a default timer of 1 second', () => {
    let ticker = new Ticker(quoter);
    expect(ticker.updateFrequency).to.equals(1000);
  });

  describe('#getQuote', () => {

    it('should return a valid quote if given a valid symbol', (done) => {
      let stub = sinon.stub();
      let symbol = 'GOOG';
      let quoter = { getQuote: stub };
      let ticker = new Ticker(quoter);
      stub.resolves(new Quote(symbol, 10, 1, 12, 1, 11));

      expect(ticker.getQuote(symbol)).to.eventually.have.property('isValid').that.is.true.and.notify(done);
    });

    it('should return null if given an invalid symbol', (done) => {
      let stub = sinon.stub();
      let symbol = '';
      let quoter = { getQuote: stub };
      let ticker = new Ticker(quoter);
      stub.resolves(null);

      expect(ticker.getQuote(symbol)).to.eventually.be.null.and.notify(done);
    });
  });
});

