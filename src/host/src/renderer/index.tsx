import { createRoot } from 'react-dom/client';
import App from './App';


// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.

// override getDisplayMedia
console.log("override!!")
navigator.mediaDevices.getDisplayMedia = async () => {
  console.log("asddsjsdfjksdfjkdsl")

  const selectedSource = await globalThis.myCustomGetDisplayMedia();
  console.log("asddsjsdfjksdfjkdsl")
  console.log(selectedSource)
  // create MediaStream
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      mandatory: {
        chromeMediaSource: "desktop",
        chromeMediaSourceId: selectedSource,
      },
    },
  });
  console.log(stream)
  return stream;
};

const container = document.getElementById('root')!;
const root = createRoot(container);
root.render(<App />);

// calling IPC exposed from preload script
window.electron.ipcRenderer.once('ipc-example', (arg) => {
  // eslint-disable-next-line no-console
  console.log(arg);
});
window.electron.ipcRenderer.sendMessage('ipc-example', ['ping']);
