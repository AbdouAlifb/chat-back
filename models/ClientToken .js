const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const clientTokenSchema = new Schema({
  clientId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "client",
  },
  token: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 3600, // Expires in 1 hour
  },
});

module.exports = mongoose.model("ClientToken", clientTokenSchema);
