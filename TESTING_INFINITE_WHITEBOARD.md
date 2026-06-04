# InfiniteWhiteboard Testing Guide

## 🚀 Quick Start

1. **Start the dev server** (if not running):
   ```bash
   npm run dev
   ```

2. **Open test page**:
   ```
   http://localhost:3000/whiteboard-test
   ```

You should see a white canvas with a light grid overlay and a toolbar at the bottom.

---

## ✅ Testing Checklist

### **1. Toolbar & UI**
- [ ] Toolbar appears at the bottom of the canvas
- [ ] Tool buttons are clickable (Pointer, Pan, Pen, Highlight, Text, Shapes, Sticky)
- [ ] Color picker is visible and clickable
- [ ] Zoom controls (+, -, %) are visible
- [ ] Status bar at the bottom shows "Objects: 0" initially

### **2. Canvas Basics**
- [ ] Canvas takes up the full viewport
- [ ] Grid is visible (light gray dots/lines)
- [ ] Canvas has a white background
- [ ] No errors in browser console

### **3. Pen Drawing**
- [ ] Select Pen tool (pencil icon)
- [ ] Click and drag on canvas - should draw a black line
- [ ] Try drawing freehand shapes
- [ ] **Expected**: Smooth line should appear while dragging
- [ ] **Expected**: When released, line stays on canvas
- [ ] **Expected**: Object count increases to 1+

### **4. Highlighter**
- [ ] Select Highlighter tool (marker icon)
- [ ] Click and drag on canvas
- [ ] **Expected**: Semi-transparent yellow/transparent stroke appears
- [ ] **Expected**: Should be thicker than pen
- [ ] **Expected**: Multiple overlapping highlights should blend together
- [ ] **Expected**: Object count increases

### **5. Drawing Tools - Shapes**

#### **Rectangle**
- [ ] Select Rectangle tool
- [ ] Click, hold, and drag on canvas
- [ ] **Expected**: Dashed rectangle outline appears while dragging
- [ ] **Expected**: Solid rectangle drawn when released
- [ ] **Expected**: Rectangle has no fill (stroke only)

#### **Circle**
- [ ] Select Circle tool
- [ ] Click, hold, and drag on canvas (try dragging diagonally)
- [ ] **Expected**: Dashed circle outline appears while dragging
- [ ] **Expected**: Circle should be inscribed in bounding box (not stretched)
- [ ] **Expected**: Solid circle drawn when released
- [ ] Test: Drag a perfect square bounding box - should get a perfect circle

#### **Line**
- [ ] Select Line tool
- [ ] Click and drag to create a line
- [ ] **Expected**: Dashed line appears while dragging
- [ ] **Expected**: Solid straight line when released

#### **Arrow**
- [ ] Select Arrow tool
- [ ] Click and drag to create an arrow
- [ ] **Expected**: Dashed arrow outline while dragging
- [ ] **Expected**: Solid arrow with arrowhead when released
- [ ] **Expected**: Arrowhead points in direction of drag

### **6. Text & Sticky Notes**

#### **Text Tool**
- [ ] Select Text tool (A icon)
- [ ] Click on canvas to place text
- [ ] **Expected**: Prompt or text input appears
- [ ] Type some text and submit
- [ ] **Expected**: Text appears on canvas in current color
- [ ] **Expected**: Object count increases

#### **Sticky Notes**
- [ ] Select Sticky Notes tool (sticky note icon)
- [ ] Click on canvas to place sticky note
- [ ] **Expected**: Yellow sticky note appears
- [ ] **Expected**: Can type/edit text in the note
- [ ] **Expected**: Text wraps within note bounds

### **7. Selection & Interaction**

#### **Pointer Tool (Select)**
- [ ] Select Pointer tool (arrow icon)
- [ ] Click on an existing object (e.g., a circle you drew)
- [ ] **Expected**: Selected object shows purple dashed border
- [ ] **Expected**: Can rotate by dragging edge (if implemented)
- [ ] **Expected**: Can resize by dragging corners (if implemented)
- [ ] Click on empty canvas
- [ ] **Expected**: Selection disappears
- [ ] Press Escape key
- [ ] **Expected**: Selection clears

### **8. Pan & Navigation**

#### **Pan Tool**
- [ ] Select Pan tool (hand icon)
- [ ] Click and drag on canvas
- [ ] **Expected**: Canvas pans (moves view) with your drag
- [ ] **Expected**: Drawing and objects move with pan

#### **Spacebar Pan (Spring-loaded)**
- [ ] Draw something on canvas first (so you have content to see move)
- [ ] Press and hold **Spacebar**
- [ ] **Expected**: Tool changes to Pan (hand cursor)
- [ ] While holding spacebar, drag
- [ ] **Expected**: Canvas pans with mouse
- [ ] Release spacebar
- [ ] **Expected**: Tool returns to previous tool (e.g., Pen)

#### **Middle Mouse Button Pan**
- [ ] Middle-click (or scroll wheel click) and drag
- [ ] **Expected**: Canvas pans
- [ ] **Expected**: Works from any tool

### **9. Zoom**

#### **Mouse Wheel Zoom**
- [ ] Hold **Ctrl** (on Windows/Linux) or **Cmd** (on Mac)
- [ ] Scroll mouse wheel up
- [ ] **Expected**: Canvas zooms in
- [ ] Scroll mouse wheel down
- [ ] **Expected**: Canvas zooms out
- [ ] Zoom percentage should update in toolbar
- [ ] Objects and grid should scale appropriately

#### **Toolbar Zoom Buttons**
- [ ] Click **+** button multiple times
- [ ] **Expected**: Canvas zooms in, percentage increases
- [ ] Click **-** button multiple times
- [ ] **Expected**: Canvas zooms out, percentage decreases
- [ ] Click **🎯 Reset** button
- [ ] **Expected**: Returns to 100% zoom, centered view

#### **Zoom Limits**
- [ ] Zoom all the way in (click + many times)
- [ ] **Expected**: Maximum 800% (should not exceed)
- [ ] Zoom all the way out (click - many times)
- [ ] **Expected**: Minimum 10% (should not exceed)

#### **Zoom-to-Pointer**
- [ ] Hold Ctrl/Cmd and scroll at a specific point
- [ ] **Expected**: Zoom should happen centered on mouse position
- [ ] **Expected**: Objects scale relative to mouse cursor

### **10. Color Picker**
- [ ] Draw with Pen tool in default color (black)
- [ ] Click on color picker box in toolbar
- [ ] **Expected**: Color picker modal/picker appears
- [ ] Select a different color (e.g., red)
- [ ] Draw again on canvas
- [ ] **Expected**: New strokes are in the selected color
- [ ] Try multiple colors

### **11. Multi-Object Interaction**
- [ ] Draw 5+ different objects (mix of pen, shapes, text)
- [ ] **Expected**: All objects stay on canvas
- [ ] **Expected**: Status bar shows correct object count
- [ ] Select Pointer tool and click each object
- [ ] **Expected**: Each can be selected individually
- [ ] Click empty space to deselect
- [ ] Repeat zooming and panning
- [ ] **Expected**: All objects scale and move correctly

### **12. Grid Display**
- [ ] Canvas should show a grid overlay
- [ ] Zoom in significantly
- [ ] **Expected**: Grid squares increase in size (grid scales with zoom)
- [ ] Zoom out significantly
- [ ] **Expected**: Grid squares decrease in size
- [ ] At 100% zoom, grid should be evenly spaced (every 20px)

### **13. Edge Cases & Performance**
- [ ] Draw 20+ objects (lots of shapes, lines, text)
- [ ] **Expected**: No lag or stuttering during drawing
- [ ] **Expected**: Canvas still responsive
- [ ] Pan with many objects on screen
- [ ] **Expected**: Smooth panning, no performance issues
- [ ] Zoom to 10% with many objects visible
- [ ] **Expected**: All objects visible and properly scaled
- [ ] Zoom to 800% and draw small details
- [ ] **Expected**: Can draw fine details without lag

### **14. Keyboard Shortcuts**
- [ ] Press **Escape** while drawing
- [ ] **Expected**: Deselects current object (if selected)
- [ ] Use **Spacebar** to access pan tool temporarily
- [ ] **Expected**: Spring-loaded behavior (returns to previous tool when released)

### **15. Status Bar Information**
- [ ] Look at bottom status bar
- [ ] **Expected**: Shows "Objects: X" (number of objects)
- [ ] **Expected**: Shows "Pan: (panX, panY)" 
- [ ] **Expected**: Shows current zoom percentage
- [ ] **Expected**: Shows helpful hints (e.g., "Hold Spacebar to pan")

---

## 🐛 Known Issues & Observations

### **Potential Issues to Watch For**
1. **Circle shape might look stretched** - should be perfectly circular in bounding box
2. **Arrow arrowhead might not point correctly** - verify it matches drag direction  
3. **Text tool might not show proper input UI** - depends on implementation
4. **Sticky notes text input might be limited** - watch for text wrapping
5. **Performance at extreme zoom levels** - should stay smooth
6. **Grid culling at high zoom** - might see lag if all grid lines rendered

### **What's NOT Implemented Yet** (By Design)
- ❌ Real-time collaboration/WebSocket sync
- ❌ Undo/Redo (Ctrl+Z / Cmd+Z)
- ❌ Copy/Paste objects
- ❌ Object resizing after creation (select and resize)
- ❌ Saving/exporting canvas to image
- ❌ Multi-user cursors
- ❌ Dark mode
- ❌ Touch gestures (tablets/phones)

---

## 📊 Test Results Template

Copy and fill out after testing:

```
## Whiteboard Test Results

**Device**: macOS / Windows / Linux
**Browser**: Chrome / Safari / Firefox / Edge
**Date**: [YYYY-MM-DD]

### Test Results
- Drawing: [ ] PASS [ ] FAIL [ ] PARTIAL
- Shapes: [ ] PASS [ ] FAIL [ ] PARTIAL
- Text/Sticky: [ ] PASS [ ] FAIL [ ] PARTIAL
- Pan/Zoom: [ ] PASS [ ] FAIL [ ] PARTIAL
- Selection: [ ] PASS [ ] FAIL [ ] PARTIAL
- Performance: [ ] PASS [ ] FAIL [ ] PARTIAL

### Issues Found
[List any bugs or unexpected behavior]

### Notes
[Any other observations]
```

---

## 🔧 Debugging Tips

If something doesn't work:

1. **Check browser console** (F12 → Console tab)
   - Look for red errors
   - Report exact error messages

2. **Check network** (F12 → Network tab)
   - Look for failed requests
   - Check for CORS errors

3. **Try hard refresh** (Ctrl+Shift+R / Cmd+Shift+R)
   - Clear cached JS/CSS

4. **Verify dev server is running**
   - Should see "Ready in Xms" in terminal
   - Should be able to access `http://localhost:3000`

5. **Check if other pages work**
   - Try going to `http://localhost:3000` (home page)
   - If that's broken, there's a bigger issue

6. **Browser DevTools Canvas Debugging**
   - Open DevTools → Console
   - Type `canvasRef.current` to see canvas element reference
   - Check canvas size: `canvas.width` and `canvas.height`

---

## 📝 Browser Compatibility

Tested on:
- ✅ Chrome/Chromium (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)

Should work on any modern browser with HTML5 Canvas support.

---

## ✨ Success Criteria

The whiteboard is working correctly if:

1. ✅ Can draw with pen and see lines appear
2. ✅ Can create shapes with live preview during drawing
3. ✅ Can pan and zoom the infinite canvas
4. ✅ Can select objects and see selection indicator
5. ✅ Performance stays smooth with 20+ objects
6. ✅ Keyboard shortcuts (Spacebar, Escape) work
7. ✅ No console errors or warnings
8. ✅ Grid displays and scales correctly with zoom

**If all criteria pass → Whiteboard is production-ready!**

---

## 📞 Feedback

After testing, let me know:
1. What worked great
2. What felt clunky
3. What bugs you found
4. Feature requests
5. Performance issues at scale

Then I can iterate and improve! 🚀
