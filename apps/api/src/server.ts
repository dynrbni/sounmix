import { app } from './app.js'
import { config } from './config/env.js'

app.listen(config.port, () => {
  console.log(`Sounmix API listening on port ${config.port}`)
})
