// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

export type Channels = 'ipc-example';
var source: null = null;
const electronHandler = {
  ipcRenderer: {
    sendMessage(channel: Channels, args: unknown[]) {
      ipcRenderer.send(channel, args);
    },
    on(channel: Channels, func: (...args: unknown[]) => void) {
      const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
        func(...args);
      ipcRenderer.on(channel, subscription);

      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    },
    once(channel: Channels, func: (...args: unknown[]) => void) {
      ipcRenderer.once(channel, (_event, ...args) => func(...args));
    },
  },
};

ipcRenderer.on("setSource", async (event, sourceId) =>{

  console.log("SOURCE CAME!")
  console.log(sourceId)
  source = sourceId

})
contextBridge.exposeInMainWorld('electron', electronHandler);

contextBridge.exposeInMainWorld("myCustomGetDisplayMedia", async () => {
  console.log("custom get display media called!")

  return source;
});





export type ElectronHandler = typeof electronHandler;
