import mongoose from "mongoose";

const citySchema = new mongoose.Schema({
  name: { type: String, required: true },
});

const locationSchema = new mongoose.Schema({
  state: { type: String, required: true },
  cities: [citySchema], // array of city objects
});

const Location = mongoose.model("Location", locationSchema);

export default Location;
