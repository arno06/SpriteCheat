(function(){

    var stage;
    var images;
    var highlight;

    function init(){
        document.querySelector('#files').addEventListener('change', fileSelectedHandler, false);
        document.querySelector('#download').addEventListener('click', downloadSpriteHandler, false);
        stage = new Stage(800, 600, "#canvas");
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
        var files = e.currentTarget.files;

        var ul = e.currentTarget.parentNode.querySelector('ul');

        var max = files.length;
        var loaded = 0;

        if(!max){
            return;
        }

        images = [];
        files.forEach(function(pFile, pIndex){

            var li = document.createElement('li');
            li.addEventListener('click', liClickedHandler, false);
            var preview = document.createElement('img');
            var span = document.createElement('span');
            li.setAttribute("data-index", pIndex);
            li.appendChild(span);

            span.appendChild(preview);
            li.appendChild(document.createTextNode(pFile.name));
            ul.appendChild(li);
            var reader = new FileReader();
            reader.onload = function(e){
                preview.src = e.target.result;
                loaded ++;
                if(loaded === max){
                    render();
                }
            };
            reader.readAsDataURL(pFile);
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
                    info = '<p>width:'+el.image.width+'px;height:'+el.image.height+'px;</p><p>background-position:-'+(el.x+2)+'px -'+(el.y+2)+'px;</p>';
                }else{
                    highlight.hide();
                }
                document.querySelector('#side .infos div').innerHTML = info;
            }
        }
    }

    function render(){
        stage.removeChildren();
        var imgs = document.querySelectorAll('.images ul li img');
        var current = 0;
        var max = imgs.length;

        var x = 1;
        var y = 1;

        var maxHeight = 0;

        function next(pLoaded){
            if(pLoaded){
                if(pLoaded.x + pLoaded.dimensions.width > 800){
                    pLoaded.x = 1;
                    pLoaded.y += maxHeight;
                    maxHeight = 0;
                    y = pLoaded.y;
                    x = pLoaded.dimensions.width;
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
    }

    Class.define(Highlight, [Sprite], {
        show:function(el){
            this.x = el.x;
            this.y = el.y;
            this.clear();
            this.setLineStyle(2, "rgb(255, 255, 0)");
            this.drawRect(0, 0, el.image.width+4, el.image.height+4);
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