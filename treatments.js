const mongoose = require("mongoose");

const treatmentSchema = new mongoose.Schema({
    treatment_name: { type: String, required: true, unique: true},
    short_desc: { type: String, required: true },
    long_desc: { type: String, required: true },
    image_url: { type: String, required: true },
  });

module.exports =  mongoose.model("treatments", treatmentSchema);