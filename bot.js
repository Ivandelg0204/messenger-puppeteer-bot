const puppeteer = require("puppeteer");
const axios = require("axios");

const N8N_WEBHOOK = "https://n8n-n8n.owlzof.easypanel.host/webhook/messenger";

(async () => {

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--no-zygote",
      "--single-process"
    ]
  });

  const page = await browser.newPage();

  console.log("Abriendo Facebook...");

  await page.goto("https://www.facebook.com/messages", {
    waitUntil: "networkidle2"
  });

  console.log("Inicia sesión manualmente si es necesario...");

  await page.waitForSelector('[role="main"]', { timeout: 0 });

  console.log("Messenger cargado");

  setInterval(async () => {

    try {

      const messages = await page.evaluate(() => {

        const chats = document.querySelectorAll('[data-testid="mwthreadlist-item"]');

        let data = [];

        chats.forEach(chat => {
          let name = chat.innerText;
          data.push(name);
        });

        return data;

      });

      for (const msg of messages) {

        await axios.post(N8N_WEBHOOK, {
          message: msg
        });

        console.log("Mensaje enviado a n8n:", msg);

      }

    } catch (err) {

      console.log("Error leyendo mensajes:", err.message);

    }

  }, 5000);

})();
