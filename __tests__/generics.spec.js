const { getVersionNumberParsed, sumVersioningChanges } = require('../generics')

describe('Generics', () => {
  it('sumVersioningChanges', () => {
    expect(sumVersioningChanges([1,2,3], 'minor')).toBe('1.3.0')
  })
  it('sumVersioningChanges', () => {
    expect(sumVersioningChanges([1,2,3], 'patch')).toBe('1.2.4')
  })
  it('sumVersioningChanges', () => {
    expect(sumVersioningChanges([1,2,3], 'major')).toBe('2.0.0')
  })
})
