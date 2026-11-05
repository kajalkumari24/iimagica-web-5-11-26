import React, { useEffect, useState } from "react";
import axios from "../axiosConfig";
import { toast } from "react-toastify";


const TermsAndConditionsAdmin = () => {

  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);


  useEffect(() => {

    fetchTerms();

  }, []);



  const fetchTerms = async () => {

    try {

      const response = await axios.get(
        "/api/terms-and-conditions"
      );


      setContent(
        response.data?.data?.content || ""
      );


    } catch(error) {

      // console.log(error);

      toast.error(
        "Failed to load terms"
      );

    }

  };





  const saveTerms = async () => {


    try {

      setLoading(true);


      await axios.post(
        "/api/terms-and-conditions",
        {
          content
        },
        {
          withCredentials:true
        }
      );


      toast.success(
        "Terms & Conditions updated"
      );


    } catch(error) {


      // console.log(error);

      toast.error(
        "Update failed"
      );


    } finally {

      setLoading(false);

    }


  };





  return (

    <div className="p-6">


      <div className="max-w-5xl mx-auto">


        <h1 className="
        text-3xl
        font-bold
        mb-6
        ">
          Terms & Conditions Management
        </h1>




        <div className="
        bg-white
        rounded-xl
        shadow
        p-6
        ">



          <label className="
          block
          font-semibold
          mb-3
          ">
            Terms & Conditions Content
          </label>




          <textarea

            value={content}

            onChange={(e)=>
              setContent(e.target.value)
            }


            className="
            w-full
            min-h-[500px]
            border
            rounded-lg
            p-4
            outline-none
            text-gray-700
            leading-7
            "


            placeholder="
            Write Terms & Conditions here...
            "

          />





          <button

            onClick={saveTerms}

            disabled={loading}


            className="
            mt-5
            bg-blue-600
            hover:bg-blue-700
            text-white
            px-8
            py-3
            rounded-lg
            font-semibold
            "

          >

            {
              loading
              ?
              "Saving..."
              :
              "Save Terms"

            }


          </button>



        </div>



      </div>


    </div>

  );

};


export default TermsAndConditionsAdmin;