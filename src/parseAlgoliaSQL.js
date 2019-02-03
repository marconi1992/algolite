const parser = require('../algoliaDSLParser')

const buildSearchExpression = (rule, db) => {
  const { OR, AND } = db
  const { token, key, value, left, right } = rule
  if (token === 'MATCH') {
    return `${key}:${value.value}`
  } else if (token === 'OR') {
    const leftExpression = buildSearchExpression(left, db)
    const rightExpression = buildSearchExpression(right, db)
    return OR(leftExpression, rightExpression)
  } else if (token === 'AND') {
    const leftExpression = buildSearchExpression(left, db)
    const rightExpression = buildSearchExpression(right, db)
    return AND(leftExpression, rightExpression)
  }
}

module.exports = (db, sql) => {
  const ast = parser.parse(sql)

  return buildSearchExpression(ast, db)
}
