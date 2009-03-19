function GestureHandlerModule(owner) {
  this._owner = owner;
}

GestureHandlerModule.prototype = {
  _owner: null,

  _grabbing: false,

  _preGrabData: {
    firstClickX: 0,
    firstClickY: 0,
    time: Date.now(),
    shouldGrab: false,

    reset: function() {
      this.time = 0;
      this.shouldGrab = false;
    }
  },

  handleEvent: function(aEvent) {
    
    switch (aEvent.type) {
      case "mousedown":
      // exit early for events outside displayed content area
      if (aEvent.target !== document.getElementById("browser-canvas"))
        return;
        this._onMouseDown(aEvent);
        break;
      case "mouseup":
        this._onMouseUp(aEvent);
        break;
      case "mousemove":
        this._onMouseMove(aEvent);
        break;
    }
  },

  cancelPending: function() {
    this._preGrabData.reset();
  },

  _onMouseMove: function(aEvent) {
    if (this._preGrabData.shouldGrab) {
      this._owner.grab(this);
      this._grabbing = true;
      this._preGrabData.reset();

      this._dispatchEvent("GestureStarted", window);

      //dump("GestureHandler: Gesture Started\n");
    }

  },

  _onMouseDown: function(aEvent) {

    let adx = Math.abs(aEvent.screenX - this._preGrabData.firstClickX);
    let ady = Math.abs(aEvent.screenY - this._preGrabData.firstClickY);

    let timeDiff = Date.now() - this._preGrabData.firstClickTime;

    if (adx > 10 || ady > 10 || timeDiff > 1000) {
      //won't grab, only update values
      this._preGrabData.firstClickX = aEvent.screenX;
      this._preGrabData.firstClickY = aEvent.screenY;
      this._preGrabData.time = Date.now();
    } else {
      this._preGrabData.shouldGrab = true;

    }
  },

  _onMouseUp: function(aEvent) {

    if (this._grabbing) {
      this._grabbing = false;
      this._owner.ungrab(this);
      this._preGrabData.reset();

      this._dispatchEvent("GestureEnded", window);

      //dump("GestureHandler: Gesture ended\n");
    }

  },

  _dispatchEvent: function(name, destiny) {

    let gEvent = document.createEvent("Events");
    gEvent.initEvent(name, true, false);
    destiny.dispatchEvent(gEvent);

  }

};