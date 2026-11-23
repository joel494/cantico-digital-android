import puppeteer from "puppeteer-core";

const APP_URL = process.env.MOBILE_TEST_URL ?? "http://127.0.0.1:5174/mobile.html";
const CHROME =
  process.env.CHROME_PATH ?? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });

const text = () => page.evaluate(() => document.body.innerText);
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

try {
  await page.goto(`${APP_URL}#/`, { waitUntil: "networkidle2", timeout: 60000 });
  await page.waitForFunction(
    () => document.body.innerText.includes("Canta y lee la Palabra"),
    { timeout: 30000 },
  );

  const homeText = await text();
  assert(homeText.includes("Cánticos"), "Home no muestra Cánticos");
  assert(homeText.includes("Biblia"), "Home no muestra Biblia");
  assert(
    !/proyeccion|proyección|segunda pantalla|presentar/i.test(homeText),
    "Home contiene acciones de escritorio",
  );

  const navItems = await page.$$eval("nav[aria-label='Navegación principal'] a", (nodes) =>
    nodes.map((node) => node.textContent?.trim()),
  );
  assert(navItems.length === 4, `La barra inferior tiene ${navItems.length} módulos`);
  assert(
    JSON.stringify(navItems) ===
      JSON.stringify(["Home", "Cánticos", "Biblia", "Configuración"]),
    `Módulos incorrectos: ${navItems.join(", ")}`,
  );

  await page.screenshot({ path: "mobile-home.png" });

  await page.evaluate(() => {
    const link = Array.from(document.querySelectorAll("a")).find((node) =>
      node.textContent?.includes("Cánticos"),
    );
    link?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
  await page.waitForSelector("input[placeholder*='Buscar por número']", {
    timeout: 30000,
  });
  await page.waitForFunction(() => document.querySelectorAll("main ul li").length > 0, {
    timeout: 60000,
  });

  const hymnText = await text();
  assert(!/proyectar/i.test(hymnText), "Cánticos contiene acción de proyección");

  await page.evaluate(() => {
    const input = document.querySelector("input[type='search']");
    if (!input) return;
    const setter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )?.set;
    setter?.call(input, "sublime gracia");
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await new Promise((resolve) => setTimeout(resolve, 500));
  const searchResult = await text();
  assert(/Sublime gracia/i.test(searchResult), "La búsqueda de cánticos falló");

  await page.evaluate(() => {
    document.querySelector("main ul li a")?.click();
  });
  await page.waitForFunction(() => location.hash.startsWith("#/canticos/"), {
    timeout: 30000,
  });
  await page.waitForFunction(() => /estrofa/i.test(document.body.innerText), {
    timeout: 30000,
  });
  await page.screenshot({ path: "mobile-hymn.png" });

  await page.evaluate(() => {
    const link = Array.from(document.querySelectorAll("nav a")).find((node) =>
      node.textContent?.trim() === "Biblia",
    );
    link?.click();
  });
  await page.waitForFunction(() => document.body.innerText.includes("Reina-Valera"), {
    timeout: 30000,
  });
  await page.evaluate(() => {
    document.querySelector("main ul li button")?.click();
  });
  await page.waitForFunction(
    () => document.querySelectorAll("main ul li a").length > 0,
    { timeout: 30000 },
  );
  await page.evaluate(() => {
    document.querySelector("main ul li a")?.click();
  });
  await page.waitForFunction(() => document.body.innerText.includes("Capítulo 1"), {
    timeout: 30000,
  });
  const bibleText = await text();
  assert(!/proyectar/i.test(bibleText), "Biblia contiene acción de proyección");
  await page.screenshot({ path: "mobile-bible.png" });

  await page.evaluate(() => {
    const link = Array.from(document.querySelectorAll("nav a")).find((node) =>
      node.textContent?.includes("Configuración"),
    );
    link?.click();
  });
  await page.waitForFunction(
    () => document.body.innerText.includes("Estilos de formato"),
    { timeout: 30000 },
  );
  const settingsText = await text();
  assert(
    settingsText.includes("809-219-1750"),
    "Falta el teléfono de contacto",
  );
  assert(
    settingsText.includes("decristoiglesia82@gmail.com"),
    "Falta el correo de contacto",
  );
  assert(
    !/Subir himnos|Editor de himnarios|Paginación|Servicio/i.test(settingsText),
    "Configuración muestra secciones de escritorio",
  );

  await page.evaluate(() => {
    const button = Array.from(document.querySelectorAll("button")).find((node) =>
      node.textContent?.includes("Estilos de formato"),
    );
    button?.click();
  });
  await page.waitForFunction(
    () => document.body.innerText.includes("Ajustes de lectura para los cánticos"),
    { timeout: 30000 },
  );
  const tabs = await page.$$eval("[role='tab']", (nodes) =>
    nodes.map((node) => node.textContent?.trim()),
  );
  assert(
    JSON.stringify(tabs) === JSON.stringify(["Cánticos", "Biblia"]),
    `Pestañas incorrectas: ${tabs.join(", ")}`,
  );
  await page.screenshot({ path: "mobile-settings.png" });

  console.log("OK: flujo móvil validado (Home → Cánticos → Biblia → Configuración).");
} finally {
  await browser.close();
}
