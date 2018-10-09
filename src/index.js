var $ = require('jquery');
var drawing = false;
var canvas;
var ctx;
$().ready(function(){
  canvas = $("#canvas");
  ctx = canvas.get(0).getContext("2d");
  init();
});
var points = []
class Point {
  constructor(x,y,relative=false,offsetX=0,offsetY=0){
    this.x = x;
    this.y = y;
    points.push(this);
    this.relative=  relative;
    this.offsetX = offsetX;
    this.offsetY = offsetY;
  }
  draw(c){
    c.beginPath();
    var rX= this.x + this.offsetX;
    var rY= this.y + this.offsetY;
    c.fillStyle="#141414";
    c.rect(rX-5,rY-5,10,10);
    c.fill();
    c.closePath();
    c.stroke();
  }
  intersect(x,y,dist){
    var rX= this.x + this.offsetX;
    var rY= this.y + this.offsetY;

    if(rX > x-(dist/2) && rX < x+(dist/2) && rY > y-(dist/2) && rY < y+(dist/2)){
      return true;
    }
    return false;
  }
}
class Shape {
  constructor(){
    this.points = [];
    this.fillStyle = "#FF0000";
    this.lineStyle = "#000000";
  }
  addPoint(p){
    this.points.push(p);
  }
  draw(c){
    c.fillStyle = this.fillStyle;
    c.lineStyle = this.lineStyle;
    c.beginPath();
    for(let i = 0; i < this.points.length; i++){
      let p = this.points[i];
      if(i === 0){
        c.moveTo(p.x,p.y);
        continue;
      }
      c.lineTo(p.x,p.y);
    }
    c.lineTo(this.points[0].x,this.points[0].y);
    c.closePath();
    c.stroke();
  }
}
class Rectangle extends Shape {
  constructor(x,y,w,h){
    super();
    this.addPoint(new Point(x,y));
    this.addPoint(new Point(w,h,true,x,y));

  }
  draw(c){
    c.beginPath();
    c.fillStyle = this.fillStyle;
    c.lineStyle = this.lineStyle;
    c.rect(this.points[0].x,this.points[0].y,this.points[1].x,this.points[1].y);
    c.closePath();
    if (this.fillStyle != null){
      c.fill();
    }if (this.strokeStyle != null){
      c.stroke();
    }

  }
}
var shapes = [];


function init(){
  canvas.mousemove(function(event){
    onMouseMove(event);
  })
  canvas.mouseup(function(event){
    onMouseUp(event);
  })
  canvas.mousedown(function(event){
    onMouseDown(event);
  })
  shapes.push(new Rectangle(10,10,50,50));
  redrawAll();
}



function redrawAll(){
  ctx.clearRect(0,0,canvas[0].width,canvas[0].height);
  for(let i = 0; i < shapes.length; i++){
    shapes[i].draw(ctx);
  }

}
function getMousePos(canvas, evt) {
        var rect = canvas.getBoundingClientRect();
        return {
          x: evt.clientX - rect.left,
          y: evt.clientY - rect.top
        };
      }

function onMouseMove(e){
  redrawAll();
  for(let i = 0; i < points.length; i++){
    let p = points[i];
    let mPos = getMousePos(canvas[0],e);
    if(p.intersect(mPos.x,mPos.y,10)){
      p.draw(ctx);
    }
  }
}
function onMouseDown(e){
  drawing = true;
}
function onMouseUp(e){
  drawing = false;
}
