const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const axios = require("axios");
const fs = require("fs");

puppeteer.use(StealthPlugin());

const WEBHOOK = "https://n8n-n8n.owlzof.easypanel.host/webhook/messenger";
const SESSION_FILE = "session.json";

let browser;
let page;
let sentMessages = new Set();

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

async function createPage(){

if(page){

try{ await page.close(); }catch{}

}

page = await browser.newPage();

await loadSession();

await page.goto("https://www.facebook.com/messages",{

waitUntil:"networkidle2"

});

try{

await page.waitForSelector('[role="main"]',{timeout:15000});

}catch{

console.log("Login required");

await page.goto("https://www.facebook.com/login");

await page.waitForTimeout(60000);

await saveSession();

}

console.log("Messenger Ready");

}

async function readMessages(){

try{

const chats = await page.evaluate(()=>{

const nodes = document.querySelectorAll('[role="row"]');

let data=[];

nodes.forEach(node=>{

const text=node.innerText;

if(text){

data.push(text);

}

});

return data;

});

for(const chat of chats){

if(!sentMessages.has(chat)){

sentMessages.add(chat);

console.log("New lead:",chat);

await axios.post(WEBHOOK,{

lead:chat,

source:"facebook_marketplace",

timestamp:Date.now()

});

}

}

}catch(err){

console.log("Messenger crashed → recreating page");

await createPage();

}

}

async function start(){

console.log("Starting Messenger Bot...");

browser = await puppeteer.launch({

headless:true,

args:[

"--no-sandbox",
"--disable-setuid-sandbox",
"--disable-dev-shm-usage",
"--disable-gpu",
"--no-zygote",
"--single-process"

]

});

await createPage();

setInterval(readMessages,4000);

}

start();
