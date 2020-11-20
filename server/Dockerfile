FROM node:14.15.1-alpine3.10 as build-deps
WORKDIR /usr/src/app
COPY package.json yarn.lock ./
RUN yarn
COPY . ./

EXPOSE 5000
CMD ["yarn", "start"]

# docker build . -t mlh_townhall_backend
# docker run -p 5000:5000 -d mlh_townhall_backend
