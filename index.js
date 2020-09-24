const express = require('express')
const querystring = require('querystring')
const parseAlgoliaSQL = require('./src/parseAlgoliaSQL')
const { getIndex, existIndex } = require('./src/indexes')

const { v4 } = require('uuid')

const createServer = (options) => {
  const path = options.path || process.cwd()
  const app = express()

  app.use(express.json())

  app.post('/1/indexes/:indexName/query', async (req, res) => {
    const { body, params: { indexName } } = req
    const { params: queryParams } = body

    const db = getIndex(indexName, path)

    const { query, filters, facetFilters, page = 0, hitsPerPage = 20 } = queryParams ? querystring.parse(queryParams) : body

    const searchExp = []
    if (query !== undefined) {
      searchExp.push(!query ? '*' : query)
    }

    if (filters) {
      searchExp.push(parseAlgoliaSQL(db, filters))
    }

    if (facetFilters) {
      searchExp.push(parseAlgoliaSQL(db, facetFilters.map(f => Array.isArray(f) ? `(${f.join(' OR ')})` : f).join(' AND ')))
    }

    const result = await db.SEARCH(...searchExp)
    const nbHits = result.length;
    const nbPages = Math.floor(nbHits / (page + 1))

    const hits = result.map((item) => {
      const { obj } = item
      obj.objectID = obj._id
      delete obj._id
      return obj
    })

    const from = (page * hitsPerPage);
    const end = from + hitsPerPage;

    return res.json({
      hits: hits.slice(from, end),
      params: queryParams || '',
      query: query || '',
      page,
      nbHits,
      nbPages,
      hitsPerPage,
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
      createdAt: (new Date()).toISOString(),
      taskID: 'algolite-task-id',
      objectID: _id
    })
  })

  app.post('/1/indexes/:indexName/batch', async (req, res) => {
    const { body, params: { indexName } } = req
    const puts = []
    const deletes = []

    for (const request of body.requests) {
      switch (request.action) {
        case 'updateObject':
          request.body._id = request.body.objectID
          delete request.body.objectID
          puts.push(request.body)
          break

        case 'deleteObject':
          deletes.push(request.body.objectID)
          break

        default:
          // not supported
          return res.status(400).end()
      }
    }

    const db = getIndex(indexName, path)
    if (puts.length) {
      await db.PUT(puts)
    }
    if (deletes.length) {
      await db.DELETE(deletes)
    }

    return res.status(201).json({
      taskID: 'algolite-task-id',
      objectIDs: body.requests.map(r => r.body.objectID)
    })
  })

  app.put('/1/indexes/:indexName/:objectID', async (req, res) => {
    const { body, params: { indexName } } = req
    const { objectID } = req.params

    const db = getIndex(indexName, path)
    try {
      await db.DELETE([objectID])
    } catch (error) {
      if (!error.notFound) {
        return res.status(500).end()
      }
    }

    await db.PUT([{
      _id: objectID,
      ...body
    }])

    return res.status(201).json({
      updatedAt: (new Date()).toISOString(),
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
      if (!error.notFound) {
        res.status(500).end()
      }
    }

    return res.status(200).json({
      deletedAt: (new Date()).toISOString(),
      taskID: 'algolite-task-id',
      objectID
    })
  })

  app.post('/1/indexes/:indexName/deleteByQuery', async (req, res) => {
    const { body, params: { indexName } } = req
    const { params: queryParams } = body

    const { facetFilters } = querystring.parse(queryParams)

    const db = getIndex(indexName, path)

    const searchExp = []
    if (facetFilters) {
      searchExp.push(parseAlgoliaSQL(db, facetFilters))
    }

    if (searchExp.length === 0) {
      return res.status(400).json({
        message: 'DeleteByQuery endpoint only supports tagFilters, facetFilters, numericFilters and geoQuery condition',
        status: 400
      })
    }

    const result = await db.SEARCH(...searchExp)
    const ids = result.map(obj => obj._id)
    await db.INDEX.DELETE(ids)

    return res.status(201).json({
      updatedAt: (new Date()).toISOString(),
      taskID: 'algolite-task-id'
    })
  })

  app.post('/1/indexes/:indexName/clear', async (req, res) => {
    const { indexName } = req.params

    if (!existIndex(indexName, path)) {
      return res.status(400).end()
    }

    const db = getIndex(indexName, path)
    const result = await db.INDEX.GET('')
    const ids = result.map(obj => obj._id)
    await db.INDEX.DELETE(ids)

    return res.status(200).json({
      taskID: 'algolite-task-id'
    })
  })

  return app
}

module.exports = createServer
