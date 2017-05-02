# Gallery 

This is a simple picture gallery franken-application put together from parts by several
donors in the internet. It is mainly based on 

* a Ajax demo by Coligo: https://github.com/coligo-io/file-uploader
* OpenShift nodejs-mongo example: https://github.com/openshift/nodejs-ex

The application is composed of two tiers: web server and a MongoDB 
database. All state (barring uploads in progress) is kept in the database,
so you can scale the web tier independently of the database.

# How to run it

## OpenShift GUI

## OpenShift CLI

## Local development

Start mongo in a Docker container

docker run --name mongo-gallery -d -p 27017:27017 mongo

Install dependencies and run the web server

cd gallery/
npm install
npm run dev




mongo -u $MONGODB_USER -p $MONGODB_PASSWORD $MONGODB_DATABASE


