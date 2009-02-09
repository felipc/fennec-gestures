//User-experience file

function setGestureListeners() {
  window.addEventListener("Gesture_Wave", function() { BrowserUI.doCommand("cmd_star"); }, false);
  window.addEventListener("Gesture_RotateClockwise", function() { BrowserUI.newTab(); }, false);
  window.addEventListener("Gesture_RotateAnticlock", function() { BrowserUI.closeTab(Browser._currentTab); }, false);
  window.addEventListener("Gesture_U", function() { BrowserUI.showBookmarks(); }, false);
  window.addEventListener("Gesture_InvertedU", function() { BrowserUI.showHistory(); }, false);
}
