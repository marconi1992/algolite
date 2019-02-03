FROM node:10-slim

WORKDIR /algolite

COPY  ./ /algolite

RUN mkdir -p .algolite

EXPOSE 9200

CMD [ "npm", "run", "start:container" ]