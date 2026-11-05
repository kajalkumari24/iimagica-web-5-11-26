import express from "express";
import { createCheckoutOrder, verifyCheckoutPayment } from "../controllers/paymentController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/create-order", authMiddleware, createCheckoutOrder);
router.post("/verify", authMiddleware, verifyCheckoutPayment);

export default router;
