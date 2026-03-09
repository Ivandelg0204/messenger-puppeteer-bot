const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const axios = require("axios");
const fs = require("fs");

puppeteer.use(StealthPlugin());

const WEBHOOK = "https://n8n-n8n.owlzof.easypanel.host/webhook/messenger";
const SESSION_FILE = "session.json";

let browser;
let page;

const sentMessages = new Set();

async function launchBrowser(){

console.log("Launching browser");

browser = await puppeteer.launch({

headless:true,

executablePath:"/usr/bin/chromium",

args:[
"--no-sandbox",
"--disable-setuid-sandbox",
"--disable-dev-shm-usage",
"--disable-gpu",
"--disable-features=site-per-process",
"--disable-background-networking"
]

});

browser.on("disconnected", async()=>{

console.log("Browser crashed → restarting");

await start();

});

}

async function loadSession(){

if(fs.existsSync(SESSION_FILE)){

const cookies = JSON.parse(fs.readFileSync(SESSION_FILE));

await page.setCookie(...cookies);

console.log("Session loaded");

}

}

async function saveSession(){

const cookies = await page.cookies();

fs.writeFileSync(SESSION_FILE, JSON.stringify(cookies,null,2));

console.log("Session saved");

}

async function openMessenger(){

await page.goto("https://www.facebook.com/messages",{

waitUntil:"networkidle2"

});

try{

await page.waitForSelector('[role="main"]',{timeout:15000});

}catch{

console.log("Login required");

await page.goto("https://www.facebook.com/login");

console.log("Waiting for manual login...");

await page.waitForTimeout(60000);

await saveSession();

}

console.log("Messenger ready");

}

async function attachMessageListener(){

console.log("Attaching real-time listener");

await page.evaluate(()=>{

if(window.__MESSENGER_OBSERVER__) return;

window.__MESSENGER_OBSERVER__ = true;

window.newMessages = [];

const observer = new MutationObserver(()=>{

const messages = document.querySelectorAll('[role="row"]');

messages.forEach(m=>{

const text = m.innerText;

if(text){

window.newMessages.push(text);

}

});

});

observer.observe(document.body,{
childList:true,
subtree:true
});

});

}

async function pollMessages(){

const msgs = await page.evaluate(()=>{

const data = [...window.newMessages];

window.newMessages = [];

return data;

});

for(const msg of msgs){

if(!sentMessages.has(msg)){

sentMessages.add(msg);

console.log("New message detected:",msg);

await axios.post(WEBHOOK,{
lead:msg,
source:"facebook_marketplace",
timestamp:Date.now()
});

}

}

}

async function createPage(){

if(page){

try{await page.close()}catch{}

}

page = await browser.newPage();

await loadSession();

await openMessenger();

await attachMessageListener();

}

async function start(){

console.log("Starting Messenger SaaS Bot");

await launchBrowser();

await createPage();

setInterval(async()=>{

try{

await pollMessages();

}catch(e){

console.log("Page crashed → rebuilding");

await createPage();

}

},3000);

}

start();
