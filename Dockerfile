FROM node:lts-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
RUN npm install -g pm2 
ENV NODE_ENV production
COPY . .
EXPOSE 3065
CMD ["pm2-runtime", "start", "app.js"]
# CMD ["npm run start"]