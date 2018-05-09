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
  //WIP Still needs to actually snap the point. Not just say snap!
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
  //WIP Needed for eventually updating points. 
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
function dump_level(debug=false){
  return LZString.compressToBase64(JSON.stringify(lines));
}


var compressed_level = "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";
var tmp = JSON.parse(LZString.decompressFromBase64(compressed_level));
var lines = [];
tmp.forEach(function(val){
  lines.push(new Line(new Point(val.a.x,val.a.y),new Point(val.b.x,val.b.y),val.lineStyle));
});
