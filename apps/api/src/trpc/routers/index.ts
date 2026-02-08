import {router} from '../index'
import {adminRouter} from './admin'
import {analyticsRouter} from './analytics'
import {audienceRouter} from './audience'
import {campaignRouter} from './campaign'
import {changeRequestRouter} from './changeRequest'
import {customDomainRouter} from './customDomain'
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
import {studioAnalyticsRouter} from './studio-analytics'
import {studioRouter} from './studio'
import {profileRouter} from './profile'

export const appRouter = router({
  admin: adminRouter,
  analytics: analyticsRouter,
  audience: audienceRouter,
  campaign: campaignRouter,
  changeRequest: changeRequestRouter,
  customDomain: customDomainRouter,
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
  studioAnalytics: studioAnalyticsRouter,
  studio: studioRouter,
  profile: profileRouter,
})

// Export type for client
export type AppRouter = typeof appRouter
