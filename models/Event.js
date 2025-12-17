import mongoose from 'mongoose';

const EventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
<<<<<<< HEAD
  startDate: { type: Date, required: true }, // MongoDB gère les dates nativement
  endDate: { type: Date },
  location: { type: String },
  populate: { type: Boolean, default: false },
  organisateurId: { 
    type: mongoose.Schema.Types.ObjectId, // Lien vers le compte
    ref: 'Compte',
    required: true 
  },
  participantsId: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Compte' 
  }]
});
=======
  date: { type: Date, required: true },
  popularity: { type: Number, default: 0 },
  creator: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Compte',
    required: true 
  }
}, { timestamps: true });
>>>>>>> 7bbd7959251b4d683dfb7d73128c145c3ce0e23e

EventSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
  }
});

export default mongoose.model('Event', EventSchema);