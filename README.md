# Gallery 

This is a simple picture gallery franken-application put together from parts by several
donors in the internet. It is mainly based on 

- a Ajax demo by Coligo: https://github.com/coligo-io/file-uploader
- OpenShift nodejs-mongo example: https://github.com/openshift/nodejs-ex

The application is composed of two tiers: web server and a MongoDB 
database. All state (barring uploads in progress) is kept in the database,
so you can scale the web tier independently of the database.

# How to run it

## OpenShift GUI

Create a new project, or click on "Add to Project"

Select: JavaScript

Select: Node.js + MongoDB (Persistent)

Change:

- name: gallery
- Git repository URL: https://github.com/tourunen/gallery.git (or to your clone, if you wish to hack on this).

Click on "Continue to Overview"

You can see that a number of resources have been created for the application

- a service and a pod for MongoDB
- a service and a pod for the web server
- a route (public DNS name) to the application

In addition, a persistent volume has been allocated for MongoDB data.

## OpenShift CLI

## Local development

Start MongoDB in a Docker container

docker run --name mongo-gallery -d -p 27017:27017 mongo

Install dependencies and run the web server

cd gallery/
npm install
npm run dev


# Adding a GitHub webhook to trigger OpenShift build process

TL:DR; 

- in your (cloned) GitHub repo, go to 'Settings' -> Webhooks -> Add webhook
- open another tab for OpenShift GUI and go to Builds -> gallery
- go to 'Configuration' tab, copy the GitHub webhook
- paste the copied webhook URL to GitHub 'Payload URL'
- change the 'Content type' to 'application/json'
- save the webhook with 'Add webhook'

See the guide here for more details: https://docs.openshift.org/latest/dev_guide/builds/triggering_builds.html

mongo -u $MONGODB_USER -p $MONGODB_PASSWORD $MONGODB_DATABASE
