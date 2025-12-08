import express from 'express';
import Compte from '../models/Compte.js';
import bcrypt from 'bcrypt';

const router = express.Router();



router.put('/:id/username', async (req, res) => {
  try {
    const { id } = req.params;
    const { newUsername, password } = req.body;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ success: false, message: "ID invalide" });
    }

    const user = await Compte.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "Utilisateur non trouvé" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: "Mot de passe incorrect, modification refusée." });
    }

    if (newUsername !== user.username) {
        const existingUser = await Compte.findOne({ username: newUsername });
        if (existingUser) {
            return res.status(409).json({ success: false, message: "Ce nom d'utilisateur est déjà pris." });
        }
    }

    user.username = newUsername;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Nom d'utilisateur mis à jour avec succès",
      data: { username: user.username }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;