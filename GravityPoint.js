// request Animation Frame

window.requestAnimationFrame = (function() {
    return window.requestAnimationFrame ||
    function (callback) {
        window.setTimeout(callback, 1000/ 60);
    }
})();

// let color = ["#49fb35"];

 let color = ["#F2BDF2","#49fb35", "#02CADB", "#F005F5", "#F2BDF2", "#0000FF", "#FF0CD0", "#FF5B19", "#75FF44"]; 

function randomColor () {
    return color[Math.floor(Math.random() * color.length)];
    
}

let particleColor = randomColor();
// Vector

function Vector (x, y) {
    this.x = x || 0;
    this.y = y || 0;
}

Vector.add = function(a, b) {
    return new Vector(a.x + b.x, a.y + b.y);
};

Vector.sub = function(a, b) {
    return new Vector(a.x - b.x, a.y - b.y);
};

Vector.scale = function(v, s) {
    return v.clone().scale(s);
};

Vector.random = function() {
    return new Vector(
        Math.random() * 2 - 1,
        Math.random() * 2 - 1
    );
};

Vector.prototype = {
    set: function(x, y) {
        if (typeof x === "object") {
            y = x.y;
            x = x.x;
        }
        this.x = x || 0;
        this.y = y || 0;

        return this;
    },
    
    add: function(v) {
        this.x += v.x;
        this.y += v.y;

        return this;
    },
    
    sub: function(v) {
        this.x -= v.x;
        this.y -= v.y;

        return this;
    },

    scale: function(s) {
        this.x *= s;
        this.y *= s;

        return this;
    },

    length: function() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    },

    lengthSq: function() {
        return this.x * this.x + this.y * this.y;
    },

    normalize: function() {
        let m = Math.sqrt(this.x * this.x + this.y * this.y);
        
        if (m) {
            this.x /= m;
            this.y /= m;
        }
        return this;
    },

    angle: function() {
        return Math.atan2(this.x, this.y);
    },

    angleTo: function(v) {
        let dx = v.x - this.x,
            dy = v.y - this.y;

        return Math.atan2(dx, dy);
    },

    distanceTo: function(v) {
        let dx = v.x - this.x,
            dy = v.y - this.y;
        
        return Math.sqrt(dx * dx + dy * dy);
    },

    distanceToSq: function(v) {
        let dx = v.x - this.x,
            dy = v.y - this.y;

        return dx * dx + dy * dy;
    },
//?? t = ? trajectory v = velocity 
    lerp: function(v, t) {
        this.x += (v.x - this.x) * t;
        this.y += (v.y - this.y) * t;

        return this;
    },

    clone: function() {
        return new Vector(this.x, this.y);
    },

    toString: function() {
        return "(x:" + this.x + ", y:" + this.y + ")";
    }
};

// Gravity Point

function GravityPoint(x, y, radius, targets) {
    Vector.call(this, x ,y);
    this.radius = radius;
    this.currentRadius = radius * 0.5;

    this._target = {
        particles: targets.particles || [],
        gravities: targets.gravities || []
    };
    this._speed =new Vector();
};

GravityPoint.RADIUS_LIMIT = 65;
GravityPoint.interferenceToPoint = true;

GravityPoint.prototype = (function(o) {
    let s = new Vector(0, 0), p;

    for (p in o) s[p] = o[p];

    return s;

})({
    gravity: 0.05,
    isMouseOver: false,
    dragging: false,
    destroyed: false,
    _easeRadius: 0,
    _dragDistance: null,
    _collapsing: false,

    hitTest: function(p) {
        return this.distanceTo(p) < this.radius;
    },
    
    startDrag: function(dragStartPoint) {
        this._dragDistance = Vector.sub(dragStartPoint, this);
        this.dragging = true;
    },

    drag: function(dragToPoint) {
        const prevPosition = new Vector(this.x, this.y);
        this.x = dragToPoint.x - this._dragDistance.x;
        this.y = dragToPoint.y - this._dragDistance.y;
        this._dragPrevious = Vector.sub(this, prevPosition);
    },

    endDrag: function() {
        this.addSpeed(this._dragPrevious);
        this._dragPrevious = null;
        this._dragDistance = null;
        this.dragging = false;
    },

    addSpeed: function(d) {
        this._speed = this._speed.add(d);
    },

    collapse: function(e) {
        this.currentRadius *= 1.75;
        this._collapsing = true;
    },

    render: function(ctx) {
        if (this.destroyed) return;

        let particles = this._target.particles, i, len;

        for(i = 0, len = particles.length; i < len; i++) {
            particles[i].addSpeed(Vector.sub(this, particles[i]).normalize().scale(this.gravity));
        }

        this._easeRadius = (this._easeRadius + (this.radius - this.currentRadius) * 0.07) * 0.95;
        this.currentRadius += this._easeRadius;
        
        if (this.currentRadius < 0) this.currentRadius = 0;

        if (this._collapsing) {
            this.radius *= 0.75;

            if (this.currentRadius < 1) this.destroyed = true;
            this._draw(ctx);
            return;
        }

        let gravities = this._target.gravities, g, absorbing, area = this.radius * this.radius * Math.PI, garea;

        for(i = 0, len = gravities.length; i < len; i++) {
            
            g = gravities[i];

            if (g === this || g.destroyed) continue;

            if (
                (this.currentRadius >= g.radius || this.dragging) && this.distanceTo(g) < (this.currentRadius + g.radius) * 0.85
            ) {
               g.destroyed = true;
               this.gravity += g.gravity;
               
               absorbing = Vector.sub(g, this).scale(g.radius / this.radius * 0.5);
               
               this.addSpeed(absorbing);

               garea = g.radius * g.radius * Math.PI;
             
               this.currentRadius = Math.sqrt((area + garea * 3) / Math.PI);
               this.radius = Math.sqrt((area + garea) / Math.PI);
            }

            g.addSpeed(Vector.sub(this, g).normalize().scale(this.gravity));
        }

        if (GravityPoint.interferenceToPoint && !this.dragging) this.add(this._speed);

    // By multiplying by less than 1 the speed gets small (damping) 
    // 1 - 0.9 is the percentage of speed it loses each frame.
        this._speed = Vector.scale(this._speed, 0.9);

        if (this.currentRadius > GravityPoint.RADIUS_LIMIT) this.collapse();

        let screenWidth = ctx.canvas.clientWidth;
        let screenHeight = ctx.canvas.clientHeight;
        
        if (this.x > screenWidth) {
            this.x = 0;
        } 
        else if (this.x < 0) {
            this.x = screenWidth;
        } 
        if (this.y > screenHeight){
            this.y = 0;
        } 
        else if (this.y < 0){
            this.y = screenHeight;
        }

        this._draw(ctx);
    },

    _draw: function(ctx) {
        let grd, r;

        ctx.save();

        grd = ctx.createRadialGradient(this.x, this.y, this.radius, this.x, this.y, this.radius * 5);
        grd.addColorStop(0, "rgba(0, 0, 0, 0.1)");
        grd.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius *5, 0, Math.PI * 2, false);
        ctx.fillStyle = grd;
        ctx.fill();

        r = Math.random() * this.currentRadius * 0.7 + this.currentRadius * 0.3;

        grd = ctx.createRadialGradient(this.x, this.y, r, this.x, this.y, this.currentRadius);
        grd.addColorStop(0, "rgba(0, 0, 0, 1)");
        grd.addColorStop(1, Math.random() < 0.2 ? "rgba(255, 196, 0, 0.15)" : "rgba(103, 181, 191, 0.75)");

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.currentRadius, 0, Math.PI * 2, false);

        ctx.fillStyle = grd;
        ctx.fill();
        ctx.restore();
    }
});

function Particle(x, y, radius) {
    Vector.call(this, x, y);

    this.radius = radius;
    this._latest = new Vector();
    this._speed = new Vector();
   
}

Particle.prototype = (function(o) {
    let s = new Vector(0, 0), p;

    for (p in o) s[p] =o[p];
    return s;
})({
    addSpeed: function(d) {
        this._speed.add(d);
    },

    update: function() {
        if (this._speed.length() > 12)
        
        this._speed.normalize().scale(12);
        this._latest.set(this);
        this.add(this._speed);
    }
});

// Initialize

(function() {
    // Configs

    let BACKGROUND_COLOR = "#04328C",
    PARTICLE_RADIUS = 1,
    GRAVITY_POINT_RADIUS = 10;

    let canvas,
        context,
        bufferCvs,
        bufferCtx,
        screenWidth,
        screenHeight,
        mouse = new Vector(),
        gravities = [],
        particles = [],
        grad,
        gui,
        control;
        
        // Event Listener

    function resize(e) {
        screenWidth = canvas.width = window.innerWidth;
        screenHeight = canvas.height = window.innerHeight;
        bufferCvs.width = screenWidth;
        bufferCvs.height = screenHeight;
        context = canvas.getContext("2d");
        bufferCtx = bufferCvs.getContext("2d");

        let cw = canvas.width * 0.5,
            ch = canvas.height * 0.5;

            grad = context.createRadialGradient(cw, ch, 0, cw, ch, Math.sqrt(cw * cw + ch *ch));
            grad.addColorStop(0, "rgba(105,7,242,1)");
            grad.addColorStop(1, "rgba(41,45,115,1)");
    }

    function mouseMove(e) {
        mouse.set(e.clientX, e.clientY);

        let i,
            g,
            hit = false;
        
            for (i = gravities.length - 1; i >= 0; i--) {
                g = gravities[i];
                
                if ((!hit && g.hitTest(mouse)) || g.dragging)
                    g.isMouseOver = hit = true;
                else
                    g.isMouseOver = false;
            }

            canvas.style.cursor = hit ? "pointer" : "default";
    }

    function mouseDown(e) {
        for (let i = gravities.length - 1; i >= 0; i--) {
            if (gravities[i].isMouseOver) {
                gravities[i].startDrag(mouse);
                return;
            }
        }

        gravities.push(new GravityPoint(e.clientX, e.clientY, GRAVITY_POINT_RADIUS, {
            particles: particles,
            gravities: gravities
        }));
    }

    function mouseUp(e) {
        for (let i = 0, len = gravities.length; i < len; i++) {
            if (gravities[i].dragging) {
                gravities[i].endDrag();
                break;
            }
        }
    }

    function doubleClick(e) {
        for (let i = gravities.length - 1; i >= 0; i--) {
            if (gravities[i].isMouseOver) {
                gravities[i].collapse();
                break;
            }
        }
    }

    // Functions

    function addParticle(number) {
        let i, p;

        for (i = 0; i < number; i++) {
            p = new Particle(
                Math.floor(Math.random() * screenWidth - PARTICLE_RADIUS * 2) + 1 + PARTICLE_RADIUS, Math.floor(Math.random() * screenHeight - PARTICLE_RADIUS * 2) + 1 + PARTICLE_RADIUS, PARTICLE_RADIUS
            );
            p.addSpeed(Vector.random());
            particles.push(p);
        }
    }

    function removeParticle(number) {
        if (particles.length < number) number = particles.length;
        for ( let i = 0; i < number; i++) {
            particles.pop();
        }
    }
    // Gui control

    control = {
        particleNumber: 100,
        randomColor: true
    };

    // Init

    canvas = document.getElementById("c");
    bufferCvs = document.createElement("canvas");

    window.addEventListener("resize", resize, false);
    resize(null);

    addParticle(control.particleNumber);

    canvas.addEventListener("mousemove", mouseMove, false);
    canvas.addEventListener("mousedown", mouseDown, false);
    canvas.addEventListener("mouseup", mouseUp, false);
    canvas.addEventListener("dblclick", doubleClick, false);

    // GUI

    gui = new dat.GUI();
    gui.add(control, "particleNumber", 0, 900).step(1).name("Particle Number").onChange(function() {
        let n = (control.particleNumber | 0) - particles.length;

        if (n > 0)
        addParticle(n);
        else if (n < 0)
        removeParticle(-n);
    });

    gui.add(GravityPoint, "interferenceToPoint").name("Interference Between Gravity Points ");

    gui.add(control, "randomColor").name("Random Color Toggle").onChange(function(){
        if (control.randomColor) {
            particleColor = randomColor();
        } else {
            particleColor = "#fff";
        }

    });
    gui.close();

    // Start Update
    
    let loop = function() {
        let i, len, g, p;
       

        context.save();
        context.fillStyle = BACKGROUND_COLOR;
        context.fillRect(0, 0, screenWidth, screenHeight);
        context.fillStyle = grad;
        context.fillRect(0, 0, screenWidth, screenHeight);
        context.restore();

        for (i = 0, len = gravities.length; i < len; i++) {
            g = gravities[i];
            if (g.dragging) g.drag(mouse);
            g.render(context);
            if (g.destroyed) {
                gravities.splice(i, 1);
                len--;
                i--;
            }
        }

        bufferCtx.save();
        bufferCtx.globalCompositeOperation = "destination-out";
        bufferCtx.globalAlpha = 0.35;
        bufferCtx.fillRect(0, 0, screenWidth, screenHeight);
        bufferCtx.restore();

        len = particles.length;
        
        bufferCtx.save();
        bufferCtx.fillStyle = "white";
        
        bufferCtx.strokeStyle = particleColor;
        bufferCtx.lineCap = bufferCtx.lineJoin = "round";
        bufferCtx.lineWidth = PARTICLE_RADIUS * 5;
        bufferCtx.beginPath();

        for (i = 0; i < len; i++) {
            p = particles[i]; 
            p.update();
            bufferCtx.moveTo(p.x, p.y);
            bufferCtx.lineTo(p._latest.x, p._latest.y);
        }

        bufferCtx.stroke();
        bufferCtx.beginPath();

        for (i = 0; i < len; i++) {
            p = particles[i];
            bufferCtx.moveTo(p.x, p.y);
            bufferCtx.arc(p.x, p.y, p.radius, 0, Math.PI * 2, false);
        }
        bufferCtx.fill();
        bufferCtx.restore();

        context.drawImage(bufferCvs, 0, 0);

        requestAnimationFrame(loop);
    };

    loop();

})();
