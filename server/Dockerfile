FROM node:latest

LABEL org.opencontainers.image.source='https://github.com/thefarmersfront/local-dev-proxy'

ENV LOCALHOST=host.docker.internal
ENV HTTP_PORT=8080
ENV HTTPS_PORT=8443

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

EXPOSE $HTTP_PORT
EXPOSE $HTTPS_PORT

ENTRYPOINT ["node","dist/server.js"]