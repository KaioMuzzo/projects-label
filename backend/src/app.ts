import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import hpp from 'hpp'
import { router } from './routes'
import { errorHandler } from './middleware/errorHandler'
import { globalLimiter } from './middleware/rateLimiter'

export const app = express()

app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Authorization', 'Content-Type'],
}))
app.use(hpp())
app.use(globalLimiter)
app.use(express.json({ limit: '10kb' }))
app.use('/api', router)
app.use(errorHandler)
