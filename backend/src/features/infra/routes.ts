import { Router } from 'express'
import { getHealth } from './controller'

export const infraRoutes = Router()

infraRoutes.get('/health', getHealth)
