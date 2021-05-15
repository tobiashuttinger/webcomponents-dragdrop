class DragView {

    constructor(domEl) {

        this.domEl = domEl;
        this.dragElems = new Array();

        domEl.querySelectorAll('div').forEach((value, index, source) => {
            this.registerNewElem(new DragElem(value));
            value.setAttribute('draggable', 'true'); 
        });
        

        this.currentDragEl = undefined;
        
    };

    registerNewElem(el) {
        this.dragElems.push(el); 
        el.addEventListener(
            "dragElChanged",
            this.onDragElChange.bind(this)
        );
        el.addEventListener(
            "onDrop",
            this.onDrop.bind(this)
        );
    }

    onDragElChange(ev) {
        console.log(ev.srcElement.domEl);
        this.currentDragEl = ev.srcElement;
        
    }

    onDrop(ev) {
        let target = ev.srcElement;

        this.dragElems.forEach((value, index, source) => {
            if(Object.is(target, value)) {
                console.log(`matched! ${index}`);
                this.domEl.insertBefore(this.currentDragEl.domEl, target.domEl);
            }
        });

        // TODO: Update data array with new order
        // Animate (first update array, then re-render??)


    }
}

class DragElem extends EventTarget {

    constructor(domEl) {
        super();
        this.domEl = domEl;
        this.domEl.addEventListener("dragstart", this.dragstart.bind(this));
        this.domEl.addEventListener("dragover", this.dragover.bind(this));
        this.domEl.addEventListener("dragleave", this.dragleave.bind(this));
        this.domEl.addEventListener("drop", this.drop.bind(this));
    };

    dragstart(ev) {
        this.dispatchEvent(new CustomEvent('dragElChanged', { detail: this }, true));
        ev.dataTransfer.effectAllowed = "move";

    }

    dragover(ev) {
        ev.preventDefault();
        console.log('dragover!');
        ev.dataTransfer.dropEffect = "move";
        this.domEl.classList.add('dragover');

    }

    dragleave(ev) {
        ev.preventDefault();
        this.domEl.classList.remove('dragover');

    }

    drop(ev) {
        console.log(ev);
        this.dispatchEvent(new CustomEvent('onDrop', { detail: this }, true));
        this.domEl.classList.remove('dragover');

    }

}


var dragViewElem;

function init() {
  
    dragViewElem = new DragView(document.getElementById('dragview'));
  
    console.log(dragViewElem);

}



document.addEventListener("DOMContentLoaded", function(event) {
    init();
});

