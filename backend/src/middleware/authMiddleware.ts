import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { AppError } from './errorHandler'
import { ErrorCode } from '../constants/errorCodes'
import { env } from '../env'

interface JwtPayload {
    userId: string
}

declare global {
    namespace Express {
        interface Request {
            userId: string
        }
    }
}

export function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization

    if (!authHeader?.startsWith('Bearer ')) {
        throw new AppError(ErrorCode.UNAUTHORIZED)
    }

    const token = authHeader.split(' ')[1]

    try {
        const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload
        req.userId = payload.userId
        next()
    } catch {
        throw new AppError(ErrorCode.UNAUTHORIZED)
    }
}