//User-experience file

function setGestureListeners() {
  window.addEventListener("Gesture_Star", function() { BrowserUI.doCommand("cmd_star"); }, false);
  window.addEventListener("Gesture_Wave", function() { BrowserUI.doCommand("cmd_star"); NotificationSystem.notify("Bookmarked"); }, false);
  window.addEventListener("Gesture_U", function() { BrowserUI.showBookmarks(); }, false);
  window.addEventListener("Gesture_Eight", function() { NotificationSystem.notify("Hello World"); }, false);
  window.addEventListener("Gesture_Twirl", function() { NotificationSystem.notify("Do the twist!"); }, false);
  window.addEventListener("Gesture_House", function() { getBrowser().loadURI("http://www.mozilla.com", null, null, false); }, false);
  window.addEventListener("Gesture_Infinity", function() { NotificationSystem.notify("∞"); }, false);
  window.addEventListener("Gesture_Square", function() { NotificationSystem.notify("Square!"); }, false);

  window.addEventListener("Gesture_X", function() { BrowserUI.closeTab(Browser._currentTab); }, false);
  window.addEventListener("Gesture_RotateClockwise", function() { Browser.canvasBrowser.zoom(-1) }, false);
  window.addEventListener("Gesture_RotateAnticlock", function() { Browser.canvasBrowser.zoom( 1) }, false);
  window.addEventListener("Gesture_Left", function() { BrowserUI.doCommand("cmd_back"); }, false);
  window.addEventListener("Gesture_Right", function() { BrowserUI.doCommand("cmd_forward"); }, false);

  window.addEventListener("Gesture_Up", function() {
    
    let i, goal;
    for (i = 0; i < Browser._tabs.length; i++) {
      if (Browser._currentTab == Browser._tabs[i]) {
        goal = i - 1;
        break;
      }
    }
    if (goal < 0) goal = Browser._tabs.length - 1;
    
    Browser.selectTab(Browser._tabs[goal]);
    
  }, false);  
  window.addEventListener("Gesture_Down", function() {

    let i, goal;
    for (i = 0; i < Browser._tabs.length; i++) {
      if (Browser._currentTab == Browser._tabs[i]) {
        goal = i + 1;
        break;
      }
    }
    if (goal >= Browser._tabs.length) goal = 0;
    
    Browser.selectTab(Browser._tabs[goal]);
  }, false);
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