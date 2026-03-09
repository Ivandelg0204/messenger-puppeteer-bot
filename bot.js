const puppeteer = require("puppeteer");
const axios = require("axios");

const N8N_WEBHOOK = "https://n8n-n8n.owlzof.easypanel.host/webhook/messenger";

(async () => {

const puppeteer = require("puppeteer");

(async () => {

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu"
    ]
  });

  const page = await browser.newPage();

  await page.goto("https://facebook.com");

  console.log("Browser started");

})();

const page = await browser.newPage();

await page.goto("https://www.facebook.com/messages");

console.log("Inicia sesión manualmente...");

await page.waitForSelector('[role="main"]');

console.log("Messenger cargado");

setInterval(async ()=>{

const messages = await page.evaluate(()=>{

const chats = document.querySelectorAll('[data-testid="mwthreadlist-item"]');

let data = [];

chats.forEach(chat=>{

let name = chat.innerText;

data.push(name);

});

return data;

});

for(const msg of messages){

await axios.post(N8N_WEBHOOK,{
message:msg
});

console.log("Mensaje enviado a n8n:",msg);

}

},5000);

})();
