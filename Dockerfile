FROM node:latest

# File Author / Maintainer
MAINTAINER Black Bean, tuananh@autonomous.nyc

RUN apt-get update && apt-get install ruby-full -y \
   && gem install compass \
   && gem install sass

ENV TEMPDIR /home/node/tmp

RUN mkdir -p /app

WORKDIR /app

COPY ./ /app/

RUN rm -rf /app/node_modules

RUN npm install yarn@latest

RUN yarn build

EXPOSE 8000 8000

ENTRYPOINT ["sh", "/app/entrypoint.sh"]

CMD ["yarn", "start"]

