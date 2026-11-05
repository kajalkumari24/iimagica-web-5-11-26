
import React, { useEffect } from "react";

const refundSections = [
  {
    id: "1.",
    title: "Digital Products and Services",
    description:
      "Because Imagica primarily provides digital products, design access, and online services, refunds are generally limited once a purchase has been successfully processed and service access has been granted.",
  },
  {
    id: "2.",
    title: "Subscription Payments",
    description:
      "Subscription fees are billed for the selected plan period. Once a plan is activated, the amount paid is usually non-refundable unless there is a verified billing error or duplicate transaction.",
  },
  {
    id: "3.",
    title: "Eligible Refund Cases",
    description:
      "A refund request may be considered in the following situations:",
    points: [
      "You were charged more than once for the same order.",
      "You were billed incorrectly due to a payment gateway error.",
      "The purchased service was not activated after successful payment.",
    ],
  },
  {
    id: "4.",
    title: "Non-Refundable Cases",
    points: [
      "Change of mind after purchase.",
      "Partial use of a subscription or downloaded digital content.",
      "Failure to cancel before the next billing cycle, where applicable.",
      "Issues caused by user device, internet, or third-party service limitations.",
    ],
  },
  {
    id: "5.",
    title: "Refund Request Window",
    description:
      "If you believe you qualify for a refund, contact us within 7 days of the payment date with your transaction details, registered email, and a brief explanation of the issue.",
  },
  {
    id: "6.",
    title: "Processing Timeline",
    description:
      "Approved refunds are typically processed within 7 to 10 business days. The final credit timeline depends on your payment method, bank, or payment provider.",
  },
  {
    id: "7.",
    title: "Chargebacks and Disputes",
    description:
      "Before initiating a chargeback, please contact Imagica support so we can review the transaction and attempt a direct resolution.",
  },
  {
    id: "8.",
    title: "Contact for Refund Requests",
    description:
      "Send refund-related queries to:",
    points: [
      "Email: iimagica.samprakshi@gmail.com",
      "Phone: +91 8435204953",
      "Company: samprakshiinfinitysolution",
    ],
  },
];

const RefundPolicy = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <section className="bg-[#fcfaf7] text-slate-900">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="border-b border-slate-200 pb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#F11C6B]">
            iimagica
          </p>
          <h1 className="mt-3 text-3xl font-bold leading-tight text-slate-900 sm:text-4xl">
            Refund Policy
          </h1>

          <p className="mt-5 text-base font-medium text-slate-700">
            Effective Date: April 21, 2026
          </p>

          <p className="mt-5 text-base font-medium leading-8 text-slate-700 sm:text-lg">
            This Refund Policy explains how Imagica handles cancellations,
            refunds, and payment disputes for subscriptions and creative
            services purchased through our platform.
          </p>
        </div>

        <div className="mt-8 space-y-8">
          {refundSections.map((section) => (
            <article
              key={section.id}
              className="border-b border-slate-200 pb-8 last:border-b-0 last:pb-0"
            >
              <div className="flex items-baseline gap-3">
                <span className="text-2xl font-semibold">{section.id}</span>
                <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
                  {section.title}
                </h2>
              </div>

              {section.description && (
                <p className="mt-3 text-base font-medium leading-8 text-slate-700">
                  {section.description}
                </p>
              )}

              {section.points && (
                <ul className="mt-4 space-y-2 text-base font-medium leading-8 text-slate-700">
                  {section.points.map((point) => (
                    <li key={point}>
                      {point}
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RefundPolicy;
