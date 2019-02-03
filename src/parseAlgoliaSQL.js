const { Parser } = require('node-sql-parser')

const parser = new Parser()

const buildSearchExpression = (rule, db) => {
  const { OR, AND } = db
  const { operator, left, right } = rule
  if (operator === '=') {
    return `${left.column}:${right.column}`
  } else if (operator === 'OR') {
    const leftExpression = buildSearchExpression(left, db)
    const rightExpression = buildSearchExpression(right, db)
    return OR(leftExpression, rightExpression)
  } else if (operator === 'AND') {
    const leftExpression = buildSearchExpression(left, db)
    const rightExpression = buildSearchExpression(right, db)
    return AND(leftExpression, rightExpression)
  }
}

module.exports = (db, sql) => {
  let sqlToProcess = sql
  sqlToProcess = sqlToProcess.replace(/:/g, '=')
  sqlToProcess = `SELECT * FROM algolia WHERE ${sqlToProcess}`

  const ast = parser.sqlToAst(sqlToProcess)

  return buildSearchExpression(ast.where, db)
}
