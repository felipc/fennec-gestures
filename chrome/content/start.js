window.addEventListener('load', function() {
  
  let Gestures = new FennecGestureModule(ih);
  ih._modules.push(Gestures);
  window.Gestures = Gestures;
  setGestureListeners();
  
}, false);