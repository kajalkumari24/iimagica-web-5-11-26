import Plan from "../models/Plan.js";

export const createPlan = async (req, res) => {
  try {
    const {
      name,
      price,
      duration,
      icon,
      features,
      link,
      planType,
      billing,
    } = req.body;

    const plan = await Plan.create({
      name,
      price,
      duration,
      icon,
      features,
      link,
      planType,
      billing,
    });

    res.status(201).json({
      success: true,
      message: "Plan created",
      plan,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getPlans = async (req, res) => {
  try {
    const includeInactive = req.query.admin === "1";
    const filter = includeInactive ? {} : { isActive: true };
    const plans = await Plan.find(filter).sort({ createdAt: -1 });
    res.status(200).json(plans);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getSinglePlan = async (req, res) => {
  try {
    const plan = await Plan.findById(req.params.id);

    if (!plan) {
      return res.status(404).json({ message: "Plan not found" });
    }

    res.json(plan);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updatePlan = async (req, res) => {
  try {
    const updated = await Plan.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    res.json({
      success: true,
      message: "Plan updated",
      updated,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deletePlan = async (req, res) => {
  try {
    await Plan.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Plan deleted",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
