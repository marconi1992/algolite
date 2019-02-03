const express = require('express')
const querystring = require('querystring')
const { NotFoundError } = require('level-errors')
const parseAlgoliaSQL = require('./src/parseAlgoliaSQL')
const { getIndex } = require('./src/indexes')

const { v4 } = require('uuid')

const createServer = (options) => {
  const path = options.path || process.cwd()
  const app = express()

  app.use(express.json())

  app.post('/1/indexes/:indexName/query', async (req, res) => {
    const { body, params: { indexName } } = req
    const { params: queryParams } = body

    const db = getIndex(indexName, path)

    const { query, filters } = querystring.parse(queryParams)

    const searchExp = []
    if (query) {
      searchExp.push(query)
    }

    if (filters) {
      searchExp.push(parseAlgoliaSQL(db, filters))
    }

    const result = await db.SEARCH(...searchExp)

    const hits = result.map((item) => {
      const { obj } = item
      obj.objectID = obj._id
      delete obj._id
      return obj
    })
    return res.json({
      hits
    })
  })

  app.post('/1/indexes/:indexName', async (req, res) => {
    const { body, params: { indexName } } = req
    const _id = v4()

    const db = getIndex(indexName, path)
    await db.PUT([{
      _id,
      ...body
    }])

    return res.status(201).json({
      taskID: 'algolite-task-id',
      objectID: _id
    })
  })

  app.put('/1/indexes/:indexName/:objectID', async (req, res) => {
    const { body, params: { indexName } } = req
    const { objectID } = req.params

    const db = getIndex(indexName, path)
    try {
      await db.DELETE([objectID])
    } catch (error) {
      if (!(error instanceof NotFoundError)) {
        res.status(500).end()
      }
    }

    await db.PUT([{
      _id: objectID,
      ...body
    }])

    return res.status(200).json({
      taskID: 'algolite-task-id',
      objectID
    })
  })

  app.delete('/1/indexes/:indexName/:objectID', async (req, res) => {
    const { objectID, indexName } = req.params

    const db = getIndex(indexName, path)
    try {
      await db.DELETE([objectID])
    } catch (error) {
      if (!(error instanceof NotFoundError)) {
        res.status(500).end()
      }
    }

    return res.status(200).json({
      taskID: 'algolite-task-id'
    })
  })

  return app
}

module.exports = createServer
