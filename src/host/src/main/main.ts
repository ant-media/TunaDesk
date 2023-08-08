/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import { app, BrowserWindow, shell, ipcMain, desktopCapturer,Menu,dialog } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';
import Storage from './Storage';
const os = require('os');
var robot = require("@jitsi/robotjs");

// Speed up the mouse.
robot.setMouseDelay(1);

var twoPI = Math.PI * 2.0;
var screenSize = robot.getScreenSize();
var height = (screenSize.height / 2) - 10;
var width = screenSize.width;


class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}
const storage = new Storage({configName: 'user-preferences',defaults : {}
})



let mainWindow: BrowserWindow | null = null;
ipcMain.on('save', async(event,arg) =>{

  var keyValueData = JSON.parse(arg)
  storage.set(keyValueData.key,keyValueData.value)

})
ipcMain.on('getStorage', async(event,arg) =>{

  mainWindow.webContents.send('storage', JSON.stringify(storage.data))

})
var openAtLogin = storage.get("openAtLogin")
if(openAtLogin == undefined){
  openAtLogin = false
}

app.setLoginItemSettings({
  openAtLogin: openAtLogin,
  path: app.getPath("exe")
});


ipcMain.on('controlEvent', async (event, arg) => {


  var controlEvent = JSON.parse(arg);
  var controlEventType = controlEvent.event;

  if (controlEventType == "mousemove") {
    var mouseX = parseInt(controlEvent.x * controlEvent.screenWidth);
    var mouseY = parseInt(controlEvent.y * controlEvent.screenHeight);
    console.log("mouse x: " + mouseX + " mouse y: " + mouseY + " screen size:" + controlEvent.screenWidth + "x" + controlEvent.screenHeight);
    robot.moveMouse(mouseX, mouseY);
  }
  else if (controlEventType == "click") {
/*      0: Main button pressed, usually the left button or the un-initialized state
  1: Auxiliary button pressed, usually the wheel button or the middle button (if present)
  2: Secondary button pressed, usually the right button
  3: Fourth button, typically the Browser Back button
  4: Fifth button, typically the Browser Forward button
*/
    var button = "left";
    if (controlEvent.button == 1) {
       button = "middle";
    }
    else if (controlEvent.button == 2) {
       button = "right";
    }
    robot.mouseClick(button);
  }else if(controlEventType == "wheel"){

      var deltaX = controlEvent.deltaX;
      var deltaY = controlEvent.deltaY;

    // on Windows, deltaY scrolling is inverted compared to OS X and Linux
    if(os.platform() === "win32") {
      deltaY = -deltaY;
    }

    robot.scrollMouse(deltaX, deltaY);

  }else if(controlEventType == "mousedown"){

    robot.mouseToggle('down');


  }
  else if(controlEventType == "mousedrag"){
    console.log('recieved mouse drag!!');
    var mouseX = parseInt(controlEvent.x * controlEvent.screenWidth);
    var mouseY = parseInt(controlEvent.y * controlEvent.screenHeight);
    console.log("mouse x: " + mouseX + " mouse y: " + mouseY + " screen size:" + controlEvent.screenWidth + "x" + controlEvent.screenHeight);
    robot.dragMouse(mouseX, mouseY);

  }
  else if(controlEventType == "mouseup"){
    robot.mouseToggle('up')
  }
  else if (controlEventType == "keydown") {
    var modifier = Array();
    if (controlEvent.shiftKey) {
       modifier.push("shift");
    }
    if (controlEvent.ctrlKey) {
       modifier.push("control");
    }
    if (controlEvent.altKey) {
       modifier.push("alt");
    }
    if(controlEvent.key == "ArrowLeft"){
      robot.keyTap("left", modifier);

    }
    if(controlEvent.key == "ArrowRight"){
      robot.keyTap("right", modifier);
      return

    }
    if(controlEvent.key == "ArrowUp"){
      robot.keyTap("up", modifier);
      return

    }
    if(controlEvent.key == "ArrowDown"){
      robot.keyTap("down", modifier);
      return

    }
    if(controlEvent.key == "CapsLock"){
      robot.keyTap('capslock');
      return
    }
    if(controlEvent.key == "Tab"){
      robot.keyTap('tab');
      return
    }
    if(controlEvent.key == "i"){
      robot.typeString("i")
      return
    }
    if(controlEvent.key == "ğ"){
      robot.typeString("ğ")
      return;
    }
    if(controlEvent.key == "ş"){
      robot.typeString("ş")
      return;
    }
    if(controlEvent.key == "ı"){
      robot.typeString("ı")
      return;
    }
    if(controlEvent.key == "ç"){
      robot.typeString("ç")
      return;
    }
    if(controlEvent.key == "ö"){
      robot.typeString("ö")
      return;
    }
    if(controlEvent.key == "ü"){
      robot.typeString("ü")
      return;
    }
    if(controlEvent.key == "á"){
      robot.typeString("á")
      return;
    }
    if(controlEvent.key == "é"){
      robot.typeString("é")
      return;
    }
    if(controlEvent.key == "í"){
      robot.typeString("í")
      return;
    }

    if(controlEvent.key == "ó"){
      robot.typeString("ó")
      return;
    }

    if(controlEvent.key == "ú"){
      robot.typeString("ú")
      return;
    }

    if(controlEvent.key == "ñ"){
      robot.typeString("ñ")
      return;
    }

    if(controlEvent.key == "¿"){
      robot.typeString("¿")
      return;
    }


    robot.keyTap(controlEvent.key.toLowerCase(), modifier);
  }







});

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}



const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')();
}



const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload
    )
    .catch(console.log);
};


const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width:500,
    height:750,
    icon: getAssetPath('logo.png'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
        nodeIntegration:true,

    },
  });
  desktopCapturer.getSources({ types: ['window', 'screen'] }).then(async sources => {

    console.log("will send source id "+ sources[0].id)
     mainWindow.webContents.send('setSource', sources[0].id)

 /*    for (const source of sources) {
      console.log(source.name)
      if (source.name === 'Electron') {
       // mainWindow.webContents.send('SET_SOURCE', source.id)
        return
      }
    } */
  })

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const isMac = process.platform === 'darwin';

  // Define the menu template
  const menuTemplate = [
    // Add a "Settings" menu
    {
      label: 'Settings',

      submenu: [
        // Add an "Auto Start" option with a checkbox
        {
          label: 'Auto start accepting connections on app startup',
          type: 'checkbox',
          id:'autoStartAcceptingConnectionsMenu',
          checked: false,
          click: (menuItem) => {
           if(menuItem.checked){

            mainWindow.webContents.send('autoStartAcceptingConnections',true)

            dialog.showMessageBox({
              type: 'info',
              title:"TunaDesk",
              message: "After relaunching Tunadesk, it will automatically start accepting control connections without requiring you to click the 'Start Accepting Connections' button.",
              buttons: ['OK']
            }, (response) => {
              if (response === 0) {
                // OK button was clicked
              }
            })
           }else{
            mainWindow.webContents.send('autoStartAcceptingConnections',false)


           }
          }
        },
        {
          label: 'Save hostId',
          id:'saveHostIdMenu',
          type: 'checkbox',
          checked: false,
          click: (menuItem) => {
            if(menuItem.checked){
              mainWindow.webContents.send('saveHostId',true)


              dialog.showMessageBox({
                type: 'info',
                title:"TunaDesk",
                message: "The host ID will be stored and will remain constant, retaining the same value across app restarts.",
                buttons: ['OK']
              }, (response) => {
                if (response === 0) {
                  // OK button was clicked
                }
              })
             }else{
              mainWindow.webContents.send('saveHostId', false)

             }


          }
        },
        {
          label: 'TURN Configuration',
          checked: false,
          click: (menuItem) => {
              mainWindow.webContents.send('enableTurn')

          }
        },
        {
          label: 'Launch TunaDesk at system startup',
          type: 'checkbox',
          id:'launchAtStartupMenu',
          checked: false,
          click: (menuItem) => {
           if(menuItem.checked){

            mainWindow.webContents.send('launchAtStartup', true)
            app.setLoginItemSettings({
              openAtLogin: true,
              path: app.getPath("exe")
            });

            dialog.showMessageBox({
              type: 'info',
              title:"TunaDesk",
              message: "Tunadesk will automaticly launch on system start.",
              buttons: ['OK']
            }, (response) => {
              if (response === 0) {
                // OK button was clicked
              }
            })
           }else{
            mainWindow.webContents.send('launchAtStartup', false)
            app.setLoginItemSettings({
              openAtLogin: false,
              path: app.getPath("exe")
            });

           }
          }
        },
      ]
    }
  ];

  // Create the menu
  const menu = Menu.buildFromTemplate(menuTemplate);

  // Set the menu for the app
  Menu.setApplicationMenu(menu);



  ipcMain.on('checkAutoStartAcceptingConnectionsMenu', async (event,arg) =>{

    const autoStartMenuItem = Menu.getApplicationMenu().getMenuItemById('autoStartAcceptingConnectionsMenu');

    // Check the checkbox
    autoStartMenuItem.checked = true;

    })


    ipcMain.on('checkSaveHostIdMenu', async (event,arg) =>{

      const saveHostIdMenuItem = Menu.getApplicationMenu().getMenuItemById('saveHostIdMenu');

      // Check the checkbox
      saveHostIdMenuItem.checked = true;

      })

      ipcMain.on('checkLaunchAtStartupMenu', async (event,arg) =>{

        const launchAtStartupMenuItem = Menu.getApplicationMenu().getMenuItemById('launchAtStartupMenu');

        // Check the checkbox
        launchAtStartupMenuItem.checked = true;

        })

        ipcMain.on('openAntMediaWebsite', async(event,arg)=>{

          shell.openExternal("https://www.antmedia.io")

        })

  //const menuBuilder = new MenuBuilder(mainWindow);
  //menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });
  //createPopupWindow();

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line



  new AppUpdater();
  const win = BrowserWindow.getAllWindows()[0];
  const ses = win.webContents.session;
  ses.clearCache();
};




/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app
  .whenReady()
  .then(() => {
    createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);
