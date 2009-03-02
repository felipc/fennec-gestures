//User-experience file

function setGestureListeners() {
  window.addEventListener("Gesture_Wave", function() { BrowserUI.doCommand("cmd_star"); NotificationSystem.notify("Bookmarked"); }, false);
  window.addEventListener("Gesture_U", function() { BrowserUI.showBookmarks(); }, false);
  window.addEventListener("Gesture_Eight", function() { NotificationSystem.notify("Hello World"); }, false);
  window.addEventListener("Gesture_Twirl", function() { NotificationSystem.notify("Do the twist!"); }, false);
  window.addEventListener("Gesture_House", function() { getBrowser().loadURI("http://www.mozilla.com", null, null, false); }, false);
  window.addEventListener("Gesture_Infinity", function() { document.getElementById("pieMenu").hidden = false; }, false);
  window.addEventListener("Gesture_Square", function() { NotificationSystem.notify("Square!"); }, false);
}

function setPieMenu() {
  document.getElementById("pieBook").addEventListener("click", function() { BrowserUI.doCommand("cmd_star"); NotificationSystem.notify("Bookmarked"); }, false);
  document.getElementById("pieNTab").addEventListener("click", function() { BrowserUI.newTab() }, false);
  document.getElementById("pieBack").addEventListener("click", function() { BrowserUI.doCommand("cmd_back"); }, false);
  document.getElementById("pieForw").addEventListener("click", function() { BrowserUI.doCommand("cmd_forward"); }, false);
}

let NotificationSystem = {
  _container: null,
  _currentTicker: null,
  _currentOpacity: 1,
  
  _fadeNotification: function() {
    this._currentOpacity -= 0.05;
    this._container.style.opacity = this._currentOpacity;
    if (this._currentOpacity < 0.05) {
      this._finishedFading();
    }
  },
  
  _finishedFading: function() {
    this._currentOpacity = 1;
    this._container.hidden = true;
    this._container.style.opacity = 1;
    clearInterval(this._currentTicker);

  },
  
  _startFading: function() {
    this._currentTicker = setInterval(function() {
      NotificationSystem._fadeNotification();
    }, 20);
  },
  
  notify: function(str) {
    if (this._container == null) {
      this._container = document.getElementById("notificationContainer");
    }
      
    document.getElementById("notifyArea").setAttribute("value", str);
    this._container.hidden = false;
    window.setTimeout(function() {
      NotificationSystem._startFading();
    }, 2000);
  }
};


function registerGestures(engine) {

	/* Note: names doesn't need to be unique.
	  This way it's possible to register a same gestures with various
	  starting points. Example: RotateClockwise starting at top or at bottom.
	  
	  Currently it's better to list shortest actions first.
	  
	  The letters qwedcxza corresponds to the directions (look at the keyboard).
	  */

  engine.registerGestures([
    { name: "DiagonalC", action: "c"},
    { name: "Diagonal ./", action: "z"},
    { name: "Diagonal .\\", action: "q"},
    { name: "Diagonal /.", action: "e"},
    { name: "Up", action: "w"},
    { name: "Down", action: "x"},
    { name: "Left", action: "a"},
    { name: "Right", action: "d"},
    { name: "-> <-", action: "da"},
    { name: "<- ->", action: "ad"},
    { name: "X", action: "cae"},
    { name: "X", action: "zdq"},
    { name: "Square", action: "dxaw"},
    { name: "House", action: "wecxa"},
    { name: "U", action: "xcdew"},
    { name: "InvertedU", action: "wedcx"},
    { name: "C", action: "azxcd"},
    { name: "InvertedC", action: "dcxza"},
    { name: "Wave", action: "wedcdew"},
    { name: "Wave", action: "wcwc"},
    { name: "Star", action: "ecqdz"},
    { name: "Star", action: "wxqadz"},
    { name: "Eight", action: "zxcxzaqwewqa"},
    { name: "Eight", action: "zxcdcxzawewa"},
    { name: "RotateClockwise", action: "dcxzaqwe"},
    { name: "RotateClockwise", action: "aqwedcxz"},
    { name: "Infinity", action: "wecdewqazxzaq"},
    { name: "Infinity", action: "edcdewqaza"},
    { name: "Twirl", action: "dcxzawedcxza"},
    { name: "RotateAnticlock", action: "azxcdewq"},
    { name: "DoubleClockwise", action: "dcxzaqwedcxzaqwe"},
    { name: "ClockAnticlock", action: "dcxzaqweazxcdewq"}
    ]); 
}