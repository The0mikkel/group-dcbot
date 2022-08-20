FROM node:17
LABEL maintainer="me@themikkel.dk"

ARG bot_token="0"
ENV bot_token=$bot_token
ARG bot_prefix="!"
ENV bot_prefix=$bot_prefix

WORKDIR /usr/src/app

COPY package*.json ./
COPY tsconfig.json ./
RUN npm install

COPY ./src ./src
COPY ./resources ./resources

RUN npm run build

CMD [ "node", "./dist/bot.js" ]