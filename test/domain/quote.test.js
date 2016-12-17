const path = require('path');
const chai = require('chai');
const Quote = require(path.join(__dirname, '../../src/domain/quote'));
const expect = chai.expect;

describe('Quote', () => {

  it('should be valid given valid parameters', () => {
    let quote = new Quote('MSFT', 10, 1, 12, 2, 11);
    expect(quote.isValid).to.be.true;
  });

  it('should be invalid given an empty symbol', () => {
    let quote = new Quote('', 10, 1, 12, 2, 11);
    expect(quote.isValid).to.be.false;
  });

  it('should be invalid given a negative bid', () => {
    let quote = new Quote('MSFT', -10, 1, 12, 2, 11);
    expect(quote.isValid).to.be.false;
  });

  it('should be invalid given a negative bid size ', () => {
    let quote = new Quote('MSFT', 10, -1, 12, 2, 11);
    expect(quote.isValid).to.be.false;
  });

  it ('should be invalid given a negative ask', () => {
    let quote = new Quote('MSFT', 10, 1, -12, 2, 11);
    expect(quote.isValid).to.be.false;
  });

  it('should be invalid given a negative ask size', () => {
    let quote = new Quote('MSFT', 10, 1, 12, -2, 11);
    expect(quote.isValid).to.be.false;
  })

  it('should be invalid given a negative last', () => {
    let quote = new Quote('MSFT', 10, 1, 12, 2, -11);
    expect(quote.isValid).to.be.false;
  });

});