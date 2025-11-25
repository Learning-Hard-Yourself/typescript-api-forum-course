import type { Express } from 'express'

import { AttachmentRoutes } from '@/routes/attachments'
import { AuthRoutes } from '@/routes/auth'
import { CategoryRoutes } from '@/routes/categories'
import { HealthRoutes } from '@/routes/health'
import { NotificationRoutes } from '@/routes/notifications'
import { PostRoutes } from '@/routes/posts'
import { ProfileRoutes } from '@/routes/profiles'
import { ThreadRoutes } from '@/routes/threads'
import type { ApplicationDependencies } from '@/routes/types'
import { UserRoutes } from '@/routes/users'
import { VoteRoutes } from '@/routes/votes'

export const registerRoutes = (server: Express, dependencies: ApplicationDependencies): void => {
  new HealthRoutes().map(server)
  new AuthRoutes(dependencies).map(server)
  new UserRoutes(dependencies).map(server)
  new ProfileRoutes(dependencies).map(server)
  new CategoryRoutes(dependencies).map(server)
  new ThreadRoutes(dependencies).map(server)
  new PostRoutes(dependencies).map(server)
  new AttachmentRoutes(dependencies).map(server)
  new VoteRoutes(dependencies).map(server)
  new NotificationRoutes(dependencies).map(server)
}
