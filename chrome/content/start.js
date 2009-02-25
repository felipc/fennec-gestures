window.addEventListener('load', function() {
  
  let Gestures = new FennecGestureModule(ih);
  ih._modules.push(Gestures);
  window.Gestures = Gestures;
  setGestureListeners();
  setPieMenu();
  
}, false);

window.addEventListener('resize', function() {
  document.getElementById("containerForCanvas").setAttribute('width', window.innerWidth + 'px');
  document.getElementById("containerForCanvas").setAttribute('height', window.innerHeight + 'px');
  document.getElementById("trailCanvas").setAttribute('width', window.innerWidth + 'px');
  document.getElementById("trailCanvas").setAttribute('height', window.innerHeight + 'px');
}, false);
