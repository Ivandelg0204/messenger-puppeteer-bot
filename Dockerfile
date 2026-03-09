FROM node:18

# instalar chromium para puppeteer
RUN apt-get update && apt-get install -y \
  chromium \
  libnss3 \
  libatk1.0-0 \
  libatk-bridge2.0-0 \
  libcups2 \
  libgbm1 \
  libasound2 \
  libpangocairo-1.0-0 \
  libxss1 \
  libgtk-3-0 \
  libxshmfence1 \
  libglu1 \
  --no-install-recommends

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

CMD ["node", "bot.js"]
