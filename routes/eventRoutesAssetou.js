import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import validator from "validator";
import Compte from "../models/Compte.js";
import Event from "../models/Event.js";

const router = express.Router();

// Middleware d'authentification
function requireAuth(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Token manquant" });
  }

  const token = header.split(" ")[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.auth = payload;
    return next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Token invalide" });
  }
}


router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Champs obligatoires manquants (username, email, password).",
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

    const existingUser = await Compte.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({ success: false, message: "Email déjà utilisé." });
    }

    const existingUsername = await Compte.findOne({ username: username.trim() });
    if (existingUsername) {
      return res.status(409).json({ success: false, message: "Nom d'utilisateur déjà utilisé." });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await Compte.create({
      username: username.trim(),
      email: email.toLowerCase().trim(),
      password: passwordHash
    });

    const token = jwt.sign(
      { userId: newUser._id.toString(), email: newUser.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(201).json({
      success: true,
      message: "Compte créé avec succès.",
      data: {
        user: {
          id: newUser._id,
          username: newUser.username,
          email: newUser.email,
          createdAt: newUser.createdAt
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
    if (!isOwner) {
      return res.status(403).json({ success: false, message: "Non autorisé à modifier ce compte." });
    }

    const user = await Compte.findById(id);
    if (!user) return res.status(404).json({ success: false, message: "Utilisateur introuvable." });

    const { username, email, password } = req.body;

    if (username !== undefined) {
      if (typeof username !== "string" || !username.trim()) {
        return res.status(400).json({ success: false, message: "Nom d'utilisateur invalide." });
      }
      
      const trimmedUsername = username.trim();
      if (trimmedUsername !== user.username) {
        const usernameUsed = await Compte.findOne({ 
          username: trimmedUsername, 
          _id: { $ne: user._id } 
        });
        if (usernameUsed) {
          return res.status(409).json({ success: false, message: "Nom d'utilisateur déjà utilisé." });
        }
      }
      user.username = trimmedUsername;
    }

    // Mise à jour de l'email (SECTION CORRIGÉE)
    if (email !== undefined) {
      if (!validator.isEmail(email)) {
        return res.status(400).json({ success: false, message: "Email invalide." });
      }

      const emailNormalized = email.toLowerCase().trim();
      
      if (emailNormalized !== user.email) {
        const emailUsed = await Compte.findOne({ 
          email: emailNormalized, 
          _id: { $ne: user._id } 
        });
        if (emailUsed) {
          return res.status(409).json({ success: false, message: "Email déjà utilisé." });
        }
      }
      user.email = emailNormalized
    }

    // Mise à jour du mot de passe (SECTION CORRIGÉE)
    if (password !== undefined) {
      if (typeof password !== "string" || password.length < 6) {
        return res.status(400).json({
          success: false,
          message: "Mot de passe trop court (min 6 caractères).",
        });
      }
      user.password = await bcrypt.hash(password, 10);
    }

    await user.save();

    const userResponse = user.toJSON();
    delete userResponse.password;

    return res.json({
      success: true,
      message: "Compte mis à jour avec succès.",
      data: userResponse
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
    if (!isOwner) {
      return res.status(403).json({ success: false, message: "Non autorisé à supprimer ce compte." });
    }

    const user = await Compte.findById(id);
    if (!user) return res.status(404).json({ success: false, message: "Utilisateur introuvable." });

    await user.deleteOne();

    return res.json({ 
      success: true, 
      message: "Compte supprimé avec succès.",
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        deletedAt: new Date()
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});


router.get("/with-events", requireAuth, async (req, res) => {
  try {
    const adminEmails = process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',') : [];
    const isAdmin = adminEmails.includes(req.auth.email);
    
    if (!isAdmin) {
      return res.status(403).json({ success: false, message: "Accès réservé aux administrateurs." });
    }

    const usersWithEvents = await Compte.aggregate([
      {
        $lookup: {
          from: "events",
          localField: "_id", 
          foreignField: "creator",
          as: "events" 
        }
      },
      {
        $match: { "events.0": { $exists: true } }
      },
      {
        $project: {
          password: 0,
          __v: 0
        }
      }
    ]);

    return res.json({ 
      success: true, 
      count: usersWithEvents.length,
      data: usersWithEvents 
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});


router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email et mot de passe requis."
      });
    }

    const user = await Compte.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Email ou mot de passe incorrect."
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Email ou mot de passe incorrect."
      });
    }

    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const userResponse = user.toJSON();
    delete userResponse.password;

    return res.json({
      success: true,
      message: "Connexion réussie.",
      data: {
        user: userResponse,
        token
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router