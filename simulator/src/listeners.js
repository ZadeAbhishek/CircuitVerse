// Most Listeners are stored here
/* eslint-disable */
import { layoutModeGet, tempBuffer, layoutUpdate, setupLayoutModePanelListeners } from './layoutMode';
import simulationArea from './simulationArea';
import {
    scheduleUpdate,
    update,
    updateSelectionsAndPane,
    wireToBeCheckedSet,
    updatePositionSet,
    updateSimulationSet,
    updateCanvasSet,
    gridUpdateSet,
    errorDetectedSet,
} from './engine';
import { changeScale } from './canvasApi';
import { scheduleBackup } from './data/backupCircuit';
import { hideProperties, deleteSelected, uxvar, fullView } from './ux';
import {
    updateRestrictedElementsList,
    updateRestrictedElementsInScope,
    hideRestricted,
    showRestricted,
} from './restrictedElementDiv';
import { removeMiniMap, updatelastMinimapShown } from './minimap';
import undo from './data/undo';
import { copy, paste, selectAll } from './events';
import save from './data/save';
import { createElement } from './ux';
import { verilogModeGet } from './Verilog2CV';
import { setupTimingListeners } from './plotArea';
import 'hammerjs';

var unit = 10;
var prevdist = 0;
var pinchCenter = null;
var touchscale = 0;
//var pinchCenterOffset;
var lastPosX = 0;
var lastPosY = 0;
var isDragging = false;
let start = 0;
var pinchstart = false;
var ctxPos = {
    x: 0,
    y: 0,
    visible: false,
};
var pinY = 0;
var pinX = 0;
var hammerscale = 0;

window.onload = function() {
    var is_touch_device = 'ontouchstart' in simulationArea.canvas;
    if (is_touch_device) {
        $('#simulationArea').disableSelection();
        var touchsimulatorlistner = document.querySelector('#simulationArea');
        var touchsimlatorevent = new Hammer(touchsimulatorlistner);
        touchsimlatorevent.get('pinch').set({ enable: true });
        touchsimlatorevent.get('pan').set({ direction: Hammer.DIRECTION_ALL });
        touchsimlatorevent.on("tap press panstart panmove panend pinchstart pinchin pinchout pinchmove pinchend", function(e) {

            var X = e.center.x;
            var Y = e.center.y;
            if (e.type == "press") {
                console.log("DT");
                if (layoutModeGet()) return false; // Hide context menu when it is in Layout Mode
                $('#contextMenu').css({
                    visibility: 'visible',
                    opacity: 1,
                    top: `${e.center.y}px`,
                    left: `${e.center.x}px`,
                });
                ctxPos.visible = true;
            }
            if (e.type == "tap") {
                simulationArea.shiftDown = false;

                function getWidth() {
                    return Math.max(
                        document.body.scrollWidth,
                        document.documentElement.scrollWidth,
                        document.body.offsetWidth,
                        document.documentElement.offsetWidth,
                        document.documentElement.clientWidth
                    );
                }
                console.log(window.screen.width);
                simulationArea.touchX = e.center.x;
                simulationArea.touchY = e.center.y;
                ctxPos.visible = false;
                $('#contextMenu').css({
                    visibility: 'invisible',
                    opacity: 0,

                });
                ctxPos.visible = false;
                $('#moduleProperty').hide();

            }
            if (e.type == "panstart") {
                console.log('pan on simulator');
                simulationArea.mouseDown = true;

                //console.log(X);
                // console.log(Y);

                // Deselect Input
                if (document.activeElement instanceof HTMLElement)
                    document.activeElement.blur();

                errorDetectedSet(false);
                updateSimulationSet(true);
                updatePositionSet(true);
                updateCanvasSet(true);

                simulationArea.lastSelected = undefined;
                simulationArea.selected = false;
                simulationArea.hover = undefined;
                var rect = simulationArea.canvas.getBoundingClientRect();
                simulationArea.mouseDownRawX = (e.center.x - rect.left) * DPR;
                // alert((e.clientX - rect.left) * DPR);
                simulationArea.mouseDownRawY = (e.center.y - rect.top) * DPR;
                simulationArea.mouseDownX = Math.round(((simulationArea.mouseDownRawX - globalScope.ox) / globalScope.scale) / unit) * unit;
                simulationArea.mouseDownY = Math.round(((simulationArea.mouseDownRawY - globalScope.oy) / globalScope.scale) / unit) * unit;
                simulationArea.oldx = globalScope.ox;
                simulationArea.oldy = globalScope.oy;


                e.preventDefault();
                scheduleBackup();
                scheduleUpdate(1);
                $('.dropdown.open').removeClass('open');
            }
            if (e.type == "panmove") {
                simulationArea.touchmove = true;
                console.log('panmove on simulator');
                simulationArea.touchX = e.center.x;
                simulationArea.touchY = e.center.y;
                var rect = simulationArea.canvas.getBoundingClientRect();
                //  console.log(X);
                //console.log(Y);
                simulationArea.mouseRawX = (e.center.x - rect.left) * DPR;
                simulationArea.mouseRawY = (e.center.y - rect.top) * DPR;
                simulationArea.mouseXf = (simulationArea.mouseRawX - globalScope.ox) / globalScope.scale;
                simulationArea.mouseYf = (simulationArea.mouseRawY - globalScope.oy) / globalScope.scale;
                simulationArea.mouseX = Math.round(simulationArea.mouseXf / unit) * unit;
                simulationArea.mouseY = Math.round(simulationArea.mouseYf / unit) * unit;
                // console.log(simulationArea.mouseY);
                updateCanvasSet(true);

                if (simulationArea.lastSelected && (simulationArea.mouseDown || simulationArea.lastSelected.newElement)) {
                    updateCanvasSet(true);
                    var fn;

                    if (simulationArea.lastSelected == globalScope.root) {
                        fn = function() {
                            updateSelectionsAndPane();
                        };
                    } else {
                        fn = function() {
                            if (simulationArea.lastSelected) { simulationArea.lastSelected.update(); }
                        };
                    }
                    scheduleUpdate(0, 20, fn);
                } else {
                    scheduleUpdate(0, 200);
                }
                e.preventDefault();

            }
            if (e.type == "panend") {
                simulationArea.mouseDown = false;
                if (!lightMode) {
                    updatelastMinimapShown();
                    setTimeout(removeMiniMap, 2000);
                }

                errorDetectedSet(false);
                updateSimulationSet(true);
                updatePositionSet(true);
                updateCanvasSet(true);
                gridUpdateSet(true);
                wireToBeCheckedSet(1);

                scheduleUpdate(1);
                simulationArea.mouseDown = false;

                for (var i = 0; i < 2; i++) {
                    updatePositionSet(true);
                    wireToBeCheckedSet(1);
                    update();
                }
                errorDetectedSet(false);
                updateSimulationSet(true);
                updatePositionSet(true);
                updateCanvasSet(true);
                gridUpdateSet(true);
                wireToBeCheckedSet(1);

                scheduleUpdate(1);
                var rect = simulationArea.canvas.getBoundingClientRect();

                if (!(simulationArea.mouseRawX < 0 || simulationArea.mouseRawY < 0 || simulationArea.mouseRawX > width || simulationArea.mouseRawY > height)) {
                    uxvar.smartDropXX = simulationArea.mouseX + 100; // Math.round(((simulationArea.mouseRawX - globalScope.ox+100) / globalScope.scale) / unit) * unit;
                    uxvar.smartDropYY = simulationArea.mouseY - 50; // Math.round(((simulationArea.mouseRawY - globalScope.oy+100) / globalScope.scale) / unit) * unit;
                }
            }

            /* if (e.type == "pinchstart") {
                 var pinchX = e.center.x;
                 var pinchY = e.center.y;
                 pinchstart = true;
             }


             if (e.type == "pinchin") {

                 setTimeout(() => {
                     console.log(JSON.stringify(e));
                     if (pinchstart === true) {
                         changeScale(-0.1 * 2, pinchX, pinchY);
                     }
                     gridUpdateSet(true);

                 }, 50);


             }
             if (e.type == "pinchout") {
                 changeScale(0.1 * 2, pinchX, pinchY);
                 gridUpdateSet(true);
             }
             if (e.type == "pinchend") {
                 console.log('end');
                 gridUpdateSet(true);
                 pinchstart = false;


             }*/


        });
        touchsimlatorevent.on('pinch pinchmove', ev => {
            /* displayImageCurrentScale = clampScale(ev.scale * displayImageScale);
             updateRange();
             displayImageCurrentX = clamp(displayImageX + ev.deltaX, rangeMinX, rangeMaxX);
             displayImageCurrentY = clamp(displayImageY + ev.deltaY, rangeMinY, rangeMaxY);
             updateDisplayImage(displayImageCurrentX, displayImageCurrentY, displayImageCurrentScale);*/
            //console.log("PICH works herer");
            //changeScale(ev.scale);





            //updateCanvasSet(true);
            console.log(` EV.scale:${ev.scale}`);
            console.log(`GlobalSope:${globalScope.scale}`);
            console.log(` Hammer scale:${hammerscale}`);
            var oldScale = globalScope.scale;
            hammerscale = ev.scale;
            // if (hammerscale >= 1.9) { hammerscale = 1.9 }
            globalScope.scale = Math.max(0.5, Math.min(4 * DPR, hammerscale * 5));
            globalScope.scale = Math.round(globalScope.scale * 10) / 10;
            if (globalScope.scale >= 7.5) { globalScope.scale = 7.5 }
            //if (globalScope.scale < 2) { globalScope.scale = 2 };
            if (simulationArea.lastSelected && simulationArea.lastSelected.objectType !== 'Wire') { // selected object
                pinX = simulationArea.lastSelected.x + ev.deltaX;
                pinY = simulationArea.lastSelected.y + ev.deltaY;
            } else {
                pinY = ev.center.y;
                pinX = ev.center.x;
            }

            globalScope.ox -= Math.round(pinX * ((globalScope.scale) - oldScale)); // Shift accordingly, so that we zoom wrt to the selected point
            globalScope.oy -= Math.round(pinY * ((globalScope.scale) - oldScale));
            // if (globalScope.scale < 7.5 && globalScope > 3.5) {
            var scale = unit * globalScope.scale;
            var ox = globalScope.ox % scale; // offset
            var oy = globalScope.oy % scale; // offset
            var transparentBackground = false;
            var force = false;
            document.getElementById('backgroundArea').style.left = (ox - scale) / DPR;
            document.getElementById('backgroundArea').style.top = (oy - scale) / DPR;
            if (globalScope.scale === simulationArea.prevScale && !force) return;

            if (!backgroundArea.context) return;
            simulationArea.prevScale = globalScope.scale;

            var canvasWidth = backgroundArea.canvas.width; // max X distance
            var canvasHeight = backgroundArea.canvas.height; // max Y distance

            var ctx = backgroundArea.context;
            ctx.beginPath();
            backgroundArea.clear();
            ctx.strokeStyle = colors["canvas_stroke"];
            ctx.lineWidth = 1;
            if (!transparentBackground) {
                ctx.fillStyle = colors["canvas_fill"];
                ctx.rect(0, 0, canvasWidth, canvasHeight);
                ctx.fill();
            }

            if (!embed) {
                var correction = 0.5 * (ctx.lineWidth % 2);
                for (var i = 0; i < canvasWidth; i += scale) {
                    ctx.moveTo(Math.round(i + correction) - correction, 0);
                    ctx.lineTo(Math.round(i + correction) - correction, canvasHeight);
                }
                for (var j = 0; j < canvasHeight; j += scale) {
                    ctx.moveTo(0, Math.round(j + correction) - correction);
                    ctx.lineTo(canvasWidth, Math.round(j + correction) - correction);
                }
                ctx.stroke();
            }


            //  gridUpdateSet(true);
            //  updateCanvasSet(true);
            updateCanvasSet(true);
            updateSimulationSet(true);
            updatePositionSet(true);
            gridUpdateSet(true);
            wireToBeCheckedSet(1);
            scheduleUpdate(1);






        });
        touchsimlatorevent.on('pinchend', ev => {
            updateCanvasSet(true);
            updateSimulationSet(true);
            updatePositionSet(true);
            gridUpdateSet(true);
            wireToBeCheckedSet(1);
            scheduleUpdate(1);

        });


        var quick_btn = document.querySelector('#quick-btn');
        var quick_btn_listner = document.getElementById('quick-btn');
        var quick_btn_hammer = new Hammer(quick_btn);
        var timing_btn = document.querySelector('#timingguide');
        var timing_btb_listner = document.getElementById('timingguide');
        var timing_btn_hammer = new Hammer(timing_btn);
        var panel_header = document.querySelector('#guide_1');
        var panel_header_style = document.getElementById('guide_1');
        var panel_header_2 = document.querySelector('#moduleProperty');
        var panel_header_style_2 = document.getElementById('moduleProperty');
        var panel_header_hammer = new Hammer(panel_header);
        var panel_header_hammer_2 = new Hammer(panel_header_2);

        quick_btn_hammer.on("panmove panend tap", function(ev) {


            // Hold gesture start (press)
            if (ev.type == "panmove") {
                console.log("Hold active");
                console.log(ev);
                if (!isDragging) {
                    isDragging = true;
                    lastPosX = quick_btn_listner.offsetLeft;
                    lastPosY = quick_btn_listner.offsetTop;
                }

                var posX = ev.deltaX + lastPosX;
                var posY = ev.deltaY + lastPosY;
                quick_btn_listner.style.left = posX + "px";
                quick_btn_listner.style.top = posY + "px";


            }

            // Hold gesture stop (pressup)
            if (ev.type == "panend") {
                if (ev.isFinal) {
                    isDragging = false;
                }


            }

            if (ev.type == "tap") {
                console.log('tap');
                panel_header_style.click();

            }
        });
        timing_btn_hammer.on("panmove panend", function(ev) {

            if (ev.type == "panstart") {
                $('.timing-diagram-panel').draggable().draggable("enable");
                timing_btb_listner.style.position = "absolute";
            }
            // Hold gesture start (press)
            if (ev.type == "panmove") {

                console.log("Hold active");
                console.log(ev);
                if (!isDragging) {
                    isDragging = true;
                    lastPosX = timing_btb_listner.offsetLeft;
                    lastPosY = timing_btb_listner.offsetTop;
                }

                var posX = ev.deltaX + lastPosX;
                var posY = ev.deltaY + lastPosY;
                timing_btb_listner.style.left = posX + "px";
                timing_btb_listner.style.top = posY + "px";




            }

            // Hold gesture stop (pressup)
            if (ev.type == "panend") {
                if (ev.isFinal) {
                    isDragging = false;
                }


            }
            timing_btb_listner.style.position = "fixed";
        });



        panel_header_hammer.on("panmove panend tap", function(ev) {


            // Hold gesture start (press)
            if (ev.type == "panmove") {
                console.log("Hold active");
                console.log(ev);
                if (!isDragging) {
                    isDragging = true;
                    lastPosX = panel_header_style.offsetLeft;
                    lastPosY = panel_header_style.offsetTop;
                }

                var posX = ev.deltaX + lastPosX;
                var posY = ev.deltaY + lastPosY;
                panel_header_style.style.left = posX + "px";
                panel_header_style.style.top = posY + "px";


            }

            // Hold gesture stop (pressup)
            if (ev.type == "panend") {
                if (ev.isFinal) {
                    isDragging = false;
                }


            }

            if (ev.type == "tap") {
                console.log('tap');
                panel_header_style.click();

            }
        });
        panel_header_hammer_2.on("panmove panend", function(ev) {


            // Hold gesture start (press)
            if (ev.type == "panmove") {
                console.log("Hold active");
                console.log(ev);
                if (!isDragging) {
                    isDragging = true;
                    lastPosX = panel_header_style_2.offsetLeft;
                    lastPosY = panel_header_style_2.offsetTop;
                }

                var posX = ev.deltaX + lastPosX;
                var posY = ev.deltaY + lastPosY;
                panel_header_style_2.style.left = posX + "px";
                panel_header_style_2.style.top = posY + "px";


            }

            // Hold gesture stop (pressup)
            if (ev.type == "panend") {
                if (ev.isFinal) {
                    isDragging = false;
                }


            }
        });
    }
};


export default function startListeners() {
    $('#deleteSelected').on('click', () => {
        deleteSelected();
    });

    $('#zoomIn').on('click', () => {
        changeScale(0.2, 'zoomButton', 'zoomButton', 2);
    });

    $('#zoomOut').on('click', () => {
        changeScale(-0.2, 'zoomButton', 'zoomButton', 2);
    });

    $('#undoButton').on('click', () => {
        undo();
    });

    $('#viewButton').on('click', () => {
        fullView();
    });

    $('#projectName').on('click', () => {
        simulationArea.lastSelected = globalScope.root;
        setTimeout(() => {
            document.getElementById("projname").select();
        }, 100);
    });
    /* Makes tabs reordering possible by making them sortable */
    $("#tabsBar").sortable({
        containment: 'parent',
        items: '> div',
        revert: false,
        opacity: 0.5,
        tolerance: 'pointer',
        placeholder: 'placeholder',
        forcePlaceholderSize: true,
    });

    document.getElementById('simulationArea').addEventListener('mousedown', (e) => {
        simulationArea.mouseDown = true;

        // Deselect Input
        if (document.activeElement instanceof HTMLElement)
            document.activeElement.blur();

        errorDetectedSet(false);
        updateSimulationSet(true);
        updatePositionSet(true);
        updateCanvasSet(true);

        simulationArea.lastSelected = undefined;
        simulationArea.selected = false;
        simulationArea.hover = undefined;
        var rect = simulationArea.canvas.getBoundingClientRect();
        simulationArea.mouseDownRawX = (e.clientX - rect.left) * DPR;
        // alert((e.clientX - rect.left) * DPR);
        simulationArea.mouseDownRawY = (e.clientY - rect.top) * DPR;
        simulationArea.mouseDownX = Math.round(((simulationArea.mouseDownRawX - globalScope.ox) / globalScope.scale) / unit) * unit;
        simulationArea.mouseDownY = Math.round(((simulationArea.mouseDownRawY - globalScope.oy) / globalScope.scale) / unit) * unit;
        simulationArea.oldx = globalScope.ox;
        simulationArea.oldy = globalScope.oy;

        e.preventDefault();
        scheduleBackup();
        scheduleUpdate(1);
        $('.dropdown.open').removeClass('open');
    });
    document.getElementById('simulationArea').addEventListener('mouseup', (e) => {
        //alert('mouseup');
        if (simulationArea.lastSelected) simulationArea.lastSelected.newElement = false;
        /*
        handling restricted circuit elements
        */

        if (simulationArea.lastSelected && restrictedElements.includes(simulationArea.lastSelected.objectType) &&
            !globalScope.restrictedCircuitElementsUsed.includes(simulationArea.lastSelected.objectType)) {
            globalScope.restrictedCircuitElementsUsed.push(simulationArea.lastSelected.objectType);
            updateRestrictedElementsList();
        }

        //       deselect multible elements with click
        if (!simulationArea.shiftDown && simulationArea.multipleObjectSelections.length > 0) {
            if (!simulationArea.multipleObjectSelections.includes(
                    simulationArea.lastSelected,
                )) { simulationArea.multipleObjectSelections = []; }
        }
    });
    document.getElementById('simulationArea').addEventListener('mousemove', onMouseMove);


    window.addEventListener('keyup', e => {
        scheduleUpdate(1);
        simulationArea.shiftDown = e.shiftKey;
        if (e.keyCode == 16) {
            simulationArea.shiftDown = false;
        }
        if (e.key == 'Meta' || e.key == 'Control') {
            simulationArea.controlDown = false;
        }
    })

    window.addEventListener('keydown', (e) => {
        if (document.activeElement.tagName == 'INPUT') return;
        if (document.activeElement != document.body) return;

        simulationArea.shiftDown = e.shiftKey;
        if (e.key == 'Meta' || e.key == 'Control') {
            simulationArea.controlDown = true;
        }

        if (simulationArea.controlDown && e.key.charCodeAt(0) == 122) { // detect the special CTRL-Z code
            undo();
        }

        if (listenToSimulator) {
            // If mouse is focusing on input element, then override any action
            // if($(':focus').length){
            //     return;
            // }

            if (document.activeElement.tagName == 'INPUT' || simulationArea.mouseRawX < 0 || simulationArea.mouseRawY < 0 || simulationArea.mouseRawX > width || simulationArea.mouseRawY > height) {
                return;
            }
            // HACK TO REMOVE FOCUS ON PROPERTIES
            if (document.activeElement.type == 'number') {
                hideProperties();
                showProperties(simulationArea.lastSelected);
            }


            errorDetectedSet(false);
            updateSimulationSet(true);
            updatePositionSet(true);
            simulationArea.shiftDown = e.shiftKey;

            if (e.key == 'Meta' || e.key == 'Control') {
                simulationArea.controlDown = true;
            }

            // zoom in (+)
            if ((simulationArea.controlDown && (e.keyCode == 187 || e.keyCode == 171)) || e.keyCode == 107) {
                e.preventDefault();
                ZoomIn();
            }
            // zoom out (-)
            if ((simulationArea.controlDown && (e.keyCode == 189 || e.keyCode == 173)) || e.keyCode == 109) {
                e.preventDefault();
                ZoomOut();
            }

            if (simulationArea.mouseRawX < 0 || simulationArea.mouseRawY < 0 || simulationArea.mouseRawX > width || simulationArea.mouseRawY > height) return;

            scheduleUpdate(1);
            updateCanvasSet(true);
            wireToBeCheckedSet(1);

            // Needs to be deprecated, moved to more recent listeners
            if (simulationArea.controlDown && (e.key == 'C' || e.key == 'c')) {
                //    simulationArea.copyList=simulationArea.multipleObjectSelections.slice();
                //    if(simulationArea.lastSelected&&simulationArea.lastSelected!==simulationArea.root&&!simulationArea.copyList.contains(simulationArea.lastSelected)){
                //        simulationArea.copyList.push(simulationArea.lastSelected);
                //    }
                //    copy(simulationArea.copyList);
            }


            if (simulationArea.lastSelected && simulationArea.lastSelected.keyDown) {
                if (e.key.toString().length == 1 || e.key.toString() == 'Backspace' || e.key.toString() == 'Enter') {
                    simulationArea.lastSelected.keyDown(e.key.toString());
                    e.cancelBubble = true;
                    e.returnValue = false;

                    //e.stopPropagation works in Firefox.
                    if (e.stopPropagation) {
                        e.stopPropagation();
                        e.preventDefault();
                    }
                    return;
                }
            }

            if (simulationArea.lastSelected && simulationArea.lastSelected.keyDown2) {
                if (e.key.toString().length == 1) {
                    simulationArea.lastSelected.keyDown2(e.key.toString());
                    return;
                }
            }

            if (simulationArea.lastSelected && simulationArea.lastSelected.keyDown3) {
                if (e.key.toString() != 'Backspace' && e.key.toString() != 'Delete') {
                    simulationArea.lastSelected.keyDown3(e.key.toString());
                    return;
                }
            }

            if (e.keyCode == 16) {
                simulationArea.shiftDown = true;
                if (simulationArea.lastSelected && !simulationArea.lastSelected.keyDown && simulationArea.lastSelected.objectType != 'Wire' && simulationArea.lastSelected.objectType != 'CircuitElement' && !simulationArea.multipleObjectSelections.contains(simulationArea.lastSelected)) {
                    simulationArea.multipleObjectSelections.push(simulationArea.lastSelected);
                }
            }

            // Detect offline save shortcut (CTRL+SHIFT+S)
            if (simulationArea.controlDown && e.keyCode == 83 && simulationArea.shiftDown) {
                saveOffline();
                e.preventDefault();
            }

            // Detect Select all Shortcut
            if (simulationArea.controlDown && (e.keyCode == 65 || e.keyCode == 97)) {
                selectAll();
                e.preventDefault();
            }

            // deselect all Shortcut
            if (e.keyCode == 27) {
                simulationArea.multipleObjectSelections = [];
                simulationArea.lastSelected = undefined;
                e.preventDefault();
            }

            if ((e.keyCode == 113 || e.keyCode == 81) && simulationArea.lastSelected != undefined) {
                if (simulationArea.lastSelected.bitWidth !== undefined) { simulationArea.lastSelected.newBitWidth(parseInt(prompt('Enter new bitWidth'), 10)); }
            }

            if (simulationArea.controlDown && (e.key == 'T' || e.key == 't')) {
                // e.preventDefault(); //browsers normally open a new tab
                simulationArea.changeClockTime(prompt('Enter Time:'));
            }
        }

        if (e.keyCode == 8 || e.key == 'Delete') {
            deleteSelected();
        }
    }, true);


    document.getElementById('simulationArea').addEventListener('dblclick', (e) => {
        updateCanvasSet(true);
        if (simulationArea.lastSelected && simulationArea.lastSelected.dblclick !== undefined) {
            simulationArea.lastSelected.dblclick();
        } else if (!simulationArea.shiftDown) {
            simulationArea.multipleObjectSelections = [];
        }
        scheduleUpdate(2);
    });

    document.getElementById('simulationArea').addEventListener('mouseup', onMouseUp);

    document.getElementById('simulationArea').addEventListener('mousewheel', MouseScroll);
    document.getElementById('simulationArea').addEventListener('DOMMouseScroll', MouseScroll);

    function MouseScroll(event) {
        updateCanvasSet(true);
        event.preventDefault();
        var deltaY = event.wheelDelta ? event.wheelDelta : -event.detail;
        event.preventDefault();
        var deltaY = event.wheelDelta ? event.wheelDelta : -event.detail;
        const direction = deltaY > 0 ? 1 : -1;
        handleZoom(direction);
        updateCanvasSet(true);
        gridUpdateSet(true);

        if (layoutModeGet()) layoutUpdate();
        else update(); // Schedule update not working, this is INEFFICIENT
    }

    document.addEventListener('cut', (e) => {
        if (verilogModeGet()) return;
        if (document.activeElement.tagName == 'INPUT') return;
        if (document.activeElement.tagName != 'BODY') return;

        if (listenToSimulator) {
            simulationArea.copyList = simulationArea.multipleObjectSelections.slice();
            if (simulationArea.lastSelected && simulationArea.lastSelected !== simulationArea.root && !simulationArea.copyList.contains(simulationArea.lastSelected)) {
                simulationArea.copyList.push(simulationArea.lastSelected);
            }


            var textToPutOnClipboard = copy(simulationArea.copyList, true);

            // Updated restricted elements
            updateRestrictedElementsInScope();
            localStorage.setItem('clipboardData', textToPutOnClipboard);
            e.preventDefault();
            if (textToPutOnClipboard == undefined) return;
            if (isIe) {
                window.clipboardData.setData('Text', textToPutOnClipboard);
            } else {
                e.clipboardData.setData('text/plain', textToPutOnClipboard);
            }
        }
    });

    document.addEventListener('copy', (e) => {
        if (verilogModeGet()) return;
        if (document.activeElement.tagName == 'INPUT') return;
        if (document.activeElement.tagName != 'BODY') return;

        if (listenToSimulator) {
            simulationArea.copyList = simulationArea.multipleObjectSelections.slice();
            if (simulationArea.lastSelected && simulationArea.lastSelected !== simulationArea.root && !simulationArea.copyList.contains(simulationArea.lastSelected)) {
                simulationArea.copyList.push(simulationArea.lastSelected);
            }

            var textToPutOnClipboard = copy(simulationArea.copyList);

            // Updated restricted elements
            updateRestrictedElementsInScope();
            localStorage.setItem('clipboardData', textToPutOnClipboard);
            e.preventDefault();
            if (textToPutOnClipboard == undefined) return;
            if (isIe) {
                window.clipboardData.setData('Text', textToPutOnClipboard);
            } else {
                e.clipboardData.setData('text/plain', textToPutOnClipboard);
            }
        }
    });

    document.addEventListener('paste', (e) => {
        if (document.activeElement.tagName == 'INPUT') return;
        if (document.activeElement.tagName != 'BODY') return;

        if (listenToSimulator) {
            var data;
            if (isIe) {
                data = window.clipboardData.getData('Text');
            } else {
                data = e.clipboardData.getData('text/plain');
            }

            paste(data);

            // Updated restricted elements
            updateRestrictedElementsInScope();

            e.preventDefault();
        }
    });

    // 'drag and drop' event listener for subcircuit elements in layout mode 
    $('#subcircuitMenu').on('dragstop', '.draggableSubcircuitElement', function(event, ui) {
        const sideBarWidth = $('#guide_1')[0].clientWidth;
        let tempElement;

        if (ui.position.top > 10 && ui.position.left > sideBarWidth) {
            // make a shallow copy of the element with the new coordinates
            tempElement = globalScope[this.dataset.elementName][this.dataset.elementId];

            // Changing the coordinate doesn't work yet, nodes get far from element
            tempElement.x = ui.position.left - sideBarWidth;
            tempElement.y = ui.position.top;
            for (let node of tempElement.nodeList) {
                node.x = ui.position.left - sideBarWidth;
                node.y = ui.position.top
            }

            tempBuffer.subElements.push(tempElement);
            this.parentElement.removeChild(this);
        }
    });

    restrictedElements.forEach((element) => {
        $(`#${element}`).mouseover(() => {
            showRestricted();
        });

        $(`#${element}`).mouseout(() => {
            hideRestricted();
        });
    });

    $(".search-input").on("keyup", function() {

        var parentElement = $(this).parent().parent();
        var closeButton = $('.search-close', parentElement);
        var searchInput = $('.search-input', parentElement);
        var searchResults = $('.search-results', parentElement);
        var menu = $('.accordion', parentElement);

        searchResults.css('display', 'block');
        closeButton.css('display', 'block');
        menu.css('display', 'none');
        const value = $(this).val().toLowerCase();

        closeButton.on('click', () => {
            searchInput.val('');
            menu.css('display', 'block');
            searchResults.css('display', 'none');
            closeButton.css('display', 'none');
        });
        if (value.length === 0) {
            menu.css('display', 'block');
            searchResults.css('display', 'none');
            closeButton.css('display', 'none');
            return;
        }
        let htmlIcons = '';
        const result = elementPanelList.filter(ele => ele.toLowerCase().includes(value));
        if (!result.length) searchResults.text('No elements found ...');
        else {
            result.forEach(e => htmlIcons += createIcon(e));
            searchResults
                .html(htmlIcons);
            $('.filterElements').mousedown(createElement);
        }
    });

    function createIcon(element) {
        console.log("checking");
        return `<div class="${element} icon logixModules filterElements" id="${element}" title="${element}">
            <img  src= "/img/${element}.svg" >
        </div>`;
    }

    zoomSliderListeners();
    setupLayoutModePanelListeners();
    if (!embed) {
        setupTimingListeners();
    }
}
////


var isIe = (navigator.userAgent.toLowerCase().indexOf('msie') != -1 ||
    navigator.userAgent.toLowerCase().indexOf('trident') != -1);

function onMouseMove(e) {
    var rect = simulationArea.canvas.getBoundingClientRect();
    simulationArea.mouseRawX = (e.clientX - rect.left) * DPR;
    simulationArea.mouseRawY = (e.clientY - rect.top) * DPR;
    simulationArea.mouseXf = (simulationArea.mouseRawX - globalScope.ox) / globalScope.scale;
    simulationArea.mouseYf = (simulationArea.mouseRawY - globalScope.oy) / globalScope.scale;
    simulationArea.mouseX = Math.round(simulationArea.mouseXf / unit) * unit;
    simulationArea.mouseY = Math.round(simulationArea.mouseYf / unit) * unit;

    updateCanvasSet(true);

    if (simulationArea.lastSelected && (simulationArea.mouseDown || simulationArea.lastSelected.newElement)) {
        updateCanvasSet(true);
        var fn;

        if (simulationArea.lastSelected == globalScope.root) {
            fn = function() {
                updateSelectionsAndPane();
            };
        } else {
            fn = function() {
                if (simulationArea.lastSelected) { simulationArea.lastSelected.update(); }
            };
        }
        scheduleUpdate(0, 20, fn);
    } else {
        scheduleUpdate(0, 200);
    }
}

function onMouseUp(e) {
    simulationArea.mouseDown = false;
    if (!lightMode) {
        updatelastMinimapShown();
        setTimeout(removeMiniMap, 2000);
    }

    errorDetectedSet(false);
    updateSimulationSet(true);
    updatePositionSet(true);
    updateCanvasSet(true);
    gridUpdateSet(true);
    wireToBeCheckedSet(1);

    scheduleUpdate(1);
    simulationArea.mouseDown = false;

    for (var i = 0; i < 2; i++) {
        updatePositionSet(true);
        wireToBeCheckedSet(1);
        update();
    }
    errorDetectedSet(false);
    updateSimulationSet(true);
    updatePositionSet(true);
    updateCanvasSet(true);
    gridUpdateSet(true);
    wireToBeCheckedSet(1);

    scheduleUpdate(1);
    var rect = simulationArea.canvas.getBoundingClientRect();

    if (!(simulationArea.mouseRawX < 0 || simulationArea.mouseRawY < 0 || simulationArea.mouseRawX > width || simulationArea.mouseRawY > height)) {
        uxvar.smartDropXX = simulationArea.mouseX + 100; // Math.round(((simulationArea.mouseRawX - globalScope.ox+100) / globalScope.scale) / unit) * unit;
        uxvar.smartDropYY = simulationArea.mouseY - 50; // Math.round(((simulationArea.mouseRawY - globalScope.oy+100) / globalScope.scale) / unit) * unit;
    }
}

function resizeTabs() {
    var $windowsize = $('body').width();
    var $sideBarsize = $('.side').width();
    var $maxwidth = ($windowsize - $sideBarsize);
    $('#tabsBar div').each(function(e) {
        $(this).css({ 'max-width': $maxwidth - 30 });
    });
}

window.addEventListener('resize', resizeTabs);
resizeTabs();

$(() => {
    $('[data-toggle="tooltip"]').tooltip();
});

// direction is only 1 or -1
function handleZoom(direction) {
    if (globalScope.scale > 0.5 * DPR) {
        changeScale(direction * 0.1 * DPR);
    } else if (globalScope.scale < 4 * DPR) {
        changeScale(direction * 0.1 * DPR);
    }
    gridUpdateSet(true);
    scheduleUpdate();
}

export function ZoomIn() {
    handleZoom(1);
}

export function ZoomOut() {
    handleZoom(-1);
}

function zoomSliderListeners(zoomtouch = 0, touchenable = false) {
    document.getElementById("customRange1").value = 5;
    document.getElementById('simulationArea').addEventListener('DOMMouseScroll', zoomSliderScroll);
    document.getElementById('simulationArea').addEventListener('mousewheel', zoomSliderScroll);
    let curLevel = document.getElementById("customRange1").value;
    $(document).on('input change', '#customRange1', function(e) {
        let newValue = $(this).val();
        let changeInScale = newValue - curLevel;
        updateCanvasSet(true);
        changeScale(changeInScale * .1, 'zoomButton', 'zoomButton', 3)
        gridUpdateSet(true);
        curLevel = newValue;
    });

    function zoomSliderScroll(e) {
        let zoomLevel = document.getElementById("customRange1").value;
        let deltaY = e.wheelDelta ? e.wheelDelta : -e.detail;
        const directionY = deltaY > 0 ? 1 : -1;
        if (touchenable === true) {
            if (zoomtouch > 0) {
                zoomLevel++

            } else zoomLevel--
        } else {
            if (directionY > 0) {
                zoomLevel++
                console.log("${zoomLevel++} here");
                //console.log(zoomLevel++);
            } else zoomLevel--
        }
        if (zoomLevel >= 45) {
            zoomLevel = 45;
            document.getElementById("customRange1").value = 45;
        } else if (zoomLevel <= 0) {
            zoomLevel = 0;
            document.getElementById("customRange1").value = 0;
        } else {
            document.getElementById("customRange1").value = zoomLevel;
            curLevel = zoomLevel;
        }
    }
}


function touchhandleZoom(direction) {
    if (globalScope.scale > 0.5 * 2) {
        changeScale(direction * 0.1 * 2);
    } else if (globalScope.scale < 4 * 2) {
        changeScale(direction * 0.1 * 2);
    }
    gridUpdateSet(true);
    scheduleUpdate();
}

function sliderZoomButton(direction) {
    var zoomSlider = $('#customRange1');
    var currentSliderValue = parseInt(zoomSlider.val(), 10);
    if (direction === -1) {
        currentSliderValue--;
    } else {
        currentSliderValue++;
    }
    zoomSlider.val(currentSliderValue).change();
}
$('#decrement').click(() => {
    sliderZoomButton(-1);
});

$('#increment').click(() => {
    sliderZoomButton(1);
});