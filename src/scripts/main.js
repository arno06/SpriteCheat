(function(){

    let stage;
    let picker;
    let images;

    let mode = 'default';

    let modes = {
        'default':{
            'key':86,
            'title':'Default mode (v)',
            'icon':'icon-mouse-pointer',
            'start':function(){},
            'stop':function(){},
        },
        'hand':{
            'key':72,
            'title':'Hand mode (h)',
            'icon':'icon-hand-paper-o',
            'start':function(){
                stage.domElement.addEventListener("mousedown", modes.hand.startDragHandler, false);
            },
            'stop':function(){
                stage.domElement.removeEventListener("mousedown", modes.hand.startDragHandler, false);
                modes.hand.endDragHandler(null);
            },
            'startDragHandler':function(e){
                document.addEventListener('mousemove', modes.hand.dragHandler, false);
                document.addEventListener('mouseup', modes.hand.endDragHandler, true);
                document.addEventListener('mouseout', modes.hand.endDragHandler, true);
                stage.domElement.parentNode.setAttribute("data-x", e.screenX);
                stage.domElement.parentNode.setAttribute("data-y", e.screenY);
                let s = stage.domElement.parentNode.currentStyle||window.getComputedStyle(stage.domElement.parentNode);
                stage.domElement.parentNode.setAttribute("data-start-x", s.marginLeft.replace("px", ""));
                stage.domElement.parentNode.setAttribute("data-start-y", s.marginTop.replace("px", ""));
            },
            'dragHandler':function(e){
                let diffX = Number(stage.domElement.parentNode.getAttribute("data-x")) - e.screenX;
                let diffY = Number(stage.domElement.parentNode.getAttribute("data-y")) - e.screenY;
                stage.domElement.parentNode.style.marginLeft = (Number(stage.domElement.parentNode.getAttribute("data-start-x"))-diffX)+"px";
                stage.domElement.parentNode.style.marginTop = (Number(stage.domElement.parentNode.getAttribute("data-start-y"))-diffY)+"px";
            },
            'endDragHandler':function(e){
                document.removeEventListener('mousemove', modes.hand.dragHandler);
                document.removeEventListener('mouseup', modes.hand.endDragHandler, true);
                document.removeEventListener('mouseout', modes.hand.endDragHandler, true);
            }
        },
        'zoom':{
            'key':90,
            'title':'Zoom mode (z)',
            'icon':'icon-search',
            'val':1,
            'start':function(){
                stage.domElement.addEventListener('click', modes.zoom.handler);
                document.addEventListener('contextmenu', modes.zoom.handler);
                window.addEventListener('keydown', modes.zoom.keyDownHandler);
                window.addEventListener('keyup', modes.zoom.keyUpHandler);
            },
            'stop':function(){
                stage.domElement.removeEventListener('click', modes.zoom.handler);
                document.removeEventListener('contextmenu', modes.zoom.handler);
                window.removeEventListener('keydown', modes.zoom.keyDownHandler);
                window.removeEventListener('keyup', modes.zoom.keyUpHandler);
            },
            'handler':function(e){
                e.preventDefault();
                if(e.button===2||e.altKey){
                    if(modes.zoom.val <= .2){
                        return;
                    }
                    modes.zoom.val -= .1;
                }else{
                    modes.zoom.val += .1;
                }
                stage.domElement.parentNode.style.transform = 'scale('+modes.zoom.val+', '+modes.zoom.val+')';
                document.querySelector("#canvas #zoom .label").innerHTML = (Math.round(100*modes.zoom.val))+"%";
            },
            'keyUpHandler':function(e){
                if(e.keyCode===18){//alt
                    e.preventDefault();
                    document.querySelector("body #canvas .container canvas.zoom").classList.remove("out");
                }
            },
            'keyDownHandler':function(e){
                if(e.altKey){
                    e.preventDefault();
                    document.querySelector("body #canvas .container canvas.zoom").classList.add("out");
                }
            }
        }
    };

    function init(){
        document.querySelector('#files').addEventListener('change', fileSelectedHandler, false);
        document.querySelector('#download').addEventListener('click', downloadSpriteHandler, false);
        document.querySelector('#canvas_width').addEventListener('change', refreshStageHandler, false);
        document.querySelector('#canvas_height').addEventListener('change', refreshStageHandler, false);
        document.querySelector('#canvas_transparency').addEventListener('click', transparencyHandler, false);
        document.querySelector('#file_selector').addEventListener('click', function(e){
            document.querySelector('#files').click();
        }, false);
        stage = new Stage(800, 600, "#canvas .container");
        picker = new ColorPicker(320, 300, document.querySelector("#canvas_color"));
        picker.icon.addEventListener("click", togglePickerHandler);
        picker.addEventListener(ColorPickerEvent.COLOR_PICKED, refreshStageHandler);
        togglePickerHandler();
        setupModes();
        setupDragDropFiles();
    }

    function togglePickerHandler(e){
        let canvas = picker.stage.domElement;
        let selector = picker.selector;
        let cursor = picker.cursor;
        canvas.style.display = selector.style.display = cursor.style.display = canvas.style.display === "none" ? "block":"none";
        if(canvas.style.display === "block"){
            document.addEventListener("click", hidePicker, true);
        }
    }

    function hidePicker(e){
        if(e.target === picker.stage.domElement){
            return;
        }
        togglePickerHandler();
        document.removeEventListener("click", hidePicker, true);
    }

    function setupDragDropFiles(){
        document.querySelector(".images>div").addEventListener("dragover", function(e){
            e.preventDefault();
        });
        document.querySelector(".images>div").addEventListener("drop", function(e){
            e.preventDefault();
            let files = [];
            for (let i = 0; i < e.dataTransfer.items.length; i++) {
                if (e.dataTransfer.items[i].kind === 'file') {
                    files.push(e.dataTransfer.items[i].getAsFile());
                }
            }
            fileSelectedHandler({currentTarget:{files:files}});
        });
    }

    function setupModes(){
        for(let i in modes){
            if(!modes.hasOwnProperty(i)){
                continue;
            }
            let mode = modes[i];
            let a = document.createElement('a');
            a.setAttribute("data-mode", i);
            a.setAttribute("title", mode.title);
            if(i === "default"){
                a.classList.add("activated");
            }
            let s = document.createElement('span');
            s.classList.add(mode.icon);
            a.appendChild(s);
            document.querySelector('#modes').appendChild(a);
            a.addEventListener("click", function(e){
                e.preventDefault();
                let m = e.currentTarget.getAttribute("data-mode");
                changeMode(m);
            });
        }
        window.addEventListener("keyup", function(e){
            for(let i in modes){
                if(!modes.hasOwnProperty(i)){
                    continue;
                }
                let mode = modes[i];
                if(e.keyCode === mode.key){
                    changeMode(i);
                    return;
                }
            }
            if([46, 83].indexOf(e.keyCode)>-1){
                var selected = document.querySelector('.selected');
                if(!selected){
                    return;
                }
                if(selected.querySelector('.icon-lock')){
                    alert("The selection is locked.");
                    return;
                }
                Highlight.hide();
                let ul = selected.parentNode;
                ul.removeChild(selected);
                ul.querySelectorAll("li").forEach(function(pLi, pIndex){
                    pLi.setAttribute("data-index", pIndex);
                });
                render();
            }
        });

        document.querySelectorAll("#canvas #zoom .icon-zoom-in, #canvas #zoom .icon-zoom-out").forEach(function(pItem){
            pItem.addEventListener("click", function(e){
                e.preventDefault();
                modes.zoom.handler({preventDefault:function(){}, button:Number(e.currentTarget.getAttribute("data-button"))});
            });
        });
    }

    function changeMode(pMode){
        if(!modes[pMode]){
            console.log("Unsupported mode yet "+m);
            return;
        }
        if(mode&&modes[mode]){
            modes[mode].stop();
        }
        document.querySelectorAll("#modes a").forEach(function(pItem){
            if(pItem.getAttribute("data-mode") === pMode){
                pItem.classList.add("activated");
            }
            else{
                pItem.classList.remove("activated");
            }
        });
        stage.domElement.classList.remove(mode);
        mode = pMode;
        stage.domElement.classList.add(mode);
        modes[mode].start();
    }

    function transparencyHandler(e){
        document.querySelector("#canvas_color").parentNode.style.display = e.currentTarget.checked?"none":"flex";
        refreshStageHandler();
    }

    function refreshStageHandler(){
        stage.domElement.width = document.querySelector("#canvas_width").value;
        stage.domElement.height = document.querySelector("#canvas_height").value;
        render();
    }

    function downloadSpriteHandler(e){
        e.preventDefault();
        Highlight.hide();

        setTimeout(function(){
            let link = document.createElement('a');
            link.download = 'spritecheat.png';
            link.setAttribute("href", stage.domElement.toDataURL("image/png").replace("image/png", "image/octet-stream"));
            link.click();
        }, 150);

    }

    function fileSelectedHandler(e){
        let files = e.currentTarget.files;

        let ul = document.querySelector('.images ul');

        if(!files.length){
            return;
        }

        parseAndReadImages(files).then(function(pImages){
            pImages.forEach(function(pImage, pIndex){

                let li = document.createElement('li');
                li.addEventListener('click', liClickedHandler, false);
                let preview = document.createElement('img');
                let span = document.createElement('span');
                li.setAttribute("data-index", pIndex);
                li.appendChild(span);

                span.appendChild(preview);
                preview.src = pImage.dataUrl;
                li.appendChild(document.createTextNode(pImage.name));
                let lock = document.createElement("span");
                lock.classList.add("icon-unlocked");
                lock.addEventListener("click", imgLockHandler, true);
                li.appendChild(lock);
                ul.appendChild(li);
            });
            render();
        }, function(){
            console.log("nop");
        });
    }

    function imgLockHandler(e){
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        let isLocked = e.currentTarget.classList.contains("icon-lock");
        if(isLocked){
            e.currentTarget.classList.replace("icon-lock", "icon-unlocked");
        }else{
            e.currentTarget.classList.replace("icon-unlocked", "icon-lock");
        }

        let li = e.currentTarget.parentNode;
        let idx = Number(e.currentTarget.parentNode.getAttribute("data-index"));
        for(let i = 0, max = images.length; i<max; i++) {
            let el = images[i];
            if(i===idx){
                el.locked = isLocked;
                li.setAttribute('data-x', el.x);
                li.setAttribute('data-y', el.y);
            }
        }
    }

    function liClickedHandler(e){
        e.currentTarget.parentNode.querySelectorAll('.selected').forEach(function(pItem){if(e.currentTarget===pItem){return;}pItem.classList.remove('selected');});
        e.currentTarget.classList.toggle('selected');
        let idx = Number(e.currentTarget.getAttribute("data-index"));
        for(let i = 0, max = images.length; i<max; i++){
            let el = images[i];
            if(i===idx){
                let info = "";
                if(e.currentTarget.classList.contains('selected')){
                    Highlight.show(el);
                    info = '<p>width:'+el.image.width+'px;</p><p>height:'+el.image.height+'px;</p><p>background-position:-'+(el.x+2)+'px -'+(el.y+2)+'px;</p>';
                }else{
                    Highlight.hide();
                }
                document.querySelector('#side .infos div').innerHTML = info;
            }
        }
    }

    function parseAndReadImages(pFiles, pForceSoloImg = false){
        return new Promise(function(pResolve, pReject){
            let max = pFiles.length;
            if(max>1||pForceSoloImg){
                let loaded = 0;
                let images = [];
                pFiles.forEach(function(pFile){
                    let reader = new FileReader();
                    reader.onload = function(e){
                        images.push({name:pFile.name, dataUrl:e.target.result});
                        loaded ++;
                        if(loaded === max){
                            pResolve(images);
                        }
                    };
                    reader.readAsDataURL(pFile);
                });
            }else{

                let fileReader = new FileReader();
                fileReader.onload = function(e){
                    let i = new Image();
                    i.onload = function(e){
                        let s = new Stage(i.width, i.height, "#canvas");
                        s.drawImage(i,  new Rectangle(0, 0, i.width, i.height), new Rectangle(0, 0, i.width, i.height));
                        s.addEventListener(Event.DRAWN, function(){
                            s.removeAllEventListener();
                            s.pause();
                            let p1 = s.getPixel(0, 0);
                            let p2 = s.getPixel(1, 1);
                            if(p1.r === 255 && p1.g === 0 && p1.b === 0 && p1.alpha === 255){
                                let x = 2;
                                let y = 2;

                                let imgs = [];
                                let maxHeight = 0;

                                while(y<s.height){
                                    maxHeight = 0;
                                    while(x<s.width){
                                        let h;
                                        let w;
                                        for(let i = x;i<s.width; i++){
                                            let p = s.getPixel(i, y);
                                            if(p.r === 255 && p.g === 0 && p.b === 0 && p.alpha === 255){
                                                w = (i - x)-2;
                                                break;
                                            }
                                        }
                                        if(w === undefined ){
                                            break;
                                        }
                                        for(let k = y; k<s.height; k++){
                                            let p = s.getPixel((x+w), k);
                                            if(p.r === 255 && p.g === 0 && p.b === 0 && p.alpha === 255){
                                                h = (k - y)-2;
                                                break;
                                            }
                                        }

                                        if(h === undefined){
                                            break;
                                        }

                                        let c = document.createElement("canvas");
                                        c.width = w;
                                        c.height = h;
                                        let ctx = c.getContext('2d');
                                        maxHeight = Math.max(maxHeight, h);
                                        ctx.drawImage(i, x+1, y+1, w, h, 0, 0, w, h);
                                        imgs.push({name:"Image "+(imgs.length+1), dataUrl:c.toDataURL()});
                                        x += w+4;
                                    }
                                    if(maxHeight === 0){
                                        break;
                                    }
                                    x = 2;
                                    y += maxHeight+4;
                                }
                                s.domElement.parentNode.removeChild(s.domElement);
                                pResolve(imgs);
                            }else{
                                s.domElement.parentNode.removeChild(s.domElement);
                                parseAndReadImages(pFiles, true).then(pResolve, pReject);
                            }
                        });
                    };
                    i.setAttribute("src", e.currentTarget.result);
                };
                fileReader.readAsDataURL(pFiles[0]);
            }
        });
    }

    function render(){
        images = [];
        stage.clear();
        stage.removeChildren();
        let imgs = document.querySelectorAll('.images ul li img');
        let current = 0;
        let max = imgs.length;

        let x = 1;
        let y = 1;

        let maxHeight = 0;

        function next(pLoaded){
            if(pLoaded){
                if(pLoaded.x + pLoaded.dimensions.width > stage.domElement.width){
                    pLoaded.x = 1;
                    pLoaded.y += maxHeight;
                    maxHeight = pLoaded.dimensions.height;
                    y = pLoaded.y;
                    x = 1 + pLoaded.dimensions.width;
                }else{
                    x += pLoaded.dimensions.width;
                    maxHeight = Math.max(pLoaded.dimensions.height, maxHeight);
                }
            }
            if(current===max){
                return;
            }
            let img = imgs[current++];
            let li = img.parentNode.parentNode;
            let element = new SpriteElement(img.getAttribute("src"), next);
            let isLocked = li.querySelector("span:last-of-type").classList.contains("icon-lock");
            if(!isLocked){
                element.x = x;
                element.y = y;
            }else{
                element.x = Number(li.getAttribute("data-x"));
                element.y = Number(li.getAttribute("data-y"));
                element.locked = true;
                x = element.x;
                y = element.y;
            }
            images.push(element);
            stage.addChild(element);
        }
        next();

        if(!document.querySelector('#canvas_transparency').checked){
            stage.beginFill(picker.icon.style.backgroundColor);
            stage.drawRect(0, 0, stage.domElement.width, stage.domElement.height);
            stage.endFill();
        }
    }

    function Highlight(){}

    Highlight.getElement = function(){
        let hl = document.querySelector("#highlight");
        if(!hl){
            hl = document.createElement("div");
            hl.setAttribute("id", "highlight");
            document.querySelector("#canvas .container").appendChild(hl);
        }
        return hl;
    };

    Highlight.show = function(pEl){
        let hl = Highlight.getElement();
        M4Tween.killTweensOf(hl);
        M4Tween.to(hl, .2, {left:(pEl.x-1)+"px", top:(pEl.y-1)+"px", width:(pEl.image.width+2)+"px", height:(pEl.image.height+2)+"px", opacity:1});
    };

    Highlight.hide = function(){
        Highlight.getElement().style.opacity = 0;
    };

    function SpriteElement(pSrc, pOnLoaded){
        this.selected = false;
        this.reset();
        this.locked = false;
        this.onLoaded = pOnLoaded||function(){};
        this.image = new Image();
        this.image.addEventListener("load", this.imageLoadedHandler.proxy(this), false);
        this.image.src = pSrc;
        this.dimensions = {width:0,height:0};
    }

    Class.define(SpriteElement, [Sprite], {
        imageLoadedHandler:function()
        {
            this.dimensions = {width:this.image.width+4, height:this.image.height+4};
            this._draw();
            this.onLoaded(this);
        },
        _draw:function(){
            this.clear();
            this.setLineStyle(2, "rgb(255, 0, 0)");
            this.drawImage(this.image, new Rectangle(0, 0, this.image.width, this.image.height), new Rectangle(2, 2, this.image.width, this.image.height));
            this.drawRect(0, 0, this.image.width+4, this.image.height+4);
        }
    });

    FileList.prototype.forEach = Array.prototype.forEach;

    window.addEventListener('DOMContentLoaded', init, false);
})();