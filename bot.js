const puppeteer = require("puppeteer-extra")
const Stealth = require("puppeteer-extra-plugin-stealth")
const axios = require("axios")

puppeteer.use(Stealth())

const WEBHOOK = "https://n8n-n8n.owlzof.easypanel.host/webhook/messenger"

let browser
let page

const processed = new Set()

async function launchBrowser(){

console.log("Launching browser")

browser = await puppeteer.launch({

headless:true,

executablePath:"/usr/bin/chromium",

args:[
"--no-sandbox",
"--disable-setuid-sandbox",
"--disable-dev-shm-usage",
"--disable-gpu",
"--disable-features=site-per-process",
"--disable-background-networking",
"--disable-extensions"
]

})

browser.on("disconnected", async ()=>{

console.log("Browser crashed → restarting")

await start()

})

}

async function createPage(){

try{

if(page) await page.close()

}catch{}

page = await browser.newPage()

await page.goto("https://www.facebook.com/messages",{
waitUntil:"domcontentloaded"
})

console.log("Messenger Ready")

}

async function readMessages(){

try{

const messages = await page.evaluate(()=>{

const nodes = document.querySelectorAll('[role="row"]')

let data = []

nodes.forEach(n=>{

const txt = n.innerText

if(txt) data.push(txt)

})

return data

})

for(const msg of messages){

if(!processed.has(msg)){

processed.add(msg)

console.log("New Lead:",msg)

await axios.post(WEBHOOK,{
message:msg,
source:"facebook_marketplace"
})

}

}

}catch(err){

console.log("Frame error detected → recreating page")

await createPage()

}

}

async function start(){

console.log("Starting Messenger Bot")

await launchBrowser()

await createPage()

setInterval(readMessages,4000)

}

start()
