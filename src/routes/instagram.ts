import express from 'express';

import * as instagram from '../controllers/instagram.js';

const router = express.Router();

router.get('/feed', instagram.getFeeds);

export default router;
