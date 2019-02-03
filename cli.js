var argv = require('minimist')(process.argv.slice(2))

if (argv.help) {
  console.log([
    '',
    'Usage: algolite [--port <port>] [--path <path>]',
    '',
    'An Algolia REST API Implementation',
    '',
    'Options:',
    '--help                Display this help message and exit',
    '--port <port>         The port to listen on (default: 9200)',
    '--path <path>         The path to use for the LevelDB store (Your project folder)',
    '',
    'Report bugs at github.com/marconi1992/algolite/issues'
  ].join('\n'))
} else {
  const app = require('./')

  const listener = app(argv).listen(argv.port || 9200, '0.0.0.0', () => {
    const address = listener.address()
    console.log('Listening at http://0.0.0.0:%s', address.port)
  })
}
