import { Router } from 'express'
import { infraRoutes } from './features/infra/routes' 

export const router = Router()

router.use('/infra', infraRoutes)
