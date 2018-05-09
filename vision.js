var point_width = 10;
var point_list = [];
class Point{
  constructor(x,y,tmp = false){
    this.x = x;
    this.y = y;
    if(!tmp){
      point_list.push(this);
    }
  }
  get pos(){
    return this.position;
  }
  get position(){
    return {x:this.x, y:this.y};
  }
  snap(p){
    if(p === this){
      return false;
    }
    if(this.distance(p) < 10){
      point_list.push(this);
      this.x = p.x;
      this.y = p.y;
      console.log("Snap!");
      return true;
    }
    return false;
  }
  distance(p,p1=null){
    if(p1){
      return null;
    }
    return Math.hypot(this.x-p.x, this.y-p.y);
  }
  contains(p,p1){

    if(p1){
      // console.log(p);
      // console.log(p1);
      if(this.x-(point_width/2) < p && this.x+(point_width/2) > p &&
        this.y-(point_width/2) < p1 && this.y+(point_width/2) > p1){
          return true;
        }
    }
    if(this.x-(point_width/2) < p.x && this.x+(point_width/2) > p.x &&
      this.y-(point_width/2) < p.y && this.y+(point_width/2) > p.y){
        return true;
    }
    return false;
  }
  draw(canvas,ctx){
    ctx.fillStyle = "#AAA";
    ctx.fillRect(this.x-(point_width/2),this.y-(point_width/2),point_width,point_width);

  }
}


class Line {
  constructor(a,b,lineStyle = "#999"){

    this.lineStyle = lineStyle;
    this.a = a;
    this.b = b;
  }
  draw(canvas,ctx) {
    ctx.strokeStyle = this.lineStyle;
    ctx.beginPath();
    ctx.moveTo(this.a.x,this.a.y);
    ctx.lineTo(this.b.x,this.b.y);
    ctx.stroke();
    var mPoint = new Point(Mouse.x,Mouse.y,true);
    if(this.a.contains(mPoint)){
      this.a.draw(canvas,ctx);
    }if(this.b.contains(mPoint)){
      this.b.draw(canvas,ctx);
    }
  }
  get line(){
    return {a:this.a.pos,b:this.b.pos}
  }
  getIntersection(ray){

  	// RAY in parametric: Point + Delta*T1
  	var r_px = ray.a.x;
  	var r_py = ray.a.y;
  	var r_dx = ray.b.x-ray.a.x;
  	var r_dy = ray.b.y-ray.a.y;

  	// SEGMENT in parametric: Point + Delta*T2
  	var s_px = this.a.x;
  	var s_py = this.a.y;
  	var s_dx = this.b.x-this.a.x;
  	var s_dy = this.b.y-this.a.y;

  	// Are they parallel? If so, no intersect
  	var r_mag = Math.sqrt(r_dx*r_dx+r_dy*r_dy);
  	var s_mag = Math.sqrt(s_dx*s_dx+s_dy*s_dy);
  	if(r_dx/r_mag==s_dx/s_mag && r_dy/r_mag==s_dy/s_mag){
  		// Unit vectors are the same.
  		return null;
  	}

  	// SOLVE FOR T1 & T2
  	// r_px+r_dx*T1 = s_px+s_dx*T2 && r_py+r_dy*T1 = s_py+s_dy*T2
  	// ==> T1 = (s_px+s_dx*T2-r_px)/r_dx = (s_py+s_dy*T2-r_py)/r_dy
  	// ==> s_px*r_dy + s_dx*T2*r_dy - r_px*r_dy = s_py*r_dx + s_dy*T2*r_dx - r_py*r_dx
  	// ==> T2 = (r_dx*(s_py-r_py) + r_dy*(r_px-s_px))/(s_dx*r_dy - s_dy*r_dx)
  	var T2 = (r_dx*(s_py-r_py) + r_dy*(r_px-s_px))/(s_dx*r_dy - s_dy*r_dx);
  	var T1 = (s_px+s_dx*T2-r_px)/r_dx;

  	// Must be within parametic whatevers for RAY/SEGMENT
  	if(T1<0) return null;
  	if(T2<0 || T2>1) return null;

  	// Return the POINT OF INTERSECTION
  	return {
  		x: r_px+r_dx*T1,
  		y: r_py+r_dy*T1,
  		param: T1
  	};
  }
}
class Polygon {
  constructor(lines){
    this.lines = lines;
  }
  get obj(){
    var obj_array = [];
    this.lines.forEach(function(val){
      obj_array.push(val.line);
    });
    return obj_array;
  }
  draw(canvas,ctx){
    this.lines.forEach(function(val){
      val.draw(canvas,ctx);
    });
  }
  clickListener(canvas,ctx){

  }
}

function getSightPolygon(sightX,sightY){

	// Get all unique points
	var points = (function(segments){
		var a = [];
		segments.forEach(function(seg){
			a.push(seg.a,seg.b);
		});
		return a;
	})(lines);
	var uniquePoints = (function(points){
		var set = {};
		return points.filter(function(p){
			var key = p.x+","+p.y;
			if(key in set){
				return false;
			}else{
				set[key]=true;
				return true;
			}
		});
	})(points);

	// Get all angles
	var uniqueAngles = [];
	for(var j=0;j<uniquePoints.length;j++){
		var uniquePoint = uniquePoints[j];
		var angle = Math.atan2(uniquePoint.y-sightY,uniquePoint.x-sightX);
		uniquePoint.angle = angle;
		uniqueAngles.push(angle-0.00001,angle,angle+0.00001);
	}

	// RAYS IN ALL DIRECTIONS
	var intersects = [];
	for(var j=0;j<uniqueAngles.length;j++){
		var angle = uniqueAngles[j];

		// Calculate dx & dy from angle
		var dx = Math.cos(angle);
		var dy = Math.sin(angle);

		// Ray from center of screen to mouse
		var ray = {
			a:{x:sightX,y:sightY},
			b:{x:sightX+dx,y:sightY+dy}
		};

		// Find CLOSEST intersection
		var closestIntersect = null;
		for(var i=0;i<lines.length;i++){
			var intersect = lines[i].getIntersection(ray);
			if(!intersect) continue;
			if(!closestIntersect || intersect.param<closestIntersect.param){
				closestIntersect=intersect;
			}
		}

		// Intersect angle
		if(!closestIntersect) continue;
		closestIntersect.angle = angle;

		// Add to list of intersects
		intersects.push(closestIntersect);

	}

	// Sort intersects by angle
	intersects = intersects.sort(function(a,b){
		return a.angle-b.angle;
	});

	// Polygon is intersects, in order of angle
	return intersects;

}

///////////////////////////////////////////////////////

// DRAWING
var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");
var foreground = new Image();
function getMouse(e) {
  var element = canvas, offsetX = 0, offsetY = 0, mx, my;

  // Compute the total offset
  if (element.offsetParent !== undefined) {
    do {
      offsetX += element.offsetLeft;
      offsetY += element.offsetTop;
    } while ((element = element.offsetParent));
  }

  // Add padding and border style widths to offset
  // Also add the offsets in case there's a position:fixed bar
  offsetX +=0
  offsetY += 0

  mx = e.pageX - offsetX;
  my = e.pageY - offsetY;

  // We return a simple javascript object (a hash) with x and y defined
  return {x: mx, y: my};
}
var curr_line = null;
canvas.addEventListener('click',function(e){
  // point_list.forEach(function(val,i){
  //   if(val.contains(getMouse(e).x,getMouse(e).y)){
  //     console.log("Pressed!");
  //     return;
  //   }
  // });
  var mPoint = new Point(getMouse(e).x,getMouse(e).y,true);
  if(curr_line){
    point_list.forEach(function(val){
      if (mPoint.snap(val)){
        return;
      }
    });
    curr_line = null;

  }else{
    point_list.forEach(function(val){
      if(mPoint.snap(val)){
        return;
      }
    });
    curr_line = new Line(mPoint,new Point(Mouse.x,Mouse.y,false));
    lines.push(curr_line);
  }
});
function draw(){
  if(curr_line){
    curr_line.b.x = Mouse.x;
    curr_line.b.y = Mouse.y;
  }
	// Clear canvas
	ctx.clearRect(0,0,canvas.width,canvas.height);

	// Draw segments


	// Sight Polygons
	var fuzzyRadius = 10;
	var polygons = [];
	points = [Mouse];
	points.forEach(function(val){
		polygons.push(getSightPolygon(val.x,val.y))
		for(var angle=0;angle<Math.PI*2;angle+=(Math.PI*2)/10){
			var dx = Math.cos(angle)*fuzzyRadius;
			var dy = Math.sin(angle)*fuzzyRadius;
			polygons.push(getSightPolygon(val.x+dx,val.y+dy));
		};
	})


	// DRAW AS A GIANT POLYGON
	for(var i=1;i<polygons.length;i++){
		drawPolygon(polygons[i],ctx,"rgba(255,255,255,0.2)");
	}
	drawPolygon(polygons[0],ctx,"#fff");
	// Masked Foreground
	ctx.globalCompositeOperation = "source-in";
	ctx.drawImage(foreground,0,0);
	ctx.globalCompositeOperation = "source-over";
  ctx.strokeStyle = "#F00";
  for(var i=0;i<lines.length;i++){
    lines[i].draw(canvas,ctx);
  }
	// Draw red dots
	points.forEach(function(val){
	ctx.fillStyle = "#dd3838";
	ctx.beginPath();
    ctx.arc(val.x, val.y, 2, 0, 2*Math.PI, false);
    ctx.fill();
	for(var angle=0;angle<Math.PI*2;angle+=(Math.PI*2)/20){
		var dx = Math.cos(angle)*fuzzyRadius;
		var dy = Math.sin(angle)*fuzzyRadius;
		ctx.beginPath();
    	ctx.arc(val.x+dx, val.y+dy, 2, 0, 2*Math.PI, false);
    	ctx.fill();
    }
	});

}

function drawPolygon(polygon,ctx,fillStyle){
	ctx.fillStyle = fillStyle;
	ctx.beginPath();
	ctx.moveTo(polygon[0].x,polygon[0].y);
	for(var i=1;i<polygon.length;i++){
		var intersect = polygon[i];
		ctx.lineTo(intersect.x,intersect.y);
	}
	ctx.fill();
}
// DRAW LOOP
window.requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.msRequestAnimationFrame;
var updateCanvas = true;
function drawLoop(){
    requestAnimationFrame(drawLoop);
    if(updateCanvas){
    	draw();
    	updateCanvas = false;
    }
}
window.onload = function(){
	foreground.onload = function(){
		drawLoop();
	};
	foreground.src = "http://prints.mikeschley.com/img/s/v-3/p568099269-4.jpg";
};

// MOUSE
var Mouse = {
	x: canvas.width/2,
	y: canvas.height/2
};
canvas.onmousemove = function(event){
	Mouse.x = event.clientX;
	Mouse.y = event.clientY;
	updateCanvas = true;
};


var compressed_level = "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";
var tmp = JSON.parse(LZString.decompressFromBase64(compressed_level));
var lines = [];
tmp.forEach(function(val){
  lines.push(new Line(new Point(val.a.x,val.a.y),new Point(val.b.x,val.b.y),val.lineStyle));
});
