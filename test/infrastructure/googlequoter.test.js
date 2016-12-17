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

  it('should return a Quote given a valid symbol', (done) => {
    let symbol = 'GOOG';
    expect(quoter.getQuote(symbol)).to.eventually.have.property('isValid').that.is.true.and.notify(done);
  });

  it('should return null given an invalid symbol', (done) => {
    let symbol = '';
    expect(quoter.getQuote(symbol)).to.eventually.be.null.and.notify(done);
    done();
  });

});