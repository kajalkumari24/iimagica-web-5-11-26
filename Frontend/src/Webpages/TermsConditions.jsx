

import React, { useEffect } from "react";

const termSections = [
  {
    id: "01",
    title: "Use of Services",
    description:
      "Imagica provides digital creative services, design assets, and related tools for personal and business use. You agree to use the platform lawfully and in a way that does not harm the website, other users, or our brand.",
  },
  {
    id: "02",
    title: "User Accounts",
    description:
      "Some services may require login or subscription access. You are responsible for keeping your account details secure and for all activity that happens through your account.",
  },
  {
    id: "03",
    title: "Payments and Subscriptions",
    description:
      "Paid plans, pricing, and benefits are shown on the website at the time of purchase. By completing a payment, you authorize Imagica to process the selected plan or service fee using the available payment gateway.",
  },
  {
    id: "04",
    title: "Intellectual Property",
    description:
      "All website content, branding, graphics, templates, and design assets provided by Imagica remain our property unless clearly stated otherwise. You may not copy, resell, redistribute, or claim ownership of our proprietary content without written permission.",
  },
  {
    id: "05",
    title: "Acceptable Conduct",
    points: [
      "Do not misuse the website or attempt unauthorized access.",
      "Do not upload or submit unlawful, abusive, or infringing content.",
      "Do not reproduce or commercially exploit platform content without approval.",
    ],
  },
  {
    id: "06",
    title: "Service Availability",
    description:
      "We may update, suspend, or modify any part of the platform at any time to improve performance, security, or offerings. We do not guarantee uninterrupted or error-free operation at all times.",
  },
  {
    id: "07",
    title: "Limitation of Liability",
    description:
      "Imagica is not liable for indirect, incidental, or consequential losses arising from use of the platform, delayed service, third-party outages, or misuse of downloaded content.",
  },
  {
    id: "08",
    title: "Termination",
    description:
      "We reserve the right to suspend or terminate access if a user violates these terms, behaves fraudulently, or harms the platform or other users.",
  },
  {
    id: "09",
    title: "Changes to These Terms",
    description:
      "We may revise these Terms & Conditions from time to time. Continued use of Imagica after any update means you accept the revised terms.",
  },
];

const TermsConditions = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <section className="bg-[#fffaf7] text-slate-900">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:p-10">
          <div className="max-w-3xl">
            <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-4 py-1 text-xs font-semibold uppercase tracking-[0.26em] text-blue-600">
                Terms & Conditions
              </span>

              <h1 className="mt-5 text-3xl font-bold leading-tight text-slate-900 sm:text-4xl">
                Clear rules for using Imagica responsibly.
              </h1>

              <p className="mt-5 text-sm leading-7 text-slate-600">
                These terms apply to Imagica, its website, digital design
                services, and subscription offerings. By using the platform, you
                agree to these conditions.
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-red-500">
                    Effective Date
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">
                    April 21, 2026
                  </p>
                </div>

                <div className="rounded-2xl border border-orange-100 bg-orange-50 px-5 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-500">
                    Applies To
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">
                    Website, services, subscriptions
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-4">
            {termSections.map((section) => (
              <article
                key={section.id}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">
                      Section {section.id}
                    </p>
                    <h2 className="mt-2 text-xl font-semibold text-slate-900 sm:text-2xl">
                      {section.title}
                    </h2>
                  </div>

                  <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500">
                    {section.id}
                  </div>
                </div>

                {section.description && (
                  <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">
                    {section.description}
                  </p>
                )}

                {section.points && (
                  <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
                    {section.points.map((point) => (
                      <li key={point} className="flex gap-3">
                        <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            ))}
          </div>

          <div className="mt-8 rounded-2xl border border-purple-100 bg-purple-50 p-6 sm:p-7">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-purple-500">
              Contact Us
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-slate-900">
              Questions about these terms?
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">
              If you need clarification about these Terms & Conditions, you can
              contact Imagica using the details below.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white bg-white px-4 py-3 text-sm text-slate-700">
                Email: iimagica.samprakshi@gmail.com
              </div>
              <div className="rounded-2xl border border-white bg-white px-4 py-3 text-sm text-slate-700">
                Phone: +91 8435204953
              </div>
              <div className="rounded-2xl border border-white bg-white px-4 py-3 text-sm text-slate-700">
                Company: samprakshiinfinitysolution
              </div>
            </div>
          </div>
        </div>
    
    </section>
  );
};

export default TermsConditions;
