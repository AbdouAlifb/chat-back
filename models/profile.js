const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
    clientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'client',
        required: true,
        unique: true
    },
    nationalCardCode: { type: String, default: null },
    phoneNumber: { type: String, default: null },
    birthday: { type: Date, default: null },
    additionalDetails: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });

module.exports = mongoose.model('profile', profileSchema);
