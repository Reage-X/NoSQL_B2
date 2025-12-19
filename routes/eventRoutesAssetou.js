import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import validator from "validator";
import User from "../models/User.js";

const router = express.Router();

function requireAuth(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Token manquant" });
  }

  const token = header.split(" ")[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.auth = payload; // { userId, role }
    return next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Token invalide" });
  }
}
 
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Champs obligatoires manquants (name, email, password).",
      });
    }
    if (!validator.isEmail(email)) {
      return res.status(400).json({ success: false, message: "Email invalide." });
    }
    if (typeof password !== "string" || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Mot de passe trop court (min 6 caractères).",
      });
    }
    // Email unique
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({ success: false, message: "Email déjà utilisé." });
    }
    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role: "user",
    });

    
    const token = jwt.sign(
      { userId: newUser._id.toString(), role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(201).json({
      success: true,
      message: "Compte créé.",
      data: {
        user: {
          _id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
        },
        token,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.put("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    if (!validator.isMongoId(id)) {
      return res.status(400).json({ success: false, message: "ID utilisateur invalide." });
    }
    const isOwner = req.auth.userId === id;
    const isAdmin = req.auth.role === "admin";
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: "Non autorisé." });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, message: "Utilisateur introuvable." });

    const { name, email, password } = req.body;

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({ success: false, message: "Nom invalide." });
      }
      user.name = name.trim();
    }

    if (email !== undefined) {
      if (!validator.isEmail(email)) {
        return res.status(400).json({ success: false, message: "Email invalide." });
      }

      const emailNormalized = email.toLowerCase().trim();
      const emailUsed = await User.findOne({ email: emailNormalized, _id: { $ne: user._id } });
      if (emailUsed) {
        return res.status(409).json({ success: false, message: "Email déjà utilisé." });
      }

      user.email = emailNormalized;
    }

    if (password !== undefined) {
      if (typeof password !== "string" || password.length < 6) {
        return res.status(400).json({
          success: false,
          message: "Mot de passe trop court (min 6 caractères).",
        });
      }
      user.passwordHash = await bcrypt.hash(password, 10);
    }
    await user.save();

    return res.json({
      success: true,
      message: "Compte mis à jour.",
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}); 
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    if (!validator.isMongoId(id)) {
      return res.status(400).json({ success: false, message: "ID utilisateur invalide." });
    }

    const isOwner = req.auth.userId === id;
    const isAdmin = req.auth.role === "admin";
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: "Non autorisé." });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, message: "Utilisateur introuvable." });

    await user.deleteOne();
 
    return res.json({ success: true, message: "Compte supprimé." });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});
router.get("/with-events", requireAuth, async (req, res) => {
  try {
    
    if (req.auth.role !== "admin") {
      return res.status(403).json({ success: false, message: "Accès réservé aux admins." });
    }

    const usersWithEvents = await User.aggregate([
      {
        $lookup: {
          from: "events", 
          localField: "_id", 
          foreignField: "createdBy", 
          as: "events" 
        }
      },
      {
        $match: { "events.0": { $exists: true } } 
      },
      {
        $project: {
          passwordHash: 0
        }
      }
    ]);

    return res.json({ success: true, data: usersWithEvents });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
