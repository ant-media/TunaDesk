# TunaDesk - Remote Desktop Control via Web Browser With Full Privacy

TunaDesk is a cross platform remote desktop control app that runs within Ant Media Server. The controller user can connect and control the remote host through a web browser. The host application is an Electron app that runs on the controlled computer. The controller sends mouse and keyboard events to the host, which executes the corresponding commands. The session is completely secure and private as all data flows through Ant Media Server using WebRTC data channels.

## Build and Use

### TunaDesk Server Application for Controller
- Clone the repository and build the project with `mvn`
	```
	mvn clean install -DskipTests -Dgpg.skip=true
	```
- Upload the war file(`target/TunaDesk.war`) to the Ant Media Server Enterprise Web Panel to Create the Application
![Create TunaDesk application from Ant Media Server Panel](https://beeimg.com/images/i09421528611.png)

### Host Application for Controlled

- Go to host folder 
- https://github.com/ant-media/TunaDesk/tree/master/src/host
- Run  `npm install`
- For development mode start host app with `npm start`
- For packaging run `npm run package`
`npm run package` will create setup exe and unpackaged ready to run version of TunaDesk for used operating system at `host/release`
For building different OS use  `npm run package -- --mac`

### Controller

- Open a web browser tab and go to `https://{YOUR_ANT_MEDIA_SERVER}:5443/TunaDesk/remote_desktop.html`
- Type hostId
- Click `Start Controlling` button

### Host
- Start host electron application
- Click `Start Accepting Connections` button
- Share your hostId with controller so controller can connect.
