const path = require('path');
const chai = require('chai');
const asPromised = require('chai-as-promised');
const expect = chai.expect;
const GoogleQuoter = require(path.join(__dirname, '../../src/infrastructure/externalQuoters')).Google;
chai.use(asPromised);

describe('Google Quoter', () => {
  let quoter = null;
  beforeEach(() => {
    quoter = new GoogleQuoter();
  });

  it('should have a valid endpoint', () => {
    expect(quoter.endpoint).to.equal('http://finance.google.com/finance/info?client=ig&q=NASDAQ%3A');
  });

  it('should return a Quote given a valid symbol', () => {
    let symbol = 'GOOG';
    return quoter.getQuote(symbol).then((quote) => {
      expect(quote.isValid).to.be.true;
    });
  });

  it('should reject given an invalid symbol', () => {
    let symbol = 'XEOW';
    return quoter.getQuote(symbol).then((quote) => {
    }, (err) => {
      expect(err).to.not.be.null;
    });
  });

  it('should reject given an empty string argument', () => {
    let symbol = '';
    return quoter.getQuote(symbol).then((quote) => {
    }, (err) => {
      expect(err).to.not.be.null;
    });
  });

});