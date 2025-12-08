const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  url: { type: String }, // Correspond à votre champ 'url' (image/video)
  description: { type: String },
  startDate: { type: Date, required: true }, // MongoDB gère les dates nativement
  endDate: { type: Date },
  location: { type: String },
  organisateurId: { 
    type: mongoose.Schema.Types.ObjectId, // Lien vers le compte
    ref: 'Compte',
    required: true 
  }
});

// Pour que l'objet JSON renvoyé ait un champ 'id' (string) au lieu de '_id' (object)
EventSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  }
});

module.exports = mongoose.model('Event', EventSchema);