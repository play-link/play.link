import {router} from '../index'
import {analyticsRouter} from './analytics'
import {audienceRouter} from './audience'
import {campaignRouter} from './campaign'
import {changeRequestRouter} from './changeRequest'
import {gameRouter} from './game'
import {gameCreditRouter} from './gameCredit'
import {gameLinkRouter} from './gameLink'
import {gameMediaRouter} from './gameMedia'
import {gameUpdateRouter} from './gameUpdate'
import {gamePageRouter} from './gamePage'
import {gameSubscriberRouter} from './gameSubscriber'
import {inviteRouter} from './invite'
import {meRouter} from './me'
import {memberRouter} from './member'
import {orgAnalyticsRouter} from './org-analytics'
import {organizationRouter} from './organization'
import {profileRouter} from './profile'

export const appRouter = router({
  analytics: analyticsRouter,
  audience: audienceRouter,
  campaign: campaignRouter,
  changeRequest: changeRequestRouter,
  game: gameRouter,
  gameCredit: gameCreditRouter,
  gameLink: gameLinkRouter,
  gameMedia: gameMediaRouter,
  gameUpdate: gameUpdateRouter,
  gamePage: gamePageRouter,
  gameSubscriber: gameSubscriberRouter,
  invite: inviteRouter,
  me: meRouter,
  member: memberRouter,
  orgAnalytics: orgAnalyticsRouter,
  organization: organizationRouter,
  profile: profileRouter,
})

// Export type for client
export type AppRouter = typeof appRouter
