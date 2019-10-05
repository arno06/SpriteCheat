(function(){

    let stage;
    let images;
    let highlight;

    function init(){
        document.querySelector('#files').addEventListener('change', fileSelectedHandler, false);
        document.querySelector('#download').addEventListener('click', downloadSpriteHandler, false);
        document.querySelector('#canvas_width').addEventListener('change', refreshStageHandler, false);
        document.querySelector('#canvas_height').addEventListener('change', refreshStageHandler, false);
        document.querySelector('#file_selector').addEventListener('click', function(e){
            document.querySelector('#files').click();
        }, false);
        stage = new Stage(800, 600, "#canvas");
    }

    function refreshStageHandler(){
        stage.domElement.width = document.querySelector("#canvas_width").value;
        stage.domElement.height = document.querySelector("#canvas_height").value;
        render();
    }

    function downloadSpriteHandler(e){
        e.preventDefault();
        highlight.hide();

        setTimeout(function(){
            var link = document.createElement('a');
            link.download = 'spritecheat.png';
            link.setAttribute("href", stage.domElement.toDataURL("image/png")
                .replace("image/png", "image/octet-stream"));
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
                ul.appendChild(li);
            });
            console.log("ok");
            render();
        }, function(){
            console.log("nop");
        });
    }

    function liClickedHandler(e){
        e.currentTarget.parentNode.querySelectorAll('.selected').forEach(function(pItem){if(e.currentTarget===pItem){return;}pItem.classList.remove('selected');});
        e.currentTarget.classList.toggle('selected');
        var idx = Number(e.currentTarget.getAttribute("data-index"));
        for(var i = 0, max = images.length; i<max; i++){
            var el = images[i];
            if(i===idx){
                var info = "";
                if(e.currentTarget.classList.contains('selected')){
                    highlight.show(el);
                    info = '<p>width:'+el.image.width+'px;</p><p>height:'+el.image.height+'px;</p><p>background-position:-'+(el.x+2)+'px -'+(el.y+2)+'px;</p>';
                }else{
                    highlight.hide();
                }
                document.querySelector('#side .infos div').innerHTML = info;
            }
        }
    }

    function parseAndReadImages(pFiles){
        return new Promise(function(pResolve, pReject){
            let max = pFiles.length;
            if(max>1){
                let loaded = 0;
                let images = [];
                pFiles.forEach(function(pFile, pIndex){
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
                                pReject();
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
                highlight = new Highlight();
                stage.addChild(highlight);
                return;
            }
            var element = new SpriteElement(imgs[current++].getAttribute("src"), next);
            element.x = x;
            element.y = y;
            images.push(element);
            stage.addChild(element);
        }
        next();
    }

    function Highlight(){
        this.reset();
        this._width = 0;
        this._height = 0;
    }

    Class.define(Highlight, [Sprite], {
        _draw:function(){
            this.clear();
            this.setLineStyle(2, "rgb(255, 255, 0)");
            this.drawRect(0, 0, this._width, this._height);
        },
        show:function(el){
            M4Tween.killTweensOf(this);
            M4Tween.to(this, .2, {useStyle:false, x:el.x, y:el.y, _width:el.image.width+4, _height:el.image.height+4}).onUpdate(
                this._draw.proxy(this)
            ).onComplete(this._draw.proxy(this));
        },
        hide:function(){
            this.clear();
        }
    });

    function SpriteElement(pSrc, pOnLoaded){
        this.selected = false;
        this.reset();
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