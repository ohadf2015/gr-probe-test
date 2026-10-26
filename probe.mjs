// Throwaway: does a datacenter IP get answers from logged-out Perplexity/ChatGPT? Delete after the test.
import { chromium } from "playwright-core";
const mode = process.argv[2] ?? "headless";
const ip = await fetch("https://api.ipify.org").then((r) => r.text()).catch(() => "?");
console.log("EGRESS_IP", ip, "MODE", mode);
const Q = "what is the best free online boggle game";
const ALL = {
  perplexity: { url: "https://www.perplexity.ai/", input: "textarea, [contenteditable=true]" },
  chatgpt: { url: "https://chatgpt.com/", input: "#prompt-textarea, textarea, [contenteditable=true]" },
};
const SITES = mode === "headed" ? { chatgpt: ALL.chatgpt } : ALL;
const browser = await chromium.launch({ headless: mode !== "headed", args: ["--no-sandbox"] });
for (const [site, cfg] of Object.entries(SITES)) {
  const ctx = await browser.newContext({ locale: "en-US", viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  try {
    await page.goto(cfg.url, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(3000);
    const head = ((await page.title()) + " " + (await page.locator("body").innerText().catch(() => "")).slice(0, 300)).replace(/\s+/g, " ");
    if (/just a moment|verify you are human|captcha|access denied|attention required/i.test(head)) {
      console.log("RESULT", JSON.stringify({ mode, site, blocked: true, head: head.slice(0, 120) }));
      await ctx.close();
      continue;
    }
    await page.locator(cfg.input).first().click({ timeout: 8000 });
    await page.keyboard.type(Q, { delay: 25 });
    await page.keyboard.press("Enter");
    await page.waitForTimeout(28000);
    const text = (await page.locator("body").innerText()).replace(/\s+/g, " ");
    const links = await page.locator("a[href^=http]").evaluateAll((as) => [...new Set(as.map((a) => new URL(a.href).hostname.replace(/^www\./, "")))]);
    const own = new URL(cfg.url).hostname.replace(/^www\./, "");
    console.log("RESULT", JSON.stringify({ mode, site, blocked: false, answerChars: text.length, externalDomains: links.filter((d) => d !== own).slice(0, 12) }));
  } catch (e) {
    console.log("RESULT", JSON.stringify({ mode, site, error: String(e.message).slice(0, 120) }));
  }
  await ctx.close();
}
await browser.close();
