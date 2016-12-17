const chai = require('chai');
const expect = chai.expect;

describe('Hi', () => {
  it('should be a string', () => {
    expect('hi').to.be.a('string');
  });
});