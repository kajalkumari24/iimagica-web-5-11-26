
const getWhatsAppConfig = () => ({
  accessToken:
    process.env.WHATSAPP_ACCESS_TOKEN ||
    process.env.ACCESS_TOKEN ||
    process.env.WHATSAPP_TOKEN ||
    "",

  phoneNumberId:
    process.env.WHATSAPP_PHONE_NUMBER_ID ||
    process.env.PHONE_NUMBER_ID ||
    "",

  apiVersion: process.env.WHATSAPP_API_VERSION || "v18.0",

  templateName:
    process.env.WHATSAPP_OTP_TEMPLATE_NAME || "otp",

  templateLanguageCode:
    process.env.WHATSAPP_TEMPLATE_LANGUAGE_CODE || "en_US",

  templateBodyParams: String(
    process.env.WHATSAPP_TEMPLATE_BODY_PARAMS !== undefined
      ? process.env.WHATSAPP_TEMPLATE_BODY_PARAMS
      : "otp"
  )
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean),

  useRawText:
    String(process.env.WHATSAPP_USE_RAW_TEXT || "false").toLowerCase() ===
    "true",
});

const sanitizePhoneNumberId = (value) => {
  return String(value || "").match(/\d+/g)?.join("") || "";
};

const sanitizeRecipient = (value) => {
  return String(value || "").replace(/\D/g, "");
};

const getWhatsAppEndpoint = (apiVersion, phoneNumberId) =>
  `https://graph.facebook.com/${apiVersion}/${sanitizePhoneNumberId(
    phoneNumberId
  )}/messages`;

const resolveTemplateTextParam = (key, { otp, expiresIn }) => {
  switch (String(key || "").trim()) {
    case "otp":
      return String(otp);

    case "expiresIn":
      return String(expiresIn);

    default:
      return String(key || "");
  }
};

const buildTemplatePayload = (
  to,
  otp,
  expiresIn,
  templateName,
  languageCode,
  options
) => {
  const components = [];

  // Body parameters
  if (options.templateBodyParams?.length > 0) {
    components.push({
      type: "body",
      parameters: options.templateBodyParams.map((key) => ({
        type: "text",
        text: resolveTemplateTextParam(key, {
          otp,
          expiresIn,
        }),
      })),
    });
  }

  // URL button parameter
  components.push({
    type: "button",
    sub_type: "url",
    index: "0",
    parameters: [
      {
        type: "text",
        text: String(otp),
      },
    ],
  });

  return {
    messaging_product: "whatsapp",
    to,
    type: "template",
    template: {
      name: templateName,
      language: {
        code: languageCode,
      },
      components,
    },
  };
};

export const sendWhatsAppOTP = async (
  phone,
  otp,
  { expiresIn = 5 } = {}
) => {
  const config = getWhatsAppConfig();

  const phoneNumberId = sanitizePhoneNumberId(
    config.phoneNumberId
  );

  const recipient = sanitizeRecipient(phone);

  if (!config.accessToken || !phoneNumberId) {
    throw new Error(
      "WhatsApp API credentials are not configured"
    );
  }

  if (!recipient) {
    throw new Error("Recipient mobile number is invalid");
  }

  if (!config.templateName) {
    throw new Error(
      "WHATSAPP_OTP_TEMPLATE_NAME is not set in .env"
    );
  }

  let payload;

  // Raw text mode
  if (config.useRawText) {
    payload = {
      messaging_product: "whatsapp",
      to: recipient,
      type: "text",
      text: {
        body: `Your OTP is ${otp}. Valid for ${expiresIn} minutes.`,
      },
    };
  } else {
    // Template mode
    payload = buildTemplatePayload(
      recipient,
      otp,
      expiresIn,
      config.templateName,
      config.templateLanguageCode,
      {
        templateBodyParams: config.templateBodyParams,
      }
    );
  }

  const endpoint = getWhatsAppEndpoint(
    config.apiVersion,
    phoneNumberId
  );

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  // Logs
  // console.log("\n====== WhatsApp OTP Request Log ======");
  // console.log("Endpoint:", endpoint);
  // console.log("Payload:",JSON.stringify(payload, null, 2) );
  // console.log("Response Status:", response.status);
  // console.log("Response Data:",JSON.stringify(data, null, 2));
  // console.log("======================================\n");

  if (!response.ok) {
    const apiCode = data?.error?.code
      ? ` [code ${data.error.code}]`
      : "";

    const apiDetails = data?.error?.error_data?.details
      ? ` - ${data.error.error_data.details}`
      : "";

    const apiMessage =
      data?.error?.message ||
      data?.message ||
      "WhatsApp OTP send failed";

    throw new Error(
      `${apiMessage}${apiCode}${apiDetails}`
    );
  }

  return data;
};