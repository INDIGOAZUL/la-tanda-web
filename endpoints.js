// endpoints.js

const express = require('express');
const router = express.Router();
const { renderEventCard } = require('../js/hub/social-feed.js');
const db = require('../models/db'); // Import your database module

router.post('/api/feed/social/:id/report', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, description } = req.body;

    if (!reason || !description) {
      return res.status(400).json({ message: 'Both reason and description are required.' });
    }

    // Check if the user has already reported this post
    const existingReport = await db.socialReports.findOne({
      where: { event_id: id, reporter_id: req.user.id },
    });

    if (existingReport) {
      return res.status(409).json({ message: 'You have already reported this post.' });
    }

    // Create a new report
    const newReport = await db.socialReports.create({
      event_id: id,
      reporter_id: req.user.id,
      reason,
      description,
      status: 'open',
    });

    res.status(201).json({ message: 'Report submitted successfully.', report: newReport });
  } catch (error) {
    console.error('Error submitting report:', error);
    res.status(500).json({ message: 'Failed to submit report.' });
  }
});

module.exports = router;