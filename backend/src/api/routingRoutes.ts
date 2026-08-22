import { Router } from 'express';
import { RoutingController } from '../controllers/routingController.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export const routingRouter = Router();

routingRouter.get('/graph', asyncHandler(RoutingController.getGraph));
routingRouter.get('/user-state', requireAuth, asyncHandler(RoutingController.getUserState));
routingRouter.get('/nodes/:id/content', asyncHandler(RoutingController.getNodeContent));
routingRouter.post('/evaluate', requireAuth, asyncHandler(RoutingController.evaluate));
