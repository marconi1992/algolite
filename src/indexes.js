
const si = require('search-index')
const path = require('path')
const level = require('level')

const indices = {}

module.exports.getIndex = (indexName, storePath) => {
  const index = indices[indexName]

  if (!index) {
    indices[indexName] = si({
      store: level(path.join(storePath, '.algolite', indexName), { valueEncoding: 'json' })
    })
  }

  return indices[indexName]
}
