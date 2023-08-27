FROM node:latest

ENV LOCALHOST=host.docker.internal
ENV HTTP_PORT=8080
ENV HTTPS_PORT=8443

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE $HTTP_PORT
EXPOSE $HTTPS_PORT

ENTRYPOINT ["npm","start"]