# TunaDesk - Remote Desktop Application via Web Browser

TunaDesk is a Remote Desktop Control application running in Ant Media Server and it uses Web Browser to connect to host. Host application is a nodejs application and Client application is just a web browser. It relays mouse clicks, mouse move, keyboard events, etc. 

Maturity: PoC


## Build and Use

## Build the TunaDesk Server Application

### TunaDesk Server Application
- Clone the repository and build the project with `mvn`
```
mvn clean install -DskipTests -Dgpg.skip=true
```
- Upload the war file(`target/TunaDesk.war`) to the Ant Media Server Enterprise Web Panel to Create the Application


### Host 
- Copy the Node.js application on https://github.com/ant-media/TunaDesk/tree/master/src/host
- Install Node.js to host - https://nodejs.org/en
- Run the `npm install`
```
npm install
```
- Run the `index.js` with `node`
```
node index.js
```
- Open a web browser tab and go to `https://{YOUR_ANT_MEDIA_SERVER}:5443/TunaDesk/index.html`
- Choose "Entire Screen" and Allow in the popup window
- Save the `streamId` on the screen because we'll use in next section
- Click `Start Publishing` button

### Client
- Open a web browser tab in a different computer to connect to Host and go to `https://{YOUR_ANT_MEDIA_SERVER}:5443/TunaDesk/remote_desktop.html`
- Write the same `streamId` in the previous step
- Click `Start Playing` button

Then you can control the host computer through video player. 

## Developer Guide

There are three main components in this project. 
1. Client webapp just listen mouse events, keyboard events and sends data to Host through Data channel
2. Host webapp receives events and sends these events to `nodejs` application through websocket. This the [JS plugin]([url](https://github.com/ant-media/TunaDesk/blob/master/src/main/webapp/js/desktop-control-plugin.js)) relating messages to the websocket 
3. [Node.js application]([url](https://github.com/ant-media/TunaDesk/blob/master/src/host/index.js)) running in host creates a websocket server and receives the events coming from Host webapp to trigger mouse, keyboard events etc.  


