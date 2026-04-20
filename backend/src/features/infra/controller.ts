import { RequestHandler } from 'express'
import { asyncHandler } from '../../middleware/asyncHandler'
import { checkDatabase } from './service'

export const getHealth: RequestHandler = asyncHandler(async (_req, res) => {
    await checkDatabase()
    res.status(200).json({ status: 'ok' })
})