const si = require('search-index')
const path = require('path')
const fs = require('fs')
const level = require('level')

const indexes = {}

const initIndex = async (basePath, indexName) => {
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
    await initIndex(indexName)
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
    await initIndex(basePath, folder)
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
