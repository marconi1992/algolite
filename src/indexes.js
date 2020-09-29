const si = require('search-index')
const path = require('path')
const fs = require('fs')
const level = require('level')

const indexes = {}

const initIndex = async (indexName, basePath) => {
  const indexPath = path.join(basePath, indexName)
  const db = await level(indexPath, { valueEncoding: 'json' })
  indexes[indexName] = si({
    store: db
  })
}

module.exports.getIndex = async (indexName, storePath) => {
  const index = indexes[indexName]
  const basePath = path.join(storePath, '.algolite')
  if (!fs.existsSync(basePath)) {
    fs.mkdirSync(basePath)
  }

  if (!index) {
    await initIndex(indexName, basePath)
  }

  return indexes[indexName]
}

module.exports.existIndex = (indexName, storePath) => {
  const basePath = path.join(storePath, '.algolite', indexName)
  return fs.existsSync(basePath)
}

module.exports.initExistingIndexes = async (storePath) => {
  const basePath = path.join(storePath, '.algolite')
  if (!fs.existsSync(basePath)) {
    fs.mkdirSync(basePath)
  }
  const folders = fs.readdirSync(basePath)
  for (const folder of folders) {
    await initIndex(folder, basePath)
  }
}

module.exports.getIndexName = (req) => {
  let { params: { indexName } } = req
  let sortAttribute
  let sortDesc
  /*
     * Hack to get proper sorting
     * Because in Algolia you can sort just by using another replica of index,
     * we try to parse the sorting from index name. We guess that user is using index name in format
     * INDEX_sortFiled_asc or INDEX_sortFiled_desc
     */
  const indexNameSplit = indexName.split('_')
  const indexWordCount = indexNameSplit.length
  if (indexNameSplit[indexWordCount - 1] === 'asc' || indexNameSplit[indexWordCount - 1] === 'desc') {
    indexName = indexNameSplit.slice(0, -2).join('_')
    sortAttribute = indexNameSplit[indexWordCount - 2]
    sortDesc = indexNameSplit[indexWordCount - 1] === 'desc'
  }
  return {
    indexName,
    sortAttribute,
    sortDesc
  }
}

function exitHandler (options) {
  return () => {
    if (options.cleanup) {
      Object.keys(indexes).forEach(indexName => {
        indexes[indexName].INDEX.STORE.close((err) => {
          if (err) console.error(err)
        })
      })
    }
    if (options.exit) process.exit()
  }
}

// do something when app is closing
process.on('exit', exitHandler({ cleanup: true }))

// catches ctrl+c event
process.on('SIGINT', exitHandler({ exit: true }))

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler({ exit: true }))
process.on('SIGUSR2', exitHandler({ exit: true }))

// catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, { exit: true }))
