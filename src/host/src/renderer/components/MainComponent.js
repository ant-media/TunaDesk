import React, { Component } from 'react'
import { WebRTCAdaptor } from '../js/webrtc_adaptor';
import logo from '../../../assets/logo.png';

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
      controllerSessionIdList : [],
      autoStartAcceptingConnectionsCheckboxChecked:false,
      saveHostIdCheckboxChecked:false

    }
    this.hostId =  null;
    this.webRTCAdaptor = null;
    this.streamId = null;
    this.publishing = false;
    this.logBoxRef = React.createRef()
  }


  generateId = () => {
    return Math.floor(100000 + Math.random() * 900000);
  }

   initWebRTCAdaptor = () => {
    console.log("init webrtc adaptor")
      this.webRTCAdaptor = new WebRTCAdaptor({
      websocket_url: this.state.webSocketUrl,
      mediaConstraints: mediaConstraints,
      peerconnection_config: {
          'iceServers': [{'urls': 'stun:stun1.l.google.com:19302'}]
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

            if(this.hostId == null){
              this.hostId = this.generateId()
              this.setState({hostId:this.hostId})
              if(this.state.saveHostIdCheckboxChecked){
                this.save("hostId",this.hostId)
              }
            }

            this.webRTCAdaptor.createRdcSession(this.state.sessionName, this.hostId)
            this.setState({status:STATUS_READY})
            this.addLog("Waiting for connections.")

            this.save("webSocketUrl",this.state.webSocketUrl)
            this.save("sessionName",this.state.sessionName)

            console.log("set status to ready!")
        }else if(info == "startRdc"){
          console.log("START REMOTE DESKTOP CONTROL CAME!")
          var controllerSessionId =  obj.rdcControllerSessionId
          this.onControllerStartRemoteDesktopControl(controllerSessionId)

        }else if(info == "rdcControllerStopped"){
          console.log("START REMOTE DESKTOP CONTROL CAME!")
          var controllerSessionId =  obj.rdcControllerSessionId
          this.onControllerStopRemoteDesktopControl(controllerSessionId)
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

  //webRTCAdaptor.publish("qwe")
   // window.webRTCAdaptor = webRTCAdaptor;
  }





startPublishing = () => {
  console.log("STARTING TO PUBLISH!")
 this.streamId = this.generateId().toString()
this.webRTCAdaptor.publish(this.streamId)

}

onControllerStartRemoteDesktopControl = (controllerSessionId) =>{
console.log("REMOTE DESKTOP CONTROL REQUEST CAME!")
console.log(controllerSessionId)
this.state.controllerSessionIdList.push(controllerSessionId);
this.addLog("Controller has been connected with session id: "+ controllerSessionId)
this.setState({ controllerSessionIdList:this.state.controllerSessionIdList })


if(!this.publishing){
  this.startPublishing()

}else{
  this.webRTCAdaptor.setRdcStreamIdOnController(controllerSessionId, this.streamId, this.hostId)

}
//this.setState({status:STATUS_CONTROLLER_CONNECTING})

}

onControllerStopRemoteDesktopControl = (controllerSessionId) =>{
  console.log("REMOTE DESKTOP CONTROL STOP CONTROLLER")
  console.log(controllerSessionId)
  var controllerIndex = this.state.controllerSessionIdList.indexOf(controllerSessionId);
  if (controllerIndex !== -1) {
  this.state.controllerSessionIdList.splice(controllerIndex, 1);
  }
  this.addLog("Controller has been disconnected with session id: "+ controllerSessionId)
  this.setState({ controllerSessionIdList:this.state.controllerSessionIdList })

  //this.setState({status:STATUS_CONTROLLER_CONNECTING})

}


getStorage = () =>{

 window.electron.ipcRenderer.sendMessage('getStorage');

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
    for(var i=0;i<this.state.controllerSessionIdList.length;i++){
      var controllerSessionId = this.state.controllerSessionIdList[i]
      this.webRTCAdaptor.setRdcStreamIdOnController(controllerSessionId, this.streamId, this.hostId) // actually no need to send this.hostId here. it can be stored on server and can be retrieved there too. but its required atm.
    }

  }, 1000)


}

onRemoteDesktopControlEvent = (controlEvent) => {
  controlEvent = JSON.parse(controlEvent)
  console.log("ON REMOTE DESKTOP CONTROL EVENT!")
  console.log(controlEvent)

if(controlEvent.type == "controlAction"){
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

      if(webSocketUrl != undefined){
        this.setState({webSocketUrl:webSocketUrl})
      }
      if(sessionName != undefined){
        this.setState({sessionName:sessionName})
      }

      if(autoStartAcceptingConnections != undefined && webSocketUrl!= undefined && autoStartAcceptingConnections == true){

        this.setState({
          autoStartAcceptingConnectionsCheckboxChecked: true, webSocketUrl:webSocketUrl
        },()=>{
          this.startAcceptingConnections()

        });


      }

      if(hostId != undefined && constantHostId == true){
        this.hostId = hostId
        this.setState({hostId:this.hostId,saveHostIdCheckboxChecked:true})
      }

    }

  });



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
      <span>Controller List({this.state.controllerSessionIdList.length}):</span>
      {this.state.controllerSessionIdList.map((controllerSessionId) => (
        <div key={controllerSessionId + Math.random()} style={{ display: "flex" }}>
          <span style={{ color: "white", fontSize: "14px" }}>Controller: {controllerSessionId}</span>
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


  this.initWebRTCAdaptor(false)


}

stopAcceptingConnections = ()=> {
  if(this.state.status == STATUS_PREPARING){
    return
  }

  this.publishing = false;

  this.setState({status: STATUS_IDLE, controllerSessionIdList:[]});
  this.webRTCAdaptor.closeWebSocket()
  this.addLog("Disconnected from Ant Media Server")

}


finishSession = () =>{

this.webRTCAdaptor.stop(this.streamId)
this.addLog("Session finished.")
this.publishing = false;
this.setState({status: STATUS_IDLE, controllerSessionIdList:[]});
this.webRTCAdaptor.finishRdcSession(this.hostId)

}

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

saveHostIdCheckboxCheckHandler = ()=>{

  this.setState({
    saveHostIdCheckboxChecked: !this.state.saveHostIdCheckboxChecked,
  }, ()=>{
    this.save("constantHostId",this.state.saveHostIdCheckboxChecked)

  })




}

autoStartAcceptingConnectionsCheckboxCheckHandler  = () =>{
  console.log("HANDLER CALLED!")
  console.log(this.state.autoStartAcceptingConnectionsCheckboxChecked)
  this.setState({
    autoStartAcceptingConnectionsCheckboxChecked: !this.state.autoStartAcceptingConnectionsCheckboxChecked,
  },() => {
    console.log(this.state.autoStartAcceptingConnectionsCheckboxChecked)
    this.save("autoStartAcceptingConnections", this.state.autoStartAcceptingConnectionsCheckboxChecked)

   console.log("SAVINGGG")
});;


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

  render() {


    return (
      <div style={{color: "#FFFFFF",fontSize:"16px"}}>

        <div style={{display:"flex",flexDirection:"column",alignItems:"center"}}>
        <img width="250px" alt="icon" src={logo} />

        <input type="text" style={{width:"400px"}}  value={this.state.webSocketUrl} onChange={this.handleWebSocketUrlInput} />
        <input type="text" style={{width:"200px",marginTop:"5px"}}  value={this.state.sessionName} onChange={this.handleSessionNameInput} />

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
    width:"400px", overflowY: "auto"}}  id="logTextBox" value={this.state.log}></textarea>

</div>
<div style={{display:"flex",justifyContent:"center"}}>
<div style={{display:"flex",flexDirection:"column"}}>
<span>Auto start accepting connections on app startup</span>

  {this.renderAutoStartAcceptingConnectionsCheckBox()}
</div>
<div style={{display:"flex",flexDirection:"column",marginLeft:"10px"}}>
<span>Save hostId</span>

  {this.renderSaveHostIdCheckBox()}
</div>
</div>


<div style={{marginTop:"15px"}}>
{this.renderActionButton()}

</div>
<div style={{marginTop:"5px"}}>
{this.renderShareYourHostIdWithControllerText()}
</div>

        </div>

      </div>
    );

  }
}
