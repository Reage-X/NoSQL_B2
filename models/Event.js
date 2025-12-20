import mongoose from 'mongoose';
const EventSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String 
  },
  startDate: { 
    type: Date, 
    required: true 
  },
  endDate: { 
    type: Date 
  },
  location: { 
    type: String 
  },
  popularity: { 
    type: Number, 
    default: 0 
  },
  organisateurId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Compte',
    required: true 
  },
  participantsId: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Compte' 
  }]
}, { 
  timestamps: true 
});
EventSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
  }
});
const Event = mongoose.model('Event', EventSchema);
export default Event;