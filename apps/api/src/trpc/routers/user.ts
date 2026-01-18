import {protectedProcedure, router} from '../index'

export const userRouter = router({
  /**
   * Get current user profile
   */
  me: protectedProcedure.query(({ctx}) => {
    return {
      id: ctx.user.id,
      email: ctx.user.email,
    }
  }),
})
