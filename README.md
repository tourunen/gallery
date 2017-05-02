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
pod_name=$(oc get pods | grep gallery | egrep -v 'build|deploy' | grep Running | cut -d " " -f 1) && echo $pod_name
oc rsh $pod_name

# delete all pods and watch the recovery
oc delete pods --all; oc get pods -w

# deploy the application in development mode for hot restart under nodemon 
# (see https://docs.openshift.org/latest/using_images/s2i_images/nodejs.html#nodejs-configuration)
oc set env dc/gallery DEV_MODE=true

# copy local changes to the running pod to for quick testing
pod_name=$(oc get pods | grep gallery | egrep -v 'build|deploy' | grep Running | cut -d " " -f 1) && echo $pod_name
oc rsync src $pod_name:. ; oc rsync public $pod_name:.

```

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
