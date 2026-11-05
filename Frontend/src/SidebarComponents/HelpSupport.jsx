import React, { useState } from "react";
import styles from "./HelpSupport.module.css";
import { FaChevronDown, FaChevronUp, FaSearch } from "react-icons/fa";
import { useNavigate } from "react-router-dom"; // import navigate hook

function HelpSupport() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeIndex, setActiveIndex] = useState(null);
  const navigate = useNavigate(); // initialize

  const faqs = [
    {
      question: "What is iimagica?",
        answer:
         "iimagica is a creative platform where you can design frames, logos, and templates easily.",

    },
    {
      question: "How do I create an account?",
      answer:
        "Click Login, fill in your details, and verify your email",
    },
    {
  question: "Is iimagica free to use?",
      answer:
        "Yes,  Some basic features are free. Some premium services may be paid.",
    },
    {
      question: "How do I contact support?",
  answer:
  "You can reach us at support@iimagica.com",
    },
  ];

  const filteredFaqs = faqs.filter((faq) =>
    faq.question.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleFAQ = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <div className={styles.HelpBody}>
      <div className={styles.container}>
        <h1 className={styles.title}>Help & Support</h1>
        <p className={styles.subtitle}>
          Find answers to your questions or contact our support team.
        </p>

        {/* Search Bar */}
        <div className={styles.searchBox}>
          <FaSearch className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search for help..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        {/* FAQ Section */}
        <div className={styles.faqSection}>
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq, index) => (
              <div key={index} className={styles.faqItem}>
                <div
                  className={styles.faqQuestion}
                  onClick={() => toggleFAQ(index)}
                >
                  <span>{faq.question}</span>
                  {activeIndex === index ? <FaChevronUp /> : <FaChevronDown />}
                </div>
                {activeIndex === index && (
                  <div className={styles.faqAnswer}>{faq.answer}</div>
                )}
              </div>
            ))
          ) : (
            <p className={styles.noResult}>
              No results found for "{searchTerm}"
            </p>
          )}
        </div>

        {/* Contact Support */}
        <div className={styles.contactBox}>
          <h2>Need More Help?</h2>
 
          <button
            className={styles.contactButton}
            onClick={() => navigate("/contact")} // ✅ navigate to contact page
          >
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
}

export default HelpSupport;