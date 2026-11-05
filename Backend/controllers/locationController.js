import Location from "../models/Location.js";


// ✅ Get all states
export const getStates = async (req, res) => {
  try {
    const states = await Location.find().select("state -_id");
    const stateNames = states.map((s) => s.state);
    res.json(stateNames);
  } catch (error) {
    res.status(500).json({ message: "Error fetching states", error });
  }
};

// ✅ Get cities by state
export const getCitiesByState = async (req, res) => {
  try {
    const { stateName } = req.params;
    const state = await Location.findOne({ state: stateName });

    if (!state) {
      return res.status(404).json({ message: "State not found" });
    }

    const cityNames = state.cities.map((c) => c.name);
    res.json(cityNames);
  } catch (error) {
    res.status(500).json({ message: "Error fetching cities", error });
  }
};

// ✅ Add new state with cities (optional: for inserting data)
export const addLocation = async (req, res) => {
  try {
    const { state, cities } = req.body;

    const newLocation = new Location({
      state,
      cities: cities.map((city) => ({ name: city })),
    });

    await newLocation.save();
    res.status(201).json({ message: "Location added successfully", newLocation });
  } catch (error) {
    res.status(500).json({ message: "Error adding location", error });
  }
};
