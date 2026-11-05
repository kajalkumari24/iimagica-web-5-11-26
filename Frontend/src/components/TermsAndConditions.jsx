import React, { useState, useEffect } from "react";
import DOMPurify from "dompurify";
import axios from "../axiosConfig";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import styles from "./TermsAndConditions.module.css";


const escapeHtml = (value) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");


const formatTermsContent = (content) => {

  const escapedContent = escapeHtml(content);


  return escapedContent
    .split("\n")
    .map((line)=>{

      const trimmedLine = line.trim();


      if (/^\d+\.\s+\S/.test(trimmedLine)) {
        return `<strong class="${styles.sectionHeading}">${line}</strong>`;
      }


      if (/^[A-Z][A-Za-z /]+:\s*$/.test(trimmedLine)) {
        return `<strong class="${styles.subHeading}">${line}</strong>`;
      }


      if (/^(Email|App Name|Country):\s+/i.test(trimmedLine)) {

        return line.replace(
          /^(Email|App Name|Country):/i,
          `<strong class="${styles.inlineLabel}">$1:</strong>`
        );

      }


      return line;

    })
    .join("\n");

};



const TermsAndConditions = () => {


  const [termsContent,setTermsContent] = useState("");

  const [lastUpdated,setLastUpdated] = useState(null);

  const [errorMessage,setErrorMessage] = useState("");

  const [isLoading,setIsLoading] = useState(true);




  useEffect(()=>{


    const fetchTerms = async()=>{


      try{


        const response = await axios.get(
          "/api/terms-and-conditions"
        );


        const terms = response.data?.data;



        if(terms?.content){

          setTermsContent(
            terms.content
          );


          setLastUpdated(
            terms.updatedAt || terms.createdAt
          );


        }else{

          setTermsContent("");

        }



      }catch(error){


        // console.log(
        //   "Terms error",
        //   error
        // );


        toast.error(
          "Could not load terms and conditions"
        );


        setErrorMessage(
          "Could not load terms and conditions. Please try again later."
        );


      }finally{


        setIsLoading(false);


      }


    };



    fetchTerms();



  },[]);





  const sanitizedContent = DOMPurify.sanitize(
    formatTermsContent(termsContent)
  );



  const updatedLabel = lastUpdated
    ? new Date(lastUpdated).toLocaleDateString(
        "en-IN",
        {
          day:"numeric",
          month:"long",
          year:"numeric"
        }
      )
    : "19 June 2026";





  return (

    <div className={styles.termsContainer}>


      <section className={styles.termsCard}>


        <header className={styles.hero}>


          <p className={styles.eyebrow}>
            iimagica
          </p>


          <h1 className={styles.title}>
            Terms & Conditions
          </h1>


          <p className={styles.updated}>
            Last updated: {updatedLabel}
          </p>


        </header>





        {
          isLoading ?

          (
            <div className={styles.stateBox}>
              Loading terms and conditions...
            </div>
          )


          :

          errorMessage ?


          (

            <div className={styles.stateBox}>
              {errorMessage}
            </div>

          )


          :

          !termsContent.trim() ?


          (

            <div className={styles.stateBox}>
              No terms and conditions published yet.
            </div>

          )


          :


          (

            <div

              className={styles.content}

              dangerouslySetInnerHTML={{
                __html:sanitizedContent
              }}

            />

          )

        }



      </section>


    </div>

  );


};


export default TermsAndConditions;