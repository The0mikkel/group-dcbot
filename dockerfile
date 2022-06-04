FROM node:17
LABEL maintainer="me@themikkel.dk"

ARG bot_token="0"
ENV bot_token=$bot_token
ARG bot_prefix="!"
ENV bot_prefix=$bot_prefix

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY ./dist ./src


CMD [ "node", "./dist/bot.js" ]