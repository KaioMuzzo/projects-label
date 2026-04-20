import express from 'express'
import { router } from './routes'
import { errorHandler } from './middleware/errorHandler'
import { globalLimiter } from './middleware/rateLimiter'

export const app = express()

app.use(express.json())
app.use(globalLimiter)
app.use('/api', router)
app.use(errorHandler)
