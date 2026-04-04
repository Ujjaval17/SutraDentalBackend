const mongoose = require("mongoose");

const blogSchema = new mongoose.Schema({
    title: { type: String, required: true, unique: true},
    short_desc: { type: String, required: true },
    long_desc: { type: String, required: true },
    image_url: { type: String, required: true },
    date: { type: String, required:true },
  });

module.exports =  mongoose.model("blogs", blogSchema);