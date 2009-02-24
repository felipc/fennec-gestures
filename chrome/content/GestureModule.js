/**
 * Gestures handling code
 */
function FennecGestureModule(owner) {
	this._owner = owner;
	
	dump("Creating gesture module with owner: " + owner);
	
	/* Note: names doesn't need to be unique.
	  This way it's possible to register a same gestures with various
	  starting points. Example: RotateClockwise starting at top or at bottom.
	  
	  Currently it's better to list shortest actions first.
	  
	  The letters qwedcxza corresponds to the directions (look at the keyboard).
	  */
  this._registerGestures([
    { name: "Diagonal \\.", action: [4]},
    { name: "Diagonal ./", action: [6]},
    { name: "Diagonal .\\", action: [0]},
    { name: "Diagonal /.", action: [2]},
    { name: "Left", action: [7]},
    { name: "Right", action: [3]},
    { name: "Up", action: [1]},
    { name: "Down", action: [5]},
    { name: "-> <-", action: [3,7]},
    { name: "<- ->", action: [7,3]},
    { name: "X", action: [4,7,2]},
    { name: "X", action: [6,3,0]},
    { name: "Square", action: [3,5,7,1]},
    { name: "House", action: [1,2,4,5,7]},
    { name: "U", action: [5,4,3,2,1]},
    { name: "InvertedU", action: [1,2,3,4,5]},
    { name: "C", action: [7,6,5,4,3]},
    { name: "InvertedC", action: [3,4,5,6,7]},
    { name: "Wave", action: [1,2,3,4,3,2,1]},
    { name: "Wave", action: [1,4,1,4]},
    { name: "Star", action: [2,4,0,3,6]},
    { name: "Star", action: [1,5,0,7,3,6]},
    { name: "Eight", action: [6,5,4,5,6,7,0,1,2,1,0,7]},
    { name: "Eight", action: [6,5,4,3,4,5,6,7,1,2,1,7]},
    { name: "RotateClockwise", action: [3,4,5,6,7,0,1,2]},
    { name: "RotateClockwise", action: [7,0,1,2,3,4,5,6]},
    { name: "Infinity", action: [1,2,4,3,2,1,0,7,6,5,6,7,0]},
    { name: "Infinity", action: [2,3,4,3,2,1,0,7,6,7]},
    { name: "Twirl", action: [3,4,5,6,7,1,2,3,4,5,6,7]},
    { name: "RotateAnticlock", action: [7,6,5,4,3,2,1,0]},
    { name: "DoubleClockwise", action: [3,4,5,6,7,0,1,2,3,4,5,6,7,0,1,2]},
    { name: "ClockAnticlock", action: [3,4,5,6,7,0,1,2,7,6,5,4,3,2,1,0]}
    ]);
	  
}

FennecGestureModule.prototype = {
  _owner: null,
  
  _grabbing: false,

  _gestures: [],

  _latestMovement: null,
  
  _cv: null,

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
    },
    
    applyFilters: function(filters) {
      
      for each(aFilter in filters) {
        this.trail = this.trail.filter(aFilter);
      }
      
    },
    
    getSequenceArray: function() {
      let movements = [];

      let curDirection = -1;

      for (var i = 0; i < this.trail.length; i++) {
        if (curDirection != this.trail[i].direction) {
          curDirection = this.trail[i].direction;
          movements.push(curDirection);
        }
      }

      return movements;
    },
      
  },
  
  handleEvent: function(aEvent) {
    switch (aEvent.type) {
      case "mousedown":
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
  
  _onMouseDown: function(aEvent) {
    
    let adx = Math.abs(aEvent.screenX - this._preGrabData.firstClickX);
    let ady = Math.abs(aEvent.screenY - this._preGrabData.firstClickY);
    
    let timeDiff = Date.now() - this._preGrabData.time;
    
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
      this._cv.closePath();
      this._cv.clearRect(0,0,300,300);
      this._processGesture();
      this._preGrabData.reset();
      document.getElementById("containerForCanvas").hidden = true;
    }
  },
  
  _onMouseMove: function(aEvent) {
    if (this._grabbing) {
      this._pushMovement(aEvent);

      this._cv.lineTo(aEvent.screenX / 2 - 100, aEvent.screenY / 2);
      this._cv.stroke();
    }
    
    if (this._preGrabData.shouldGrab) {

      this._grabbing = true;
      this._preGrabData.reset();
      this._owner.grab(this);
      this._startGesture(aEvent);

      dump("Gesture Starting\n");
      
      document.getElementById("containerForCanvas").hidden = false;
      let canvas = document.getElementById("trailCanvas");
      if (canvas.getContext) {
        this._cv = canvas.getContext('2d');
        this._cv.lineJoin = 'round';
        this._cv.beginPath();
        this._cv.moveTo(aEvent.screenX / 2 - 100, aEvent.screenY / 2);
      } else {
        dump("Could not get context\n");
      }
      
    }    
  },
  
  _registerGestures: function(gestures) {
  
    for each (gesture in gestures) {
      this._gestures.push(gesture);
    }
   
  },
  
  // This object will represent the steps that will be pushed to the trail array
  _step: function (direction, distance) {
    this.direction = direction;
    this.distance = distance;
    
    this.toString = function() {
      return "[dist: " + this.distance + ", direction: " + this.direction + "]";
    }
    
    return this;
  },  
  
  _newStep: function (direction, distance) {
    let step = new this._step(direction, distance);
    this._movements.trail.push(step);
    this._dumpStep(step);
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
      "<-^" :  0,
      "^"   :  1,
      "->^" :  2,
      "->"  :  3,
      "->v" :  4,
      "v"   :  5,
      "<-v" :  6,
      "<-"  :  7
    };
    
    let direction = this._composeDirection(dx, dy, adx, ady);

    //map the composed direction to a single unit (needed for Levenshtein)
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
    
    /* This is the main function that detects which gesture was done */
    
    //Verify the average travel distance of movements
    let total = this._movements.trail.reduce(function(a,b) a + b.distance, 0);
    let average = total / this._movements.trail.length;
    
    /* Filter out movements below 30% of average distance.
      This helps filter out involuntary jigging */  
    let filterOut = average * 0.3;
    let averageFilter = function(x) x.distance > filterOut;
    
    this._movements.applyFilters([averageFilter]);
  
    
    
    dump("\n\n_________________\nAverage: " + average + " * 0.3 = " +
          filterOut +"\n_________________\nFiltered Trail:\n\n");
          
    this._dumpTrail();

    let movs = this._movements.getSequenceArray();
        
    dump("\nResulting Movements:\n" + movs + "\n");
    
    this._latestMovement = movs;
    
    //Check which is the best match among the registered gestures
    this._bestMatch(movs);
    
  },
  
  _bestMatch: function (movs) {
    
    let winningName = '', winningVal = 100, curValue = '', winningMov;
    
    dump("\n\nLevenshtein:\n--------------\n");
    
    let matchTable = [-1, 0, 0, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5];
    
    for each (gesture in this._gestures) {
      
       /* Calculate the Levenshtein value for the current movement.
        A smaller value means a most likely match */
       curValue = this._levenshtein (movs, gesture.action);
    
       if (curValue < winningVal) {
         winningVal = curValue;
         winningName = gesture.name;
         winningMov = gesture.action;
       }
       
       dump(gesture.name + ": " + curValue + "\n");
    }

    let matchValue = (winningMov.length > matchTable.length) ? 6 : matchTable[winningMov.length];

    let gEvent = document.createEvent("Events");
    if (winningVal <= matchValue) {
      dump("\nBest match: " + winningName + "\n\n");
      gEvent.initEvent("Gesture_" + winningName, true, false);
      document.dispatchEvent(gEvent);
    } else {
      gEvent.initEvent("Gesture_Unrecognized", true, false);
      document.dispatchEvent(gEvent);
      dump("\nNo best match\n\n");
    }
  
  },
  
  get latestMovement() {
    return this._latestMovement;
  },  
  
  _levCostTable: [
         /*  q  w  e  d  c  x  z  a  */
  /* q */ [  0, 1, 1, 2, 2, 2, 1, 1 ],
  /* w */ [  1, 0, 1, 2, 2, 2, 2, 2 ],
  /* e */ [  1, 1, 0, 1, 1, 2, 2, 2 ],
  /* d */ [  2, 2, 1, 0, 1, 2, 2, 2 ],
  /* c */ [  2, 2, 1, 1, 0, 1, 1, 2 ],
  /* x */ [  2, 2, 2, 2, 1, 0, 1, 2 ],
  /* z */ [  1, 2, 2, 2, 1, 1, 0, 1 ],
  /* a */ [  1, 2, 2, 2, 2, 2, 1, 0 ]
  ],
  
  _levenshtein: function (seq1, seq2, maxThreshold) {

    /* Get rid of common prefix and suffix */
    let start = 0, end1 = seq1.length, end2 = seq2.length;
    let smallest = Math.min(end1, end2);

    while ( (start < smallest) && seq1[start] == seq2[start]) {
      start++;
    }

    while(end1 > start && end2 > start && seq1[end1-1] == seq2[end2-1]) {
      end1--; 
      end2--;
    }

    if (end1 == start || end2 == start) {
      //simple insertions with common prefix and suffix
      return end1 + end2 - start - start;
    }

    if (start > end1 || start > end2) {
      return 0;
    }

    seq1 = seq1.slice(start, end1);
    seq2 = seq2.slice(start, end2);

    /* Starting the algorithm */

    let len = seq1.length + 1;
    let line1 = new Array(len);
    let line2 = new Array(len);

    maxThreshold = maxThreshold || Math.max(seq1.length,seq2.length);

    let i, j, cost, min, localValue;


    for (i = 0; i < len; i++) {
      line1[i] = i;
    }

    for (i = 1; i < seq2.length + 1; i++) {

      line2[0] = i;
      min = i;

      for (j = 1; j < len; j++) {

        //cost = ((seq1[j-1] == seq2[i-1]) ? 0 : 1);
        cost = this._levCostTable[ seq1[j-1] ][ seq2[i-1] ];

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
  
  _dumpStep: function (aStep, trailstr) {
    let mystr = trailstr || "!";
    dump (mystr + aStep + "\n");
  },
  
  _dumpTrail: function (arr) {
    
    let trail = arr || this._movements.trail;
    
    let i;
    for (i = 0; i < trail.length; i++) {
      this._dumpStep(trail[i]);
    }
  },
  
}
