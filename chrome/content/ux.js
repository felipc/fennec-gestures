//User-experience file

function setGestureListeners() {
  window.addEventListener("Gesture_Star", function() { BrowserUI.doCommand("cmd_star"); }, false);
  window.addEventListener("Gesture_RotateClockwise", function() { BrowserUI.newTab(); }, false);
  window.addEventListener("Gesture_RotateAnticlock", function() { BrowserUI.closeTab(Browser._currentTab); }, false);
  window.addEventListener("Gesture_U", function() { BrowserUI.showBookmarks(); }, false);
  window.addEventListener("Gesture_Eight", function() { alert("Do the twist!"); }, false);
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