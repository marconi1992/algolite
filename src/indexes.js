
const si = require('search-index')
const path = require('path')
const level = require('level')

const indexes = {}

module.exports.getIndex = (indexName, storePath) => {
  const index = indexes[indexName]

  if (!index) {
    indexes[indexName] = si({
      store: level(path.join(storePath, '.algolite', indexName), { valueEncoding: 'json' })
    })
  }

  return indexes[indexName]
}
