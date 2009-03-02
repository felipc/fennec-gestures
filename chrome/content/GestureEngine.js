/**
 * Gestures handling code
 */
function FennecGestures() {

  let self = this;

  window.addEventListener("GestureStarted", function() { self._gestureStarted(); }, false);
  window.addEventListener("GestureEnded"  , function() { self._gestureEnded();   }, false);

  window.addEventListener("mousemove", function(aEvent) { self._mouseMove(aEvent); }, false);

  return this;

}

FennecGestures.prototype = {

  _grabbing: false,
  _shouldGrab: false,

  _gestures: {},

  _learningMode: false,

  _latestMovement: null,

  _movements: {
    trail: [],
    lastX: 0,
    lastY: 0,
    lastDirection: '',
    lastDistance: 0,

    init: function(X,Y) {
      this.trail = [];
      this.lastX = X;
      this.lastY = Y;
      this.lastDirection = '';
      this.lastDistance = 0;
    }
  },

  _gestureStarted: function() {
    this._shouldGrab = true;
  },

  _gestureEnded: function() {
    this._grabbing = false;
    this._processGesture();
  },

  _mouseMove: function(aEvent) {

    /* We have two stages: _shouldGrab and _grabbing, because
     we want to ignore the very first mouseMove, since for it
     we don't have the data for the movement (the delta between
     the previous and the current X and Y) */

    if (this._grabbing) {
      this._pushMovement(aEvent);
    }

    if (this._shouldGrab) {
      this._shouldGrab = false;
      this._grabbing = true;
      this._startGesture(aEvent);
    }

  },

  registerGestures: function(gestures) {

    for each (let { action: action, name: name } in gestures) {
      this._gestures[action] = name;
    }

  },

  // This object will represent the steps that will be pushed to the trail array
  _step: function (direction, distance) {
    this.direction = direction;
    this.distance = distance;

    return this;
  },

  _newStep: function (direction, distance) {
    let step = new this._step(direction, distance);
    this._movements.trail.push(step);
  },

  _startGesture: function(aEvent) {
    this._movements.init(aEvent.screenX, aEvent.screenY);
    this._newStep('',0); //stub initial step so trail is never empty for pop()
  },

  _pushMovement: function(aEvent) {

    let x = aEvent.screenX;
    let y = aEvent.screenY;
    let dx = this._movements.lastX - x;
    let dy = this._movements.lastY - y
    let adx = Math.abs(dx);
    let ady = Math.abs(dy);

    let distance = Math.sqrt(dx*dx + dy*dy);

    if (adx < 5 && ady < 5) {
      return;
    }

    this._movements.lastX = x;
    this._movements.lastY = y;

    let mapDirections = {
      "->"  :  "d",
      "<-"  :  "a",
      "v"   :  "x",
      "^"   :  "w",
      "->v" :  "c",
      "->^" :  "e",
      "<-v" :  "z",
      "<-^" :  "q"
    };

    let direction = this._composeDirection(dx, dy, adx, ady);

    //map the composed direction to a single letter (needed for Levenshtein)
    direction = mapDirections[direction];

    if (direction == this._movements.lastDirection) {
      /* If last tracked movement didn't change direction, combine
        both movements in only one, increasing its travel distance */
      distance += (this._movements.trail.pop()).distance;
    }

    this._movements.lastDirection = direction;
    this._newStep(direction, distance);

  },

  _composeDirection: function( dx, dy, adx, ady) {

    /* This function detects the direction of the movement,
      checking if it was a straight movement (horizontal or vertical),
      or a diagonal movement, which have both components */

    //calculate tangent and consider as diagonal if between 30 and 60 degrees
    let isDiagonal = ((adx / ady < 1.73) && (adx / ady > 0.6));

    let direction = '';
    if (adx > ady || isDiagonal) {
      direction = (dx < 0) ? '->' : '<-';
    }
    if (adx < ady || isDiagonal) {
      direction += (dy < 0) ? 'v' : '^';
    }

    return direction;
  },

  _processGesture: function() {

    //Verify the average travel distance of movements
    let total = this._movements.trail.reduce(function(a,b) a + b.distance, 0);
    let average = total / this._movements.trail.length;

    /* Filter out movements below 30% of average distance.
      This helps filter out involuntary jigging */
    let filterOut = average * 0.3;
    let filteredTrail = this._movements.trail.filter(
                          function(x) x.distance > filterOut);


    let movs = this._makeTrailString(filteredTrail);

    //dump("\nResulting Movements:\n" + movs + "\n");

    this._latestMovement = movs;

    //Check which is the best match among the registered gestures
    this._bestMatch(movs);
  },

  _matchThresholds: [-1, 0, 0, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5],

  _bestMatch: function (movs) {

    let winningName = '', winningVal = 100, curValue = '', winningMov = '';

    for (let [movements, gestureName] in Iterator(this._gestures)) {

       /* Calculate the Levenshtein value for the current movement.
        A smaller value means a most likely match */
       curValue = this._levenshtein (movs, movements);

       if (curValue < winningVal) {
         winningVal = curValue;
         winningName = gestureName;
         winningMov = movements;
       }

       //dump(gestureName + ": " + curValue + "\n");
    }

    let matchValue = (winningMov.length >= this._matchThresholds.length)
      ? 6
      : this._matchThresholds[winningMov.length];


    if (winningVal <= matchValue) {

      this._dispatchEvent("Gesture_" + winningName, window);

      //dump("\nBest match: " + winningName + "\n\n");

    } else {

      this._dispatchEvent("GestureUnrecognized", window);

      //dump("\nNo best match\n\n");

    }

  },

  get latestMovement() {
    return this._latestMovement;
  },
  /* latestMovement: no public setter */

  get learningMode() {
    return this._learningMode;
  },

  set learningMode(x) {
    this._learningMode = x;
  },

  _makeTrailString: function(trail) {

    /* Concats every movement in a string and removes again consecutive
      movements in the same direction that might have been introduced after
      filtering */

    let movements = '';

    let curDirection = '';

    for (var i = 0; i < trail.length; i++) {
      if (curDirection != trail[i].direction) {
        curDirection = trail[i].direction;
        movements += curDirection;
      }
    }

    return movements;

  },

  _levenshtein: function (str1, str2, maxThreshold) {

    if (str1 == str2) return 0;

    /* Get rid of common prefix and suffix */
    let start = 0, end1 = str1.length, end2 = str2.length;
    while (str1[start] == str2[start]) {
      start++;
    }

    while(end1 > start && end2 > start && str1[end1-1] == str2[end2-1]) {
      end1--;
      end2--;
    }

    if (end1 == start || end2 == start)
      return end1 + end2 - start - start;

    str1 = str1.substring(start, end1);
    str2 = str2.substring(start, end2);

    /* Starting the algorithm */

    let len = str1.length + 1;
    let line1 = new Array(len);
    let line2 = new Array(len);

    maxThreshold = maxThreshold || Math.max(str1.length,str2.length);

    let i, j, cost, min, localValue;


    for (i = 0; i < len; i++) {
      line1[i] = i;
    }

    for (i = 1; i < str2.length + 1; i++) {

      line2[0] = i;
      min = i;

      for (j = 1; j < len; j++) {

        cost = ((str1[j-1] == str2[i-1]) ? 0 : 1);

        localValue = Math.min( line1[j] + 1, line2[j-1] + 1, line1[j-1] + cost)
        line2[j] = localValue;

        if (localValue < min)
          min = localValue;

      }

      if (min > maxThreshold) {
        // We've reached a point where we know that the value
        // can't be below our max acceptable value, so we can
        // stop the algorithm
        return 100;
      }

      line1 = line2;
      line2 = [];

    }

    return line1[len-1];

  },

  _dispatchEvent: function(name, destiny) {

    /* On learning mode we don't dispatch events actions.
     The code will only get GestureEnded from the handler,
     and then the movements can be grabbed by the
     latestMovement property */
    if (this._learningMode) return;

    let gEvent = document.createEvent("Events");
    gEvent.initEvent(name, true, false);
    destiny.dispatchEvent(gEvent);

  }
};

/* Engine startup */
let GestureEngine = new FennecGestures();

GestureEngine.registerGestures([
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

/* For outside access as API:
  currently defines "public":
    - latestMovement getter
    - registerGestures method */
window.Gestures = GestureEngine;