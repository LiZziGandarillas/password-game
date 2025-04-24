FROM node:14 as build

WORKDIR /app

RUN npm install -g @angular/cli@12

COPY package*.json ./

RUN npm install

COPY . .

RUN ng build --prod

FROM nginx:1.21

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build /app/dist/password-game /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
