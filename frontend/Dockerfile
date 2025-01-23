FROM node:20-alpine

RUN mkdir /app
WORKDIR /app
COPY package.json .
RUN npm i 

COPY src src
COPY public public
# COPY codegen.ts .

COPY tsconfig.json .
COPY next.config.mjs .
COPY tailwind.config.ts .
COPY postcss.config.mjs .

CMD npm run dev
