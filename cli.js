var argv = require('minimist')(process.argv.slice(2))

if (argv.help) {
  console.log([
    '',
    'Usage: algolite [--port <port>]',
    '',
    'A Algolia http server',
    '',
    'Options:',
    '--help                Display this help message and exit',
    '--port <port>         The port to listen on (default: 9200)',
    '--path <port>         The path to use for the LevelDB store (Your project folder)',
    '',
    'Report bugs at github.com/marconi1992/algolite/issues'
  ].join('\n'))
} else {
  const app = require('./')

  const listener = app(argv).listen(argv.port || 9200, () => {
    const address = listener.address()
    console.log('Listening at http://localhost:%s', address.port)
  })
}
