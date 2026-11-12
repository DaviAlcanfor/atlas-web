// Smoke test of a deployed build: API calls succeed, no error banner, no console errors, on the main routes.
// Usage: npm run smoke [-- <base url>]   (default: production)
import { chromium } from "playwright";

const base = (process.argv[2] ?? "https://atlas-web-ruddy.vercel.app/").replace(/\/?$/, "/");
const browser = await chromium.launch();
const errors: string[] = [];
for (const route of ["", "pais/br", "glossario"]) {
  const url = base + route;
  const page = await browser.newPage();
  page.on("console", (m) => m.type() === "error" && errors.push(`${url}: ${m.text()}`));
  page.on("response", (r) => {
    if (r.url().includes("/v1/") && !r.ok() && r.status() !== 304) errors.push(`${url}: ${r.status()} ${r.url()}`);
  });
  page.on("requestfailed", (r) => errors.push(`${url}: failed ${r.url()} (${r.failure()?.errorText})`));
  await page.goto(url, { waitUntil: "networkidle" });
  if (await page.getByText("Não foi possível").count()) errors.push(`${url}: API error banner is visible`);
  if (route === "pais/br" && !(await page.locator("aside.panel").count())) errors.push(`${url}: no country panel`);
  await page.close();
}
await browser.close();

if (errors.length) {
  console.error(`FAIL ${base}\n${errors.join("\n")}`);
  process.exit(1);
}
console.log(`OK ${base}`);
