import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logFilePath = path.join(__dirname, "..", "whatsapp-webhook.log");

const router = express.Router();

const VERIFY_TOKEN = String(process.env.VERIFY_TOKEN || "").trim();

const writeWebhookLog = (title, data) => {
  const logEntry = [
    "",
    `[${new Date().toISOString()}] ${title}`,
    typeof data === "string" ? data : JSON.stringify(data, null, 2),
    "--------------------------------------------------",
  ].join("\n");

  try {
    fs.appendFileSync(logFilePath, `${logEntry}\n`);
  } catch (error) {
    console.error("[WhatsApp Webhook Log Error]", error?.message || error);
  }

  console.log(logEntry);
};

const getStatuses = (body = {}) => {
  const entries = Array.isArray(body.entry) ? body.entry : [];
  const statuses = [];

  for (const entry of entries) {
    const changes = Array.isArray(entry?.changes) ? entry.changes : [];
    for (const change of changes) {
      const value = change?.value || {};
      const items = Array.isArray(value.statuses) ? value.statuses : [];
      for (const status of items) {
        statuses.push(status);
      }
    }
  }

  return statuses;
};

router.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  writeWebhookLog("Webhook verification request", {
    method: req.method,
    path: req.originalUrl,
    query: req.query,
  });

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    writeWebhookLog("Webhook verification success", {
      statusCode: 200,
      challenge,
    });
    return res.status(200).send(challenge);
  }

  writeWebhookLog("Webhook verification failed", {
    statusCode: 403,
    mode,
    tokenMatched: token === VERIFY_TOKEN,
  });
  return res.sendStatus(403);
});

router.post("/webhook", (req, res) => {
  console.log("WEBHOOK BODY:", JSON.stringify(req.body, null, 2));
  
  writeWebhookLog("Webhook payload received", {
    method: req.method,
    path: req.originalUrl,
    headers: {
      "content-type": req.headers["content-type"],
      "user-agent": req.headers["user-agent"],
      "x-forwarded-for": req.headers["x-forwarded-for"],
    },
    body: req.body,
  });

  const statuses = getStatuses(req.body);

  for (const status of statuses) {
    const line = [
      "[WhatsApp Status]",
      `status=${status?.status || "unknown"}`,
      `recipient=${status?.recipient_id || ""}`,
      `messageId=${status?.id || ""}`,
    ].join(" ");

    if (status?.status === "failed") {
      const error = status?.errors?.[0];
      writeWebhookLog("WhatsApp status failed", {
        line,
        code: error?.code || "",
        title: error?.title || "",
        message: error?.message || "",
      });
    } else {
      writeWebhookLog("WhatsApp status update", {
        line,
        status,
      });
    }
  }

  writeWebhookLog("Webhook response sent", { statusCode: 200 });
  return res.sendStatus(200);
});

export default router;