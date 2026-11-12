// Smoke test of a deployed build: API calls succeed, no error banner, no console errors.
// Usage: npm run smoke [-- <url>]   (default: production)
import { chromium } from "playwright";

const url = process.argv[2] ?? "https://atlas-web-ruddy.vercel.app/";
const browser = await chromium.launch();
const page = await browser.newPage();
const errors: string[] = [];
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
page.on("response", (r) => {
  if (r.url().includes("/v1/") && !r.ok() && r.status() !== 304) errors.push(`${r.status()} ${r.url()}`);
});
page.on("requestfailed", (r) => errors.push(`failed ${r.url()} (${r.failure()?.errorText})`));

await page.goto(url, { waitUntil: "networkidle" });
if (await page.getByText("Não foi possível").count()) errors.push("API error banner is visible");
await browser.close();

if (errors.length) {
  console.error(`FAIL ${url}\n${errors.join("\n")}`);
  process.exit(1);
}
console.log(`OK ${url}`);
