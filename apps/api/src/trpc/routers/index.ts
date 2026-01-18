import {router} from '../index'
import {organizationRouter} from './organization'
import {userRouter} from './user'

export const appRouter = router({
  organization: organizationRouter,
  profile: userRouter,
})

// Export type for client
export type AppRouter = typeof appRouter
