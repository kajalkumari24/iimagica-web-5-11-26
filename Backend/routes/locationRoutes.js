import express from "express";
import { getStates, getCitiesByState, addLocation } from "../controllers/locationController.js";

const router = express.Router();

router.get("/states", getStates);
router.get("/cities/:stateName", getCitiesByState);
router.post("/add", addLocation); // to insert new state & cities
// router.post("/seed-from-api", seedFromApi);
export default router;
