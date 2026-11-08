
import { Router } from "express";

import {
  getAllResults,
  getAdminResultDetail
} from "../controllers/admin-result.controller.js";

import {
  requireAuth,
  requireRole
} from "../middlewares/auth.middleware.js";

const router = Router();

router.use(requireAuth, requireRole("ADMIN"));

router.get("/", getAllResults);
router.get("/:id", getAdminResultDetail);

export default router;
