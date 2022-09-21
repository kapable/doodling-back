FROM node:lts-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
RUN npm install -g pm2 cross-env
RUN apt-get update && \
    apt-get -y install sudo
RUN useradd -m docker && echo "docker:docker" | chpasswd && adduser docker sudo
USER docker
ENV NODE_ENV production
COPY . .
EXPOSE 3065
CMD ["sudo", "cross-env", "pm2-runtime", "start", "app.js"]
# CMD ["cross-env", "node", "app.js"]