import mongoose from 'mongoose';

const EventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  date: { type: Date, required: true },
  popularity: { type: Number, default: 0 },
  creator: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Compte',
    required: true 
  }
}, { timestamps: true });

EventSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
  }
});

export default mongoose.model('Event', EventSchema);