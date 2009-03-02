/*
  Module which draws the gesture on the screen
*/
function GestureTrail() {

  let canvas = document.getElementById("trailCanvas");
  this._cv = canvas.getContext("2d");
  this._canvasContainer = document.getElementById("containerForCanvas");
  
  if (!this._cv || !this._canvasContainer)
    return;

  this._cv.lineJoin = 'round';
  
  let self = this;

  window.addEventListener("GestureStarted", function() { self._gestureStarted(); }, false);
  window.addEventListener("GestureEnded"  , function() { self._gestureEnded();   }, false);

  window.addEventListener("mousemove", function(aEvent) { self._mouseMove(aEvent); }, false);

  return this;
}

GestureTrail.prototype = {

  _grabbing: false,
  _shouldGrab: false,

  _cv: null,
  _canvasContainer: null,

  _gestureStarted: function() {
    this._shouldGrab = true;

    this._canvasContainer.hidden = false;
    this._cv.beginPath();
  },


  _gestureEnded: function() {
    this._grabbing = false;

    this._cv.closePath();
    this._cv.clearRect(0, 0, this._cv.canvas.width, this._cv.canvas.height);
    this._canvasContainer.hidden = true;
  },

  _mouseMove: function(aEvent) {

    if (this._grabbing) {
      this._cv.lineTo(aEvent.pageX, aEvent.pageY);
      this._cv.stroke();
    }
    
    if (this._shouldGrab) {
      this._shouldGrab = false;
      this._grabbing = true;
      this._cv.moveTo(aEvent.pageX, aEvent.pageY);
    }

  }

}