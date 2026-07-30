import "server-only";

import nodemailer from "nodemailer";
import { getServerEnv } from "@/lib/env/server";

function escapeHtml(value: string) { return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]!); }

export function emailIsConfigured() { const env = getServerEnv(); return Boolean(env.SMTP_HOST && env.SMTP_FROM); }

export async function sendBrandedEmail(input: { to: string; subject: string; siteName: string; logoUrl?: string | null; contactEmail?: string | null; bodyText: string; bodyHtml?: string }) {
  const env = getServerEnv();
  if (!env.SMTP_HOST || !env.SMTP_FROM) return false;
  const transporter = nodemailer.createTransport({ host: env.SMTP_HOST, port: env.SMTP_PORT ?? (env.SMTP_SECURE ? 465 : 587), secure: env.SMTP_SECURE, ...(env.SMTP_USER ? { auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD ?? "" } } : {}) });
  const bodyHtml = input.bodyHtml ?? `<p>${escapeHtml(input.bodyText).replaceAll("\n", "<br>")}</p>`;
  await transporter.sendMail({ from: `${input.siteName} <${env.SMTP_FROM}>`, to: input.to, subject: input.subject, text: `${input.bodyText}\n\n${input.siteName}${input.contactEmail ? ` · ${input.contactEmail}` : ""}`, html: `<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#171512">${input.logoUrl ? `<img src="${escapeHtml(input.logoUrl)}" alt="${escapeHtml(input.siteName)}" style="max-height:56px;max-width:220px">` : `<h1>${escapeHtml(input.siteName)}</h1>`}<div style="margin:28px 0;line-height:1.65">${bodyHtml}</div><hr style="border:0;border-top:1px solid #ddd"><p style="font-size:12px;color:#6b655d">${escapeHtml(input.siteName)}${input.contactEmail ? ` · ${escapeHtml(input.contactEmail)}` : ""}</p></div>` });
  return true;
}
