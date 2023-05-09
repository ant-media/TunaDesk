import React, { Component } from 'react'
import { WebRTCAdaptor } from '@antmedia/webrtc_adaptor';
import logo from '../../../assets/logo.png';
import antmedialogo from '../../../assets/antmedia_logo.png';

import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';

const STATUS_IDLE = 0
const STATUS_PREPARING = 1;
const STATUS_READY = 2;
const STATUS_STARTED = 3;
const STATUS_HOST_COULDNT_CONNECT = 4;
const STATUS_CONTROLLER_CONNECTING = 5;
var mediaConstraints = {
  video: {
      aspectRatio:16/9,
      frameRate: 20,
  },
  audio: true,
};

export default class MainComponent extends Component {

  constructor(props) {
    super(props)
    this.state = {
      log:"",
      status: STATUS_IDLE,
      hostId: null,
      webSocketUrl:"ws://localhost:5080/{appName}/websocket or wss://localhost:5443/{appName}/websocket",
      sessionName:"sessionName",
      turnServerUrl:"",
      turnServerUsername:"",
      turnServerPassword:"",
      controllerIdList : [],
     // autoStartAcceptingConnectionsCheckboxChecked:false,
      showTurnConfigurationDialog:false

    }
    this.hostId =  null;
    this.dataChannelWebRtcAdaptor = null;
    this.screenPublisherWebRtcAdaptor = null;
    this.streamId = null;
    this.publishing = false;
    this.logBoxRef = React.createRef()
    this.saveHostIdCheckboxChecked = false;
    this.autoStartAcceptingConnectionsCheckboxChecked = false;
    this.iceServers = [{'urls': 'stun:stun1.l.google.com:19302'}]

  }


  generateId = () => {
    return Math.floor(100000 + Math.random() * 900000);
  }

   initDataChannelWebRtcAdaptor = ()=> {

    console.log("init data channel webrtc adaptor")
    console.log(this.state.turnServerUrl)
      this.dataChannelWebRtcAdaptor = new WebRTCAdaptor({
      websocket_url: this.state.webSocketUrl,
      onlyDataChannel:true,
      peerconnection_config: {
          'iceServers': this.iceServers
      },
      callback: (info,obj) => {
        console.log(info)
        console.log(obj)
        if (info == "initialized") {
            console.log("initialized");

            if(this.hostId == null || this.saveHostIdCheckboxChecked == false){
              this.hostId = this.generateId()
              this.setState({hostId:this.hostId})


            }
            if(this.saveHostIdCheckboxChecked){
              console.log("saving host id...")
              this.save("hostId", this.hostId)
            }
            console.log("STARTING DATA CHANNEL PUBLISH!")

            this.dataChannelWebRtcAdaptor.publish(this.hostId.toString());

           /*  this.webRTCAdaptor.createRdcSession(this.state.sessionName, this.hostId)
            this.setState({status:STATUS_READY})
            this.addLog("Waiting for connections.")

            this.save("webSocketUrl",this.state.webSocketUrl)
            this.save("sessionName",this.state.sessionName)


            console.log("set status to ready!") */
        }
        else if(info == "data_received"){
          this.onRemoteDesktopControlEvent(obj.data)
        }else if(info == 'data_channel_opened'){
          this.setState({status:STATUS_READY})
          this.addLog("Waiting for connections.")

          this.save("webSocketUrl",this.state.webSocketUrl)
          this.save("sessionName",this.state.sessionName)

        }
  },
  callbackError: (error,message) => {
    //some possible errors, NotFoundError, SecurityError,PermissionDeniedError
    console.log(message)


    if (error.indexOf("no_stream_exist") != -1) {
      console.log("no stream exists will create channel!")
      /* if no stream exist, create the channel*/
    //  createChannel();
    }

  }
  });



   }

   initScreenPublisherWebrtcAdaptor = () =>{
    console.log("init screen publisher webrtc adaptor")

    this.screenPublisherWebRtcAdaptor = new WebRTCAdaptor({
      websocket_url: this.state.webSocketUrl,
      mediaConstraints: mediaConstraints,
      peerconnection_config: {
          'iceServers': this.iceServers
      },
      publishMode: "screen",

      sdp_constraints: {
          OfferToReceiveAudio : false,
          OfferToReceiveVideo : false,
      },
      dataChannelEnabled: true,
      callback: (info,obj) => {
        console.log(info)
        console.log(obj)
        if (info == "initialized") {
            console.log("initialized");
            this.startPublishing()

        }
        else if(info == "publish_started"){
          this.onPublishStarted()
        }else if(info == "data_received"){
          this.onRemoteDesktopControlEvent(obj.data)
        }
  },
  callbackError: (error,message) => {
    //some possible errors, NotFoundError, SecurityError,PermissionDeniedError
    console.log(message)
    if(message.definition != "noStreamNameSpecified"){

      this.addLog("Connection attempt failed to Ant Media Server")
      this.setState({status:STATUS_HOST_COULDNT_CONNECT})

    }

  }
  });

  if(this.state.turnServerUrl != ''){
    this.addTurnServerToWebrtcAdaptor()
  }

  //webRTCAdaptor.publish("qwe")
   // window.webRTCAdaptor = webRTCAdaptor;








   }

   createChannel = () =>{

      this.dataChannelWebRtcAdaptor.publish(this.hostId); // create data channel with host id.

    }


startPublishing = () => {

console.log("STARTING TO PUBLISH!")
this.streamId = this.generateId().toString()
this.screenPublisherWebRtcAdaptor.publish(this.streamId)

}







onControllerStartRemoteDesktopControl = (controllerId) =>{
console.log("REMOTE DESKTOP CONTROL REQUEST CAME!")
console.log(controllerId)
this.state.controllerIdList.push(controllerId);
this.addLog("Controller has been connected session id: "+ controllerId)
this.setState({ controllerIdList:this.state.controllerIdList })


if(!this.publishing){
  this.initScreenPublisherWebrtcAdaptor()

}else{

  var jsCmd = {
    command : "setRdcStreamId",
    rdcStreamId : this.streamId.toString(),
    rdcControllerId : controllerId,
};


  this.sendDataThroughDataChannel(JSON.stringify(jsCmd))


}

}

onControllerStopRemoteDesktopControl = (controllerId) =>{
  console.log("REMOTE DESKTOP CONTROL STOP CONTROLLER")
  console.log(controllerId)
  var controllerIndex = this.state.controllerIdList.indexOf(controllerId);
  if (controllerIndex !== -1) {
  this.state.controllerIdList.splice(controllerIndex, 1);
  }
  this.addLog("Controller has been disconnected with session id: "+ controllerId)
  this.setState({ controllerIdList:this.state.controllerIdList })

}


getStorage = () =>{

 window.electron.ipcRenderer.sendMessage('getStorage');

}

checkAutoStartAcceptingConnectionsMenu = () =>{

  window.electron.ipcRenderer.sendMessage('checkAutoStartAcceptingConnectionsMenu');


}


checkSaveHostIdMenu = () =>{

  window.electron.ipcRenderer.sendMessage('checkSaveHostIdMenu');


}

checkLaunchAtStartupMenu = () =>{
  window.electron.ipcRenderer.sendMessage('checkLaunchAtStartupMenu');


}

saveTurnServerCredentials = ()=>{
  console.log("save turn server credentials called!")

  const regex = new RegExp('^(turn|turns):[\\w.-]+(?::\\d+)?$');

  console.log(this.state.turnServerUrl)

  if (regex.test( this.state.turnServerUrl)) {
    this.save('turnServerUrl', this.state.turnServerUrl)
    this.save('turnServerUsername',this.state.turnServerUsername)
    this.save('turnServerPassword',this.state.turnServerPassword)

    this.addTurnServerToWebrtcAdaptor()

    this.setState({showTurnConfigurationDialog:false})

    alert("Turn server saved.")
    this.addLog("Turn server added.")

  } else {
    alert('Invalid TURN server URL');
  }







}

addTurnServerToWebrtcAdaptor = () =>{

  var creds = {
    'urls': this.state.turnServerUrl,
    'username':this.state.turnServerUsername,
    'credential':this.state.turnServerPassword
  }
  this.iceServers.push(creds)



}

onPublishStarted = () => {
  // no need to wait a second but to make sure stream is publishng 100%
  this.publishing = true;

  if(this.state.status != STATUS_STARTED){
    this.addLog("Session started.")

    this.setState({status:STATUS_STARTED})

  }


  setTimeout(() => {
    console.log("sending stream id!")
    console.log(this.streamId)
    for(var i=0;i<this.state.controllerIdList.length;i++){
      var controllerId = this.state.controllerIdList[i]
      var jsCmd = {
        command : "setRdcStreamId",
        rdcStreamId : this.streamId.toString(),
        rdcControllerId : controllerId,
    };
    this.sendDataThroughDataChannel(JSON.stringify(jsCmd))

    }





  }, 1000)


}

sendDataThroughDataChannel = (data) =>{ // data is string

  try {
			var iceState = this.dataChannelWebRtcAdaptor.iceConnectionState(this.hostId);
            if (iceState != null && iceState != "failed" && iceState != "disconnected") {

        this.dataChannelWebRtcAdaptor.sendData(this.hostId,data);

			}
			else {
				alert("");
			}
		}
		catch (exception) {
			console.error(exception);
			alert("Message cannot be sent. Make sure you've enabled data channel on server web panel");
		}


}

onRemoteDesktopControlEvent = (controlEvent) =>{
  console.log("on remote desktop control event!!")
  controlEvent = JSON.parse(controlEvent)

  console.log(controlEvent)
  var command = controlEvent.command
  var type = controlEvent.type
   if(command == "startRdc"){
    console.log("START REMOTE DESKTOP CONTROL CAME!")
    var controllerId =  controlEvent.rdcControllerId
    console.log(controllerId)
    this.onControllerStartRemoteDesktopControl(controllerId)

  }else if(command == "rdcStopControlling"){
    console.log("START REMOTE DESKTOP CONTROL CAME!")
    var controllerId =  controlEvent.rdcControllerId
    this.onControllerStopRemoteDesktopControl(controllerId)
  }else if(type == "controlAction"){

    this.sendControlEventToElectronForExecution(controlEvent.event)

  }

}


sendControlEventToElectronForExecution = (event) =>{
 console.log("SEND CONTROL EVENT TO ELECTRON FOR EXECUTION!")
 var eventStr = JSON.stringify(event)
 console.log(eventStr)
 window.electron.ipcRenderer.sendMessage('controlEvent', eventStr);
}

save = (key,value)=>{
  var keyValueData = {
    "key":key,
    "value":value
  }
  console.log(keyValueData)
  window.electron.ipcRenderer.sendMessage('save', JSON.stringify(keyValueData));



}


componentDidMount(){
  this.getStorage()
  window.electron.ipcRenderer.once('storage', (arg) => {
    // eslint-disable-next-line no-console
    console.log("STORAGE DATA ARRIVED FROM ELECTRON!")
    console.log(arg);
    this.storageData = JSON.parse(arg)
    if(this.storageData != undefined){
      var webSocketUrl = this.storageData.webSocketUrl
      var sessionName = this.storageData.sessionName
      var autoStartAcceptingConnections = this.storageData.autoStartAcceptingConnections
      var hostId = this.storageData.hostId
      var constantHostId = this.storageData.constantHostId
      var turnServerUrl = this.storageData.turnServerUrl
      var turnServerUsername = this.storageData.turnServerUsername
      var turnServerPassword = this.storageData.turnServerPassword
      var launchAtStartup = this.storageData.launchAtStartup

      if(turnServerUsername == ''){
        turnServerUsername = "test"
      }

      if(turnServerPassword == ''){
        turnServerPassword = "test"
      }


      if(webSocketUrl != undefined){
        this.setState({webSocketUrl:webSocketUrl})
      }
      if(sessionName != undefined){
        this.setState({sessionName:sessionName})
      }

      if(turnServerUrl != undefined){

        this.setState({turnServerUrl:turnServerUrl,turnServerUsername:turnServerUsername,turnServerPassword:turnServerPassword})

      }

      if(hostId != undefined && constantHostId == true){

        this.checkSaveHostIdMenu()


        this.hostId = hostId
        this.saveHostIdCheckboxChecked = true

        this.setState({hostId:this.hostId})
      }

      if(launchAtStartup == true){

        this.checkLaunchAtStartupMenu()
      }

      if(autoStartAcceptingConnections != undefined && webSocketUrl!= undefined && autoStartAcceptingConnections == true){


        this.checkAutoStartAcceptingConnectionsMenu()



        this.setState({
          webSocketUrl:webSocketUrl, turnServerUrl:turnServerUrl,turnServerUsername:turnServerUsername,turnServerPassword:turnServerPassword
        },()=>{
          this.startAcceptingConnections()

        });


      }





    }

  });

  window.electron.ipcRenderer.on('enableTurn', (arg) => {


    console.log("ENABLE TURN CALLED!")
    this.setState({showTurnConfigurationDialog:true})

  })

  window.electron.ipcRenderer.on('saveHostId', (arg)=>{

    console.log(arg)
    this.saveHostIdCheckboxCheckHandler(arg)



  })


  window.electron.ipcRenderer.on('autoStartAcceptingConnections',(arg)=>{

    console.log(arg)
    this.autoStartAcceptingConnectionsCheckboxCheckHandler(arg)



  })

  window.electron.ipcRenderer.on('launchAtStartup',(arg)=>{

    console.log(arg)
    this.launchAtStartupCheckboxCheckHandler(arg)



  })



}

renderStatusText = () =>{
if(this.state.status == STATUS_IDLE){
  return(        <span>Idle</span>
  )

}else if(this.state.status == STATUS_HOST_COULDNT_CONNECT){
  return(        <span>Host couldnt connect to AMS. Check websocket url</span>
  )
}
else if(this.state.status == STATUS_PREPARING){
  return(        <span>Preparing</span>
  )
}else if(this.state.status == STATUS_READY){
  return(<span>Waiting for connections</span>
  )

}else if(this.state.status == STATUS_STARTED){
  return( <span>Session started</span>
  )

}else if(this.state.status == STATUS_CONTROLLER_CONNECTING){
  return(
    <span>Controller connecting...</span>
  )
}

}

handleWebSocketUrlInput = (event) =>{

  this.setState({webSocketUrl: event.target.value});

}

handleTurnServerUrlInput = (event) =>{
  this.setState({turnServerUrl: event.target.value});
}

handleTurnServerUsernameInput = (event) =>{
  this.setState({turnServerUsername: event.target.value});
}

handleTurnServerPasswordInput = (event) =>{
  this.setState({turnServerPassword: event.target.value});
}

handleSessionNameInput = (event) =>{

  this.setState({sessionName: event.target.value});

}

renderHostId = () => {

if(this.state.hostId != null){
  return(
    <span>Host ID: {this.state.hostId}</span>

  )

}

}

addLog = (logText) =>{

  this.setState({log:this.state.log+logText+"\n"})
  this.logBoxRef.current.scrollTop = this.logBoxRef.current.scrollHeight;

}

renderControllerList = () => {
  return (
    <div>
      <span>Controller List({this.state.controllerIdList.length}):</span>
      {this.state.controllerIdList.map((controllerId) => (
        <div key={controllerId + Math.random()} style={{ display: "flex" }}>
          <span style={{ color: "white", fontSize: "14px" }}>Controller: {controllerId}</span>
        </div>
      ))}
    </div>
  );
};

startAcceptingConnections = ()=> {
  if(this.state.status == STATUS_PREPARING){
    return
  }


  this.setState({status: STATUS_PREPARING});

  this.initDataChannelWebRtcAdaptor()

}

stopAcceptingConnections = ()=> {
  if(this.state.status == STATUS_PREPARING){
    return
  }

  this.publishing = false;

  this.setState({status: STATUS_IDLE, controllerSessionIdList:[]});

  this.dataChannelWebRtcAdaptor.closeWebSocket()

  this.addLog("Disconnected from Ant Media Server")

}


finishSession = () =>{

this.screenPublisherWebRtcAdaptor.stop(this.streamId)
this.addLog("Session finished.")
this.publishing = false;
this.setState({status: STATUS_IDLE, controllerIdList:[]});

var jsCmd = {
  command : "rdcFinish",

};
this.sendDataThroughDataChannel(JSON.stringify(jsCmd))


this.dataChannelWebRtcAdaptor.closeWebSocket()
this.screenPublisherWebRtcAdaptor.closeWebSocket()


}

//not used this checkbox moved to top menu.
renderAutoStartAcceptingConnectionsCheckBox = ()=> {

  return(

    <input type="checkbox" checked={this.state.autoStartAcceptingConnectionsCheckboxChecked} onChange={this.autoStartAcceptingConnectionsCheckboxCheckHandler} />

  )


}

renderSaveHostIdCheckBox = ()=>{
  return(

    <input type="checkbox" checked={this.state.saveHostIdCheckboxChecked} onChange={this.saveHostIdCheckboxCheckHandler} />

  )

}

saveHostIdCheckboxCheckHandler = (checked)=>{

  console.log("save host id checkbox check handler called!")
  console.log(checked)
  this.saveHostIdCheckboxChecked = checked

  if(checked && this.hostId != null){
    this.save("hostId", this.hostId)

  }

  this.save("constantHostId", this.saveHostIdCheckboxChecked)



}

//not used. this checkbox moved to top menu.
autoStartAcceptingConnectionsCheckboxCheckHandler  = (checked) =>{
  console.log("auto start accepting connections checkbox check handler called!")

  console.log(checked)

  this.autoStartAcceptingConnectionsCheckboxChecked = checked
  this.save("autoStartAcceptingConnections", this.autoStartAcceptingConnectionsCheckboxChecked)



}

launchAtStartupCheckboxCheckHandler  = (checked) =>{

  this.launchAtStartup = checked
  this.save("launchAtStartup", checked)



}

renderActionButton = () =>{

  if(this.state.status == STATUS_IDLE || this.state.status == STATUS_HOST_COULDNT_CONNECT){
    return(
      <button onClick={ () => this.startAcceptingConnections()}>Start Accepting Connections</button>

    )
  }else if(this.state.status == STATUS_READY){

    return(
      <button onClick={ () => this.stopAcceptingConnections()}>Stop Accepting Connections</button>

    )


  }else if(this.state.status == STATUS_PREPARING){

    return(
      <button>Preparing...</button>

    )

  }else if(this.state.status == STATUS_STARTED){
    return(
      <button onClick={ () => this.finishSession()}>Finish Session</button>

    )

  }

}

renderShareYourHostIdWithControllerText = () => {
  if(this.state.status == STATUS_READY){
    return(<span>Share your host id with controller.</span>)
  }

}

handleTurnConfigurationDialogClose = ()=> {

  this.setState({showTurnConfigurationDialog:false})

}

renderTurnConfigurationDialog = ()=>{
if(this.state.showTurnConfigurationDialog){
  return(
    <div>

  <Dialog


  onClose={this.handleTurnConfigurationDialogClose}

    open={true}
    >
              <DialogContent>

                <div style={{display:'flex',flexDirection:'column',background:'white'}}>
          <h1 color='white'>Turn Server Configuration</h1>
          <span>Turn server is not required. By default google stun is used.</span>
          <input type="text" style={{width:"200px",marginTop:"5px"}} placeholder='turn server url' value={this.state.turnServerUrl} onChange={this.handleTurnServerUrlInput} />
          <input type="text" style={{width:"150px",marginTop:"5px"}} placeholder='turn server username'  value={this.state.turnServerUsername} onChange={this.handleTurnServerUsernameInput} />
          <input type="text" style={{width:"150px",marginTop:"5px"}} placeholder='turn server password' value={this.state.turnServerPassword} onChange={this.handleTurnServerPasswordInput} />
          <button onClick={()=>this.saveTurnServerCredentials()} style={{backgroundColor:'#007BFF',marginTop:'10px','color':'white'}}>Save</button>

                </div>

        </DialogContent>

  </Dialog>


    </div>
  )


}




}

openAntMediaWebsite = ()=> {

  window.electron.ipcRenderer.sendMessage('openAntMediaWebsite');

}

  render() {


    return (
      <div style={{marginTop:'25px',color: "#FFFFFF",fontSize:"16px"}}>

        <div style={{display:"flex",flexDirection:"column",alignItems:"center"}}>
        <img width="250px" alt="icon" src={logo} />

        <input type="text" style={{width:"400px",marginTop:"20px"}} placeholder='web socket url (example:ws://localhost:5080/tunadesk/websocket)' value={this.state.webSocketUrl} onChange={this.handleWebSocketUrlInput} />

        <input type="text" style={{width:"200px",marginTop:"5px"}} placeholder='session name' value={this.state.sessionName} onChange={this.handleSessionNameInput} />

<div style={{marginTop:"15px"}}>
{this.renderStatusText()}

</div>

<div style={{marginTop:"15px"}}>
{this.renderHostId()}

</div>
<div style={{marginTop:"15px",display:"flex",flexDirection:"column"}}>
{this.renderControllerList()}
</div>
<div style={{marginTop:"15px",display:"flex",flexDirection:"column"}}>
<span>Event Log</span>
<textarea readOnly ref={this.logBoxRef} style={{    height:"75px",
    width:"400px", overflowY: "auto",fontFamily
    :"Danzza"}}  id="logTextBox" value={this.state.log}></textarea>

</div>



<div style={{marginTop:"15px"}}>
{this.renderActionButton()}

</div>
<div style={{marginTop:"5px"}}>
{this.renderShareYourHostIdWithControllerText()}
</div>

        </div>

        {this.renderTurnConfigurationDialog()}
        <div onClick={() => this.openAntMediaWebsite()} style={{cursor:'pointer',display:"flex",alignItems:'center',position: 'fixed',left:'50%',  bottom: '5px', transform:'translate(-50%, -50%)',margin:'margin: 0 auto'
}}>
        <span>by</span>
        <img style={{marginLeft:'10px'}} width="100px" alt="icon" src={antmedialogo} />

        </div>

      </div>
    );

  }
}
