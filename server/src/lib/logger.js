// The server's only logger. One line per event, as JSON, to stdout/stderr —
// exactly what a container platform's log collector expects, and searchable
// by `requestId` when a user reports an error. No dependency and no
// `console`: writing straight to the stream is the whole job, and keeps the
// no-console lint rule meaningful for everything else.

function write(stream, level, message, fields) {
  stream.write(JSON.stringify({ level, message, time: new Date().toISOString(), ...fields }) + '\n')
}

export const logger = {
  info: (message, fields) => write(process.stdout, 'info', message, fields),
  error: (message, fields) => write(process.stderr, 'error', message, fields),
}
