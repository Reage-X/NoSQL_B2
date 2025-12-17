import express from "express";
import Event from "../models/Event.js";
import Validator from "validatorjs";

const router = express.Router();

/**
 * POST /events
 * Create an event (media = description)
 */
router.post("/events", async (req, res) => {
  const rules = {
    title: "required|string",
    date: "required|date",
    creator: "required|string"
  };

  const validation = new Validator(req.body, rules);

  if (validation.fails()) {
    return res.status(400).json(validation.errors.all());
  }

  try {
    const event = new Event({
      title: req.body.title,
      description: req.body.description || "",
      date: req.body.date,
      creator: req.body.creator,
      popularity: 0
    });

    await event.save();
    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * =========================
 * GET /events/media
 * Get events that have media (description)
 * =========================
 */
router.get("/events/media", async (req, res) => {
  try {
    const events = await Event.find({
      description: { $exists: true, $ne: "" }
    }).sort({ date: -1 });

    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /events/:id/popularity
 * Increase popularity of an event (media interaction)
 */
router.put("/events/:id/popularity", async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { $inc: { popularity: 1 } },
      { new: true }
    );

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    res.json({
      message: "Popularity updated",
      popularity: event.popularity
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /stats/media-events-by-creator
 * Aggregation: media events statistics by creator
 */
router.get("/stats/media-events-by-creator", async (req, res) => {
  try {
    const stats = await Event.aggregate([
      {
        $match: {
          description: { $exists: true, $ne: "" }
        }
      },
      {
        $group: {
          _id: "$creator",
          mediaEventsCount: { $sum: 1 },
          totalPopularity: { $sum: "$popularity" },
          avgPopularity: { $avg: "$popularity" }
        }
      },
      {
        $sort: { mediaEventsCount: -1 }
      }
    ]);

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
