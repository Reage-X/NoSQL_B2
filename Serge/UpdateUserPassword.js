import express from 'express';
import Compte from '../models/Compte.js';
import bcrypt from 'bcrypt';

const router = express.Router();

router.put('/:id/password', async (req, res) => {
  try {
    const { id } = req.params;
    const { oldPassword, newPassword } = req.body;

    const user = await Compte.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "Utilisateur non trouvé" });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "L'ancien mot de passe est incorrect." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Mot de passe modifié avec succès."
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;