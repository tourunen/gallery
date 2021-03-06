# Gallery 

This is a simple picture gallery franken-application put together from parts by several
donors in the internet. It is mainly based on 

- an Ajax demo by Coligo: https://github.com/coligo-io/file-uploader
- OpenShift nodejs-mongo example: https://github.com/openshift/nodejs-ex

The application is composed of two tiers: web server and a MongoDB 
database. All state (barring uploads in progress) is kept in the database,
so you can scale the web tier independently of the database.

I should mention that this was the first time I used jQuery + NodeJS + Mongo combination, and 
it shows. In the current state, do not that this as a good example on using those. Pull requests welcome.

# How to run it

## OpenShift GUI

Create a new project, or click on "Add to Project"

Select: JavaScript

Select: Node.js + MongoDB (Persistent)

In the template configuration, change:

- name: gallery
- Git repository URL: https://github.com/tourunen/gallery.git (or to your clone, if you wish to hack on this).
- database: gallery

Click on "Continue to Overview"

You can see that a number of resources have been created for the application

- a service and a pod for MongoDB
- a persistent volume for MongoDB data
- a service and a pod for the web server
- public DNS name to access the application

## OpenShift CLI

To get started with using command line tools, go to Help -> Command line tools in the WEB UI.

```bash
# create a new project based on your username
oc new-project "$(oc whoami)-gallery"

# find out the templates starting with 'node'
oc new-app -L | grep ^node

# describe a template in the global 'openshift' -namespace
oc describe template -n openshift nodejs-mongo-persistent

# create a new application, giving parameters from the template with -p
oc new-app --name gallery --template nodejs-mongo-persistent \
  -p NAME=gallery \
  -p DATABASE_NAME=gallery \
  -p SOURCE_REPOSITORY_URL=https://github.com/tourunen/gallery

# view logs for the build that was triggered
oc logs --follow bc/gallery

# view pods in the project, waiting for status changes
oc get pods -w

# get the latest running pod and start a shell in it
pod_name=$(oc get pods | grep gallery | egrep -v 'build|deploy' | grep Running | tail -1 | cut -d " " -f 1) \
  && echo $pod_name
oc rsh $pod_name

# delete all pods and watch the recovery
oc delete pods --all; oc get pods -w

# deploy the application in development mode for hot restart under nodemon 
# (see https://docs.openshift.org/latest/using_images/s2i_images/nodejs.html#nodejs-configuration)
oc set env dc/gallery DEV_MODE=true

# copy local changes to the running pod to for quick testing
# first move to the source folder
cd gallery
pod_name=$(oc get pods | grep gallery | egrep -v 'build|deploy' | grep Running | tail -1 | cut -d " " -f 1) \
  && echo $pod_name
oc rsync src $pod_name:. ; oc rsync public $pod_name:.

# access the mongodb 
mongo_pod=$(oc get pods | grep mongodb | egrep -v 'build|deploy' | grep Running | tail -1| cut -d " " -f 1) \
  && echo $mongo_pod
oc rsh $mongo_pod
mongo -u $MONGODB_USER -p $MONGODB_PASSWORD $MONGODB_DATABASE

# set the deployment to production mode and scale the web server tier up to 3 pods
oc set env dc/gallery DEV_MODE=false
oc scale dc gallery --replicas=3
```

## Local development

You can run the application locally, too. You'll need a local MongoDB instance and node/npm environment. The
most straight forward way of running MongoDB locally is using the official Docker image.

```bash
# start MongoDB in a Docker container
docker run --name mongo-gallery -d -p 27017:27017 mongo

# install dependencies and run the web server
cd gallery/
npm install
npm run dev
```

Navigate to http://localhost:8080 and hack away.

# Adding a GitHub webhook to trigger OpenShift build process

TL:DR; 

- in your (cloned) GitHub repo, go to 'Settings' -> Webhooks -> Add webhook
- open another tab for OpenShift GUI and go to Builds -> gallery
- go to 'Configuration' tab, copy the GitHub webhook
- paste the copied webhook URL to GitHub 'Payload URL'
- change the 'Content type' to 'application/json'
- save the webhook with 'Add webhook'

See the guide here for more details: https://docs.openshift.org/latest/dev_guide/builds/triggering_builds.html
