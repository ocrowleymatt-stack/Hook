import express from "express";
import { retryJob, cancelJob, boostPriority, getQueueState } from "../jobs/control.js";

const router = express.Router();

router.get("/queue", (req, res) => {
  res.json(getQueueState());
});

router.post("/job/:id/retry", (req, res) => {
  try {
    const job = retryJob(req.params.id);
    res.json(job);
  } catch (e: any) {
    res.status(404).json({ error: e.message });
  }
});

router.post("/job/:id/cancel", (req, res) => {
  try {
    const job = cancelJob(req.params.id);
    res.json(job);
  } catch (e: any) {
    res.status(404).json({ error: e.message });
  }
});

router.post("/job/:id/boost", (req, res) => {
  try {
    const job = boostPriority(req.params.id);
    res.json(job);
  } catch (e: any) {
    res.status(404).json({ error: e.message });
  }
});

export default router;
