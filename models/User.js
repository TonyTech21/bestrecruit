const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  password: {
    type: String,
    minlength: 6
  },
  preferredCountry: {
    type: String,
    required: true
  },
  experience: {
    type: String,
    enum: ['0-2', '2-5', '5-10', '10+'],
    default: '0-2'
  },
  education: {
    type: String,
    enum: ['High School', 'Bachelor', 'Master', 'PhD'],
    default: 'Bachelor'
  },
  profession: {
    type: String,
    trim: true
  },
  linkedin: {
    type: String,
    trim: true
  },
  relocationReadiness: {
    type: String,
    enum: ['Immediately', 'Within 3 months', 'Within 6 months', 'Within 1 year'],
    default: 'Within 6 months'
  },
  documents: [{
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  applicationStatus: {
    type: String,
    enum: ['New', 'In Review', 'Documents Received', 'Interview Scheduled', 'Visa Approved', 'Rejected'],
    default: 'New'
  },
  statusHistory: [{
    status: String,
    date: {
      type: Date,
      default: Date.now
    },
    notes: String
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  sessionId: {
    type: String,
    unique: true
  },
  profilePicture: {
    type: String
  }
}, {
  timestamps: true
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  if (this.password) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);