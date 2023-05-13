# ------------------ build environment -----------------------------------

FROM node:19-alpine as build
RUN apk --no-cache -U upgrade
WORKDIR /app
COPY . .
RUN npm install --quiet
# RUN npm audit fix --only=prod || echo
# RUN npm audit fix --only=prod --force
RUN npx craco build

# ------------------ production environment ------------------------------

FROM nginx:stable-alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY --from=build /app/nginx/nginx.conf /etc/nginx/conf.d/default.conf
RUN chmod +r -R /usr/share/nginx/
RUN chmod +r -R /etc/nginx/
EXPOSE 8080
# EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
