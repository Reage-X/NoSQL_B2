const mongoose = require('mongoose');

const CompteSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Le hash du mot de passe
  eventIds: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Event' 
  }]
});

CompteSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
    // Sécurité : ne jamais renvoyer le mot de passe, même hashé, au Java
    delete returnedObject.password; 
  }
});

module.exports = mongoose.model('Compte', CompteSchema);