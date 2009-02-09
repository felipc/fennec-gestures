//User-experience file

function setGestureListeners() {
  window.addEventListener("Gesture_Star", function() { BrowserUI.doCommand("cmd_star"); }, false);
  window.addEventListener("Gesture_RotateClockwise", function() { BrowserUI.newTab(); }, false);
  window.addEventListener("Gesture_RotateAnticlock", function() { BrowserUI.closeTab(Browser._currentTab); }, false);
  window.addEventListener("Gesture_U", function() { BrowserUI.showBookmarks(); }, false);
  window.addEventListener("Gesture_Eight", function() { alert("Do the twist!"); }, false);
}
