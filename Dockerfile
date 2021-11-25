FROM node:16.6.1-slim

WORKDIR /app

COPY ./package.json .

RUN yarn install --production --frozen-lockfile

COPY ./dist .

CMD ["node", "server.js"]
