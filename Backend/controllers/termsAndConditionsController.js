import TermsAndConditions from "../models/TermsAndConditions.js";
import { apiResponse } from "../utils/apiResponse.js";


// Get Terms and Conditions (Public)

export const getTermsAndConditions = async (req, res) => {
  try {

    const terms = await TermsAndConditions
      .findOne()
      .sort({ createdAt: -1 });


    if (!terms) {
      return apiResponse(
        res,
        404,
        "Terms and Conditions not found"
      );
    }


    return apiResponse(
      res,
      200,
      "Terms and Conditions fetched successfully",
      terms
    );


  } catch (error) {

    return apiResponse(
      res,
      500,
      "Server error",
      {
        error: error.message
      }
    );

  }
};



// Create or Update Terms (Admin)

export const createOrUpdateTermsAndConditions = async (
  req,
  res
) => {

  try {

    const { content } = req.body;


    if (!content) {
      return apiResponse(
        res,
        400,
        "Content is required"
      );
    }



    let terms = await TermsAndConditions.findOne();



    if (terms) {

      terms.content = content;

    } else {

      terms = new TermsAndConditions({
        content
      });

    }



    await terms.save();



    return apiResponse(
      res,
      200,
      "Terms and Conditions updated successfully",
      terms
    );


  } catch(error) {


    return apiResponse(
      res,
      500,
      "Server error",
      {
        error:error.message
      }
    );

  }

};