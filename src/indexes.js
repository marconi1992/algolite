
const si = require('search-index')
const path = require('path')
const fs = require('fs')
const level = require('level')

const indexes = {}

module.exports.getIndex = (indexName, storePath) => {
  const index = indexes[indexName]
  const basePath = path.join(storePath, '.algolite')
  if (!fs.existsSync(basePath)) {
    fs.mkdirSync(basePath)
  }

  if (!index) {
    indexes[indexName] = si({
      store: level(path.join(basePath, indexName), { valueEncoding: 'json' })
    })
  }

  return indexes[indexName]
}

module.exports.existIndex = (indexName, storePath) => {
  const basePath = path.join(storePath, '.algolite', indexName)

  return fs.existsSync(basePath)
}
