
function injectScriptJs() {
  var s = document.createElement('script');
  s.src = chrome.runtime.getURL('script.js');
  s.onload = function () {
      this.remove();
  };
  (document.head || document.documentElement).appendChild(s);
}

function experimental() {
  window.addEventListener("message", function (event) {
      // We only accept messages from ourselves
      if (event.source != window)
          return;

      if (event.data.type && (event.data.type == "FROM_PAGE")) {
          console.log("Content script received: " + event.data.text);
          chrome.runtime.sendMessage({type: "FROM_PAGE", text: event.data.text}, function (response) {
              console.log(response);
          });
      }
  }, false);
}

var socket;

function initSocketIO() {
  console.log("init socket io");
  socket = io('http://localhost:3000', {transports: ['polling']});
  console.log('client connected')
  setInterval(()=>{ console.log("emit"); socket.emit('my_ping', 'ping!'); }, 2000)
  
  socket.on('my_pong', function (msg) {
      console.log(msg)
  });
}

const storageGet = 
  keys => new Promise(resolve => chrome.storage.sync.get(keys, resolve));

async function loadRoomId() {
  let roomId = (await storageGet(["roomId"])).roomId;
  console.log("Got roomId="+roomId, socket);
  socket.emit("setRoomId", roomId);
}

async function doInit() {
  if (window.hasOneTwoThree) {
    console.log("Skip content_script.js (already initialized)");
    return;	
  }
  window.hasOneTwoThree = true;
  
  console.log("start init OneTwoThree");
  injectScriptJs();
  experimental();	
  initSocketIO();
  await loadRoomId();

  document.addEventListener('rdt.setRoomId', function (e) {
  	console.log(e);
    console.log("set roomId="+e.detail.roomId);
  }); 

  console.log("finish init OneTwoThree");
}

function init() {
  var initPromise = doInit();
}


init();
