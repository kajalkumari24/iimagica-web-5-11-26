




import React from "react";
import ImageCreationImg from "../../assets/ImageCreation.jpg";
import VisitingCardImg from "../../assets/VisitingCard1.png";
import Logo2Img from "../../assets/Logo2.jpg";
import WebsiteTemplatesImg from "../../assets/Website_Templates.jpg";

const services = [
  {
    title: "Image Creation",
    desc: "Create personalized digital images with ease using professionally designed creative templates, customize every detail to match your style and purpose, choose from a wide range of modern and customizable layouts, and design professional-quality visuals for every occasion in just minutes",
    img: ImageCreationImg,
  },
  {
    title: "Visiting Cards",
    desc: "Browse a wide collection of professionally designed visiting cards, choose the perfect design that matches your personal or business style, personalize selected templates with your details in just a few steps, and download high-quality visiting cards ready for digital or print use",
    img: VisitingCardImg,
  },
  {
    title: "Logo Creation",
    desc: "Explore a wide collection of professionally designed logo templates, choose the perfect logo that reflects your brand or personal identity, browse creative styles across different categories and industries, and download high-quality logos ready for digital and print use",
    img: Logo2Img,
  },
  {
    title: "Website Templates",
    desc: "Explore a wide collection of professionally designed website templates, choose layouts for business, portfolio, personal, and creative websites, browse modern responsive designs across multiple categories, and download high-quality templates ready for your next web project",
    img: WebsiteTemplatesImg,
  },
];

export default function ServicesCards({ hideBanner = false }) {
  return (
    <>


      <div>


        {!hideBanner && (
          <div className="pt-5 pb-10 px-6  bg-white">
            <div className="rounded-3xl text-white py-12 px-6 text-center shadow-lg
          bg-[linear-gradient(135deg,#F0A67D_0%,#F77534_30%,#F1388A_100%)]">

              <h1 className="text-3xl lg:text-5xl font-bold mb-4">
                Personalize Your Designs
              </h1>

              <p className="text-base lg:text-lg max-w-3xl mx-auto leading-relaxed">
                Add your name, wishes, or text to any image. Perfect for{" "}
                <span className="font-semibold text-black">
                  Good Morning, Birthday, Anniversary
                </span>{" "}
                greetings and events.
              </p>

            </div>
          </div>
        )}

        <section className="min-h-screen p-4 flex items-start  lg:-mt-1 lg:items-center relative overflow-hidden  bg-white">



          {/* BLOBS */}
          <div className="absolute top-10 left-10 w-40 h-40 rounded-full animate-blob z-0 " style={{ background: "radial-gradient(circle, #FF9E66 0%, #FF7A30 100%)", opacity: 0.19 }} />
          <div className="absolute top-40 right-20 w-40 h-40 rounded-full animate-blob animation-delay-2000 z-0" style={{ background: "radial-gradient(circle, #FF6EB5 0%, #f10d64 100%)", opacity: 0.19 }} />
          <div className="absolute bottom-10 left-1/2 w-40 h-40 rounded-full animate-blob animation-delay-4000 z-0" style={{ background: "radial-gradient(circle, #FF9E66 0%, #FF7A30 100%)", opacity: 0.19 }} />

          {/* ANIMATION */}
          <style>{`
          @keyframes borderFlow {
            0% { background-position: 0% 50%; }
            100% { background-position: 200% 50%; }
          }

          @keyframes blob {
            0%, 100% { transform: translate(0px, 0px) scale(1); }
            33% { transform: translate(30px, 50px) scale(1.1); }
            66% { transform: translate(0px, 20px) scale(0.9); }
          }

          .animate-blob { animation: blob 8s infinite; }
          .animation-delay-2000 { animation-delay: 2s; }
          .animation-delay-4000 { animation-delay: 4s; }
        `}</style>





          <div className="w-full flex flex-col lg:flex-row items-start lg:items-center relative z-10 ">

            {/* LEFT SPACE */}
            <div className="hidden lg:block w-[10%]" />

            {/* TEXT */}
            <div className="w-full lg:w-[20%] flex justify-center ">
              <div className="lg:-rotate-90 text-center">
                <h2 className="text-3xl md:text-4xl lg:text-[62px] font-semibold text-gray-900 mb-6 whitespace-nowrap">
                  Our Work
                </h2>
                <p className="text-gray-700 text-base md:text-lg w-[260px] md:w-auto lg:w-[260px] md:whitespace-nowrap lg:whitespace-normal mx-auto">
                  Creative solutions including image creation, logo design,
                  templates & visiting cards.
                </p>
              </div>
            </div>

            {/* GAP */}
            <div className="hidden lg:block w-[10%]" />

            {/* CARDS */}
            <div className="
            w-full md:w-[80%] md:mx-auto lg:mx-0 lg:w-[50%]
            flex flex-col
            lg:flex-row lg:flex-nowrap
            gap-6
            mt-8 lg:mt-0
            lg:h-[65vh]
          ">

              {services.map((item, i) => (
                <div
                  key={i}
                  className="
                  group
                  w-full

                  /* MOBILE FULL CARD */
                  h-auto

                  lg:h-full
                  lg:flex-[0.7]
                  lg:hover:flex-[2]

                  transition-all duration-500 ease-in-out
                "
                >

                  {/* BORDER */}
                  <div
                    className="
                    w-full h-full
                    rounded-2xl p-[3px] bg-transparent
                    lg:group-hover:bg-[linear-gradient(90deg,#ff4545,#00ff99,#006aff,#ff00ff,#ff4545)]
                    lg:group-hover:animate-[borderFlow_8s_linear_infinite]
                  "
                    style={{ backgroundSize: "300% 300%" }}
                  >

                    {/* CARD */}
                    <div className="
                    w-full h-full
                    rounded-2xl overflow-hidden shadow-lg
                    flex flex-col
                    lg:block relative
                  ">

                      {/* IMAGE */}
                      <div className="
                      w-full h-[250px] sm:h-[300px] md:h-[350px]
                      lg:h-full 
                    ">
                        <img
                          src={item.img}
                          alt={item.title}
                          loading="lazy"
                          decoding="async"
                          className="
                          w-full h-full object-cover 

                          lg:absolute lg:inset-0
                          transition-all duration-500
                          lg:group-hover:scale-105
                          lg:group-hover:blur-sm
                        "
                        />
                      </div>

                      {/* OVERLAY (desktop only) */}
                      <div className="hidden lg:block absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-500 z-10" />

                      {/* CONTENT */}
                      <div className="
                      w-full flex-1   /*  TAKES REMAINING HEIGHT */
                      flex flex-col justify-center items-center
                      p-6 text-center
                      bg-white lg:bg-transparent

                      lg:absolute lg:inset-0 
                      lg:h-full
                      lg:text-white z-20
                    ">

                        <h3 className="text-lg lg:text-xl font-semibold">
                          {item.title}
                        </h3>



                        <p className="text-base mt-4 max-w-[90%] text-gray-700 lg:text-white lg:opacity-0 lg:translate-y-4 lg:group-hover:opacity-100 lg:group-hover:translate-y-0 transition-all duration-500 delay-150" >{item.desc}</p>

                      </div>

                    </div>
                  </div>
                </div>
              ))}

            </div>

            {/* RIGHT SPACE */}
            <div className="hidden lg:block w-[10%]" />
          </div>
        </section>
      </div>



      {/* CTA */}

    </>
  );
}