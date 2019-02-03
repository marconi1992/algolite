FROM node:10-slim

WORKDIR /algolite

COPY  ./ /algolite

RUN mkdir .algolite && yarn

EXPOSE 9200

CMD [ "node", "cli.js" ]