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
    { name: "Diagonal \\.", action: "c"},
    { name: "Diagonal ./", action: "z"},
    { name: "Diagonal .\\", action: "q"},
    { name: "Diagonal /.", action: "e"},
    { name: "-> <-", action: "da"},
    { name: "<- ->", action: "ad"},
    { name: "X", action: "cae"},
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
    { name: "RotateAnticlock", action: "azxcdewq"},
    { name: "DoubleClockwise", action: "dcxzaqwedcxzaqwe"},
    { name: "ClockAnticlock", action: "dcxzaqweazxcdewq"}
    ]);
	  
}

FennecGestureModule.prototype = {
  _owner: null,
  
  _grabbing: false,

  _gestures: {},

  _latestMovement: null,
  
  _cv: null,

  _preGrabData: {
    firstClickX: 0,
    firstClickY: 0,
    time: Date.now(),

    reset: function() {
      this.time = 0;
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
    }
  },
  
  handleEvent: function(aEvent) {
    switch (aEvent.type) {
      case "mousedown":
        this._onMouseDown(aEvent);
        break;
      case "mouseup":
      case "mouseout":
        this._onMouseOut(aEvent);
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
      //let's grab the input, i.e. consider that the user is starting a gesture
      this._grabbing = true;
      this._owner.grab(this);
      this._startGesture(aEvent);
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

  _onMouseOut: function(aEvent) {
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
  },
  
  _registerGestures: function(gestures) {
  
    for each (let { action: action, name: name } in gestures) {
      this._gestures[action] = name;
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
  
  _newStep: function (direction, distance, x, y) {
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
    
    /*var mapD = {
      "->"  :  "->",
      "<-"  :  "<-",
      "v"   :  "v ",
      "^"   :  "^ ",
      "->v" :  "\\.",
      "->^" :  "/.",
      "<-v" :  "./",
      "<-^" :  ".\\"
    };*/
    
    var mapD = {
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
    direction = mapD[direction];
    
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
    let filteredTrail = this._movements.trail.filter(
                          function(x) x.distance > filterOut);
    
    
    dump("\n\n_________________\nAverage: " + average + " * 0.3 = " +
          filterOut +"\n_________________\nFiltered Trail:\n\n");
          
    this._dumpTrail(filteredTrail);
    
    let movs = this._makeTrailString(filteredTrail);
        
    dump("\nResulting Movements:\n" + movs + "\n");
    
    this._latestMovement = movs;
    
    //Check which is the best match among the registered gestures
    this._bestMatch(movs);
    
  },
  
  _bestMatch: function (movs) {
    
    let winningName = '', winningVal = 100, curValue = '';
    
    dump("\n\nLevenshtein:\n--------------\n");
    
    for (let [movements, gestureName] in Iterator(this._gestures)) {
      
       /* Calculate the Levenshtein value for the current movement.
        A smaller value means a most likely match */
       curValue = this._levenshtein (movs, movements);
    
       if (curValue < winningVal) {
         winningVal = curValue;
         winningName = gestureName;
       }
       
       dump(gestureName + ": " + curValue + "\n");
    }

    let gEvent = document.createEvent("Events");
    if (winningVal <= 2) {
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
  
  _levenshtein: function( str1, str2 ) {
      // http://kevin.vanzonneveld.net
      // +   original by: Carlos R. L. Rodrigues (http://www.jsfromhell.com)
      // +   bugfixed by: Onno Marsman

      var s, l = (s = (str1+'').split("")).length, t = (str2 = (str2+'').split("")).length, i, j, m, n;
      if(!(l || t)) return Math.max(l, t);
      for(var a = [], i = l + 1; i; a[--i] = [i]);
      for(i = t + 1; a[0][--i] = i;);
      for(i = -1, m = s.length; ++i < m;){
          for(j = -1, n = str2.length; ++j < n;){
              a[(i *= 1) + 1][(j *= 1) + 1] = Math.min(a[i][j + 1] + 1, a[i + 1][j] + 1, a[i][j] + (s[i] != str2[j]));
          }
      }
      return a[l][t];
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
