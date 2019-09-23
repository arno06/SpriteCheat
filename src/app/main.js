(function(){

    var stage;
    var images;

    function init(){
        document.querySelector('#files').addEventListener('change', fileSelectedHandler, false);
        stage = new Stage(800, 600, "#canvas");
        stage.addChild(new FPS());
    }

    function fileSelectedHandler(e){
        images = [];
        var files = e.currentTarget.files;

        var ul = e.currentTarget.parentNode.querySelector('ul');

        var max = files.length;
        var loaded = 0;

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
        e.currentTarget.parentNode.querySelectorAll('.selected').forEach(function(pItem){pItem.classList.remove('selected');});
        e.currentTarget.classList.toggle('selected');
        var idx = Number(e.currentTarget.getAttribute("data-index"));
        for(var i = 0, max = images.length; i<max; i++){
            var el = images[i];
            if(i===idx){
                el.select();
            }else{
                el.unselect();
            }
        }
    }

    function render(){
        stage.removeChildren();
        var imgs = document.querySelectorAll('.images ul li img');
        var current = 0;
        var max = imgs.length;

        var x = 0;
        var y = 0;

        var maxHeight = 0;

        function next(pLoaded){
            if(pLoaded){
                if(pLoaded.x + pLoaded.dimensions.width > 800){
                    pLoaded.x = 0;
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
                console.log("All loaded");
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
            this.setLineStyle(2, this.selected?"rgb(255, 255, 0)":"rgb(255, 0, 0)");
            this.drawImage(this.image, new Rectangle(0, 0, this.image.width, this.image.height), new Rectangle(2, 2, this.image.width, this.image.height));
            this.drawRect(0, 0, this.image.width+4, this.image.height+4);
        },
        select:function(){
            var p = this.parent;
            p.removeChild(this);
            p.addChild(this);
            this.selected = true;
            this._draw();
            document.querySelector('#side .infos div').innerHTML = '<p>background-size:'+this.image.width+'px '+this.image.height+'px;</p><p>background-position:-'+(this.x+2)+'px -'+(this.y+2)+'px</p>';
        },
        unselect:function(){
            this.selected = false;
            this._draw();
        }
    });

    FileList.prototype.forEach = Array.prototype.forEach;

    window.addEventListener('DOMContentLoaded', init, false);
})();