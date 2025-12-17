import express from 'express';
import Compte from '../models/Compte.js';

const router = express.Router();


router.post('/check-username', async (req, res) => {
  try {
    const { username } = req.body;

    const user = await Compte.findOne({ username: username });

    if (user) {
      return res.status(200).json({ 
        success: true, 
        exists: true, 
        message: "Ce nom d'utilisateur est déjà utilisé." 
      });
    } else {
      return res.status(200).json({ 
        success: true, 
        exists: false, 
        message: "Ce nom d'utilisateur est disponible." 
      });
    }

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;