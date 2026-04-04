
const mongoose = require('mongoose');

const clinicDetailsSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  imageUrl: { type: String, required: true },
  opdHours: [
    {
      day: { type: String, required: true },
      opening_time: { type: String, required: true },
      closing_time: { type: String, required: true }
    }
  ]
});

module.exports = mongoose.model('ClinicDetails', clinicDetailsSchema);
