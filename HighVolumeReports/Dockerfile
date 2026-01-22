FROM node:20-bullseye

WORKDIR /app

# Set npm registry & timeout to avoid network issues
RUN npm set registry https://registry.npmjs.org/ \
    && npm set fetch-retry-mintimeout 20000 \
    && npm set fetch-retry-maxtimeout 120000

COPY package*.json ./

RUN npm install --fetch-timeout=60000 --network-timeout=60000

COPY . .

# Only run dev in container
CMD ["npm", "run", "dev"]
