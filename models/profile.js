const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
    clientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'client',
        required: true,
        unique: true
    },
    nationalCardCode: { type: String, required :false },
    phoneNumber: { type: String, required :false },
    birthday: { type: Date, required :false },
    additionalDetails: [
        {
          name: { type: String, required: true },
          value: { type: String, required: true },
        },
      ],
},
{ timestamps: true, strict: false }
);

module.exports = mongoose.model('profile', profileSchema);
