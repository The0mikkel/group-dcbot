FROM node:14
LABEL maintainer="me@themikkel.dk"

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install
COPY ./src ./src

ARG bot_token="0"
ENV bot_token=$bot_token
ARG bot_prefix="!"
ENV bot_prefix=$bot_prefix

CMD [ "node", "./src/bot.js" ]