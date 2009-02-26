


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

  _gestures: {},

  _latestMovement: null,
  
  _cv: null,

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
    
    dump("Engine: Gesture Started\n");
    
    this._shouldGrab = true;

    document.getElementById("containerForCanvas").hidden = false;
    let canvas = document.getElementById("trailCanvas");

    if (canvas.getContext) {
      this._cv = canvas.getContext('2d');
      this._cv.lineJoin = 'round';
      this._cv.beginPath();
      //this._cv.moveTo(aEvent.screenX / 2 - 100, aEvent.screenY / 2);
      this._cv.moveTo(aEvent.pageX, aEvent.pageY);
    }
    
  },
  
  _gestureEnded: function() {
    
    dump("Engine: Gesture ended\n");
    
    this._grabbing = false;
    this._processGesture();

    this._cv.closePath();
    this._cv.clearRect(0,0,this._cv.canvas.width,this._cv.canvas.height);
    document.getElementById("containerForCanvas").hidden = true;
  },

  _mouseMove: function(aEvent) {
    //dump("MouseMove " + (this._grabbing) ? 'true\n' : 'false\n');
    if (this._grabbing) {
      this._pushMovement(aEvent);

      //this._cv.lineTo(aEvent.screenX / 2 - 100, aEvent.screenY / 2);
      this._cv.lineTo(aEvent.pageX, aEvent.pageY);
      this._cv.stroke();
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
  
  _newStep: function (direction, distance, x, y) {
    let step = new this._step(direction, distance);
    this._movements.trail.push(step);
  },
  
  _startGesture: function(aEvent) {
    this._movements.init(aEvent.screenX, aEvent.screenY);
    this._newStep('',0); //stub initial step so trail is never empty for pop()
  },
    
  _pushMovement: function(aEvent) {

    dump("1");

    let x = aEvent.screenX;
    let y = aEvent.screenY;
    let dx = this._movements.lastX - x;
    let dy = this._movements.lastY - y
    let adx = Math.abs(dx);
    let ady = Math.abs(dy);

    dump("2");

    let distance = Math.sqrt(dx*dx + dy*dy);
    dump("3");
    if (adx < 5 && ady < 5) {
      dump("!\n");
      return;
    }
      dump("4");
    this._movements.lastX = x;
    this._movements.lastY = y;
    
        dump("5");
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
        dump("6");    
    let direction = this._composeDirection(dx, dy, adx, ady);
        dump("7");
    //map the composed direction to a single letter (needed for Levenshtein)
    direction = mapDirections[direction];
            dump("8");
    if (direction == this._movements.lastDirection) {
      /* If last tracked movement didn't change direction, combine
        both movements in only one, increasing its travel distance */
      distance += (this._movements.trail.pop()).distance;
    }
        dump("9");
    this._movements.lastDirection = direction;
            dump("0");
    this._newStep(direction, distance);
            dump("!\n");
     
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

    dump("\nResulting Movements:\n" + movs + "\n");
    
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

       dump(gestureName + ": " + curValue + "\n");
    }

    let matchValue = (winningMov.length >= this._matchThresholds.length)
      ? 6
      : this._matchThresholds[winningMov.length];

    let gEvent = document.createEvent("Events");
    
    if (winningVal <= matchValue) {
      gEvent.initEvent("Gesture_" + winningName, true, false);
      document.dispatchEvent(gEvent);
      
      dump("\nBest match: " + winningName + "\n\n");
    } else {
      gEvent.initEvent("GestureUnrecognized", true, false);
      document.dispatchEvent(gEvent);

      dump("\nNo best match\n\n");
    }
  
  },
  
  get latestMovement() {
    return this._latestMovement;
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
  
}
