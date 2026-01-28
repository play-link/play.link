import {router} from '../index'
import {changeRequestRouter} from './changeRequest'
import {gameRouter} from './game'
import {gameCreditRouter} from './gameCredit'
import {inviteRouter} from './invite'
import {meRouter} from './me'
import {memberRouter} from './member'
import {organizationRouter} from './organization'
import {profileRouter} from './profile'

export const appRouter = router({
  changeRequest: changeRequestRouter,
  game: gameRouter,
  gameCredit: gameCreditRouter,
  invite: inviteRouter,
  me: meRouter,
  member: memberRouter,
  organization: organizationRouter,
  profile: profileRouter,
})

// Export type for client
export type AppRouter = typeof appRouter
