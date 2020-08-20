import express from 'express'

const app = express()
app.use('/', express.static(__dirname))

app.listen(80, () => {
  console.log('Running at Port 80...')
})