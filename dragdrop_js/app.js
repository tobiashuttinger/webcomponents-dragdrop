// TODO: Update a data array with new order
// TODO: Create function like resort to update view from data and not only from user interaction
// TODO: Highlight only one drop target at a time

/* Manages drag elements, animations and state */
class DragView {

    constructor(domEl) {

        this.domEl = domEl;
        this.dragElems = new Array();
        this.dragTargets = new Array();

        domEl.querySelectorAll('div').forEach((value, index, source) => {
            let newDragEl = new DragElem(value, this);
            this.registerNewDragElem(newDragEl);
            this.updateDragTargets(newDragEl, false); 
        });

        this.currentDragEl = undefined;
        this.isDragging = false;
        
    };

    registerNewDragElem(el) {
        this.dragElems.push(el); 
        el.addEventListener(
            'dragElChanged',
            this.onDragElChange.bind(this)
        );
        el.addEventListener(
            'onDrop',
            this.onDrop.bind(this)
        );
    }

    registerNewDragTarget(el) {
        this.dragTargets.push(el); 
    }

    /* Updates drag targets around provided element */
    updateDragTargets(el, remove) {
        let nextEl = el.domEl.nextElementSibling;
        let prevEl = el.domEl.previousElementSibling;

        if (remove && prevEl.tagName === "DRAGTARGET") {
            prevEl.remove();
            return;
        } else if (remove && nextEl.tagName === "DRAGTARGET") {
            nextEl.remove();
            return;
        }

        if (prevEl == null || prevEl.tagName !== 'DRAGTARGET') {
            let targetEl = document.createElement('dragtarget');
            this.registerNewDragTarget(new DragTarget(targetEl));
            this.domEl.insertBefore(targetEl, el.domEl);
            
        } 
        if (nextEl == null || nextEl.tagName !== 'DRAGTARGET') {
            let targetEl = document.createElement('dragtarget');
            this.registerNewDragTarget(new DragTarget(targetEl));
            this.domEl.insertBefore(targetEl, el.domEl.nextElementSibling);
        }
    }


    /* Called once when the element being dragged changes */
    onDragElChange(ev) {
        this.currentDragEl = ev.srcElement;
    }

    /* Called when a drag element is dropped onto a target */
    onDrop(ev) {
        
        let dragElem = ev.detail.dragElem;
        let target = ev.detail.dragTarget;

        // Loops through drag elem array to get position of provided drag elem
        // Then inserts the dragElem before the target
        this.dragElems.forEach((value, index, source) => {
            if(Object.is(dragElem, value)) {
                this.domEl.insertBefore(dragElem.domEl, target.domEl);
                this.updateDragElemsInfo('new');
                this.moveDragElems();
                this.updateDragTargets(dragElem, false);
            }
        });

    }


    /* Write current position of all dragElems to their obj properties */
    updateDragElemsInfo(state) {
        
        this.dragElems.forEach((dragElem) => {
            var rect = dragElem.domEl.getBoundingClientRect();
            let infoObj = {
            "x": rect.left,
            "y": rect.top,
            "width": (rect.right - rect.left)
            };
            switch (state) {
                case 'old':
                    dragElem.animateInfoOld = infoObj;
                    break;
    
                case 'new':
                    dragElem.animateInfoNew = infoObj;
                    break;
            }
        });

    }


    /* Animate all dragElems to new position */
    moveDragElems(exclude) {

        this.dragElems.forEach((dragElem) => {

            if (!Object.is(dragElem, exclude)) {
                dragElem.domEl.animate([ 
                    {
                      transform: `translate(${dragElem.animateInfoOld.x - dragElem.animateInfoNew.x}px, ${dragElem.animateInfoOld.y - dragElem.animateInfoNew.y}px) scaleX(${dragElem.animateInfoOld.width/dragElem.animateInfoNew.width})`
                    }, 
                    {
                      transform: 'none'
                    }
                  ], { 
                    duration: 250,
                    easing: 'ease-out'
                  });
            }
           
        });
    }
}


class DragElem extends EventTarget {

    constructor(domEl, dragView) {

        super();
        this.domEl = domEl;
        this.dragView = dragView;
        this.domEl.addEventListener("mousedown", this.mousedown.bind(this));
        this.domEl.addEventListener("mouseup", this.mouseup.bind(this));
        document.addEventListener("pointermove", this.pointermove.bind(this));

        this.dragStarted = false;
        
    };

    mousedown(ev) {

        if (this.dragView.isDragging) {
            return;
        }

        // Set dragging states to allow for only one drag operation at a time
        this.dragStarted = true;
        this.dragView.isDragging = true;
        this.dispatchEvent(new CustomEvent('dragElChanged', { detail: this }, true));
       
        // Save old element position into objects
        this.dragView.updateDragElemsInfo('old');
        
        // Set all necessary styles and transforms for this elem
        this.initialWidth = this.domEl.offsetWidth;
        this.initialHeight = this.domEl.offsetHeight;
        this.pointerXOffset = ev.offsetX;
        this.pointerYOffset = ev.offsetY;
        this.domEl.style.top = '0';
        this.domEl.style.left = '0';
        this.domEl.style.height = this.initialHeight + 'px';
        this.domEl.style.width = this.initialWidth + 'px';
        this.domEl.style.position = 'fixed';
        this.domEl.style.transform = 'translateY('+(ev.clientY-this.pointerYOffset)+'px)';
        this.domEl.style.transform += 'translateX('+(ev.clientX-this.pointerXOffset)+'px)';

        // Update the drag targets around this elem (remove one)
        this.dragView.updateDragTargets(this, true);

        // Save new element position into objects
        this.dragView.updateDragElemsInfo('new');

        // Animate between old and new positions
        this.dragView.moveDragElems(this);
    }


    pointermove(ev) {

        if (!this.dragStarted) {
            return;
        }

        // Update position of this elem with mouse pos
        this.domEl.style.transform = 'translateY('+(ev.clientY-this.pointerYOffset)+'px)';
        this.domEl.style.transform += 'translateX('+(ev.clientX-this.pointerXOffset)+'px)';   
        this.domEl.classList.add('dragging');

        // Check if this elem intersects with any drop target
        this.dragView.dragTargets.forEach((value, index, source) => {
            if (isOverlapping(this.domEl, value.domEl)) {
                value.domEl.classList.add('intersecting');
            } else {
                value.domEl.classList.remove('intersecting');
            }
        });
             
    }


    mouseup(ev) {

        if (!this.dragStarted) {
            return;
        }

        let onDrop;

        this.dragView.updateDragElemsInfo('old');

        this.domEl.classList.remove('dragging');

        this.dragView.dragTargets.forEach((value, index, source) => {
                value.domEl.classList.remove('intersecting');
        });

        // Check if this elem intersects with a drop target, if yes, fire onDrop event. Elem has been successfully dropped.
        this.dragView.dragTargets.every((value, index, source) => {
            if (isOverlapping(this.domEl, value.domEl)) {
                this.resetTransforms();
                this.dispatchEvent(new CustomEvent('onDrop', { detail: { dragElem: this, dragTarget: value } }, true));
                onDrop = true;
                return false;
            }
            return true;
        });
        
        if (!onDrop) {
            this.resetTransforms();
            this.dragView.updateDragElemsInfo('new');
            this.dragView.moveDragElems();
            this.dragView.updateDragTargets(this, false);
        }

        this.dragView.isDragging = false;
        this.dragStarted = false;
    }


    resetTransforms() {
        this.domEl.style.position = 'unset';
        this.domEl.style.transform = 'unset';
        this.domEl.style.width = 'unset';
    }

}


class DragTarget extends EventTarget {

    constructor(domEl) {
        super();
        this.domEl = domEl;

    };

}

/* Tool function, checks if two provided elements are intersecting */
const isOverlapping = (e1, e2) => {
    if (e1.length && e1.length > 1) {
      e1 = e1[0];
    }
    if (e2.length && e2.length > 1){
      e2 = e2[0];
    }
    const rect1 = e1 instanceof Element ? e1.getBoundingClientRect() : false;
    const rect2 = e2 instanceof Element ? e2.getBoundingClientRect() : false;
   
    let overlap = false;
   
    if (rect1 && rect2) {
      overlap = !(
        rect1.right < rect2.left || 
        rect1.left > rect2.right || 
        rect1.bottom < rect2.top || 
        rect1.top > rect2.bottom
      );
      return overlap;  
    }
  
    console.warn('Please provide valid HTMLElement object');
    return overlap;
  }




/* Init */

var dragViewElem;

function init() {
  
    dragViewElem = new DragView(document.getElementById('dragview'));
  
}

document.addEventListener("DOMContentLoaded", function(event) {
    init();
});