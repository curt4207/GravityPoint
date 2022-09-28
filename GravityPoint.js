// request Animation Frame

window.requestAnimationFrame = (function() {
    return window.requestAnimationFrame 
    function (callback) {
        window.setTimeout(callback, 1000/ 60);
    }
});

// Vector

function Vector (x, y) {
    this.x = x || 0;
    this.y = y || 0;
}

Vector.add = function(a, b) {
    return new Vector(a.x + b.x, a.y + b.y);
};

Vector.add = function(a, b) {
    return new Vector(a.x - b.x, a.y - b.y);
};

Vector.add = function(v, s) {
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
            return dx * dx + dy *dy;
    },
//?? t = ? trajectory v = velocity 
    lerp: function(v, t) {
        this.x += (v.x - this.x) * t;
        this.y += (v.y - this.y) * t;
            return Math.atan2(dx, dy);
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
        this.x = dragToPoint.x - this._dragDistance.x;
        this.y = dragToPoint.y - this._dragDistance.y;
    }
})