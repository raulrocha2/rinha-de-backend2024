FROM node:18

WORKDIR /user/app

COPY package.json ./

RUN npm install

ENV NODE_ENV=${PORT}

COPY . .

EXPOSE 8081
EXPOSE 8082

ENTRYPOINT npm run start