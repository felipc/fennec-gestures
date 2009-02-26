window.addEventListener('load', function() {
  
  let GestureHandler = new GestureHandlerModule(ih);
  ih._modules.push(GestureHandler);

  let GestureEngine = new FennecGestures();
  window.Gestures = GestureEngine;
  
  registerGestures(GestureEngine);

  setGestureListeners();
  setPieMenu();
  
}, false);

window.addEventListener('resize', function() {
  document.getElementById("containerForCanvas").setAttribute('width', window.innerWidth + 'px');
  document.getElementById("containerForCanvas").setAttribute('height', window.innerHeight + 'px');
  document.getElementById("trailCanvas").setAttribute('width', window.innerWidth + 'px');
  document.getElementById("trailCanvas").setAttribute('height', window.innerHeight + 'px');
}, false);
