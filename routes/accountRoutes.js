import express from "express";
import { verifyToken } from "../middlewares/authMiddleware.js";

import {
  getBalance,
  getStatement,
  transferMoney,
  getUsers
} from "../controllers/accountController.js";

const router = express.Router();

router.get("/balance", verifyToken, getBalance);
router.get("/statement", verifyToken, getStatement);
router.post("/transfer", verifyToken, transferMoney);
router.get("/users", verifyToken, getUsers);

export default router;