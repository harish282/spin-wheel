/* =========================================================
 * jquery.spin-wheel.js
 * Repo: https://github.com/sohamgreens/spin-wheel
 * Demo: https://github.com/sohamgreens/spin-wheel
 * Docs: https://github.com/sohamgreens/spin-wheel
 * =========================================================
 * Started by Harish Chauhan @ harish282@gmail.com;
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ========================================================= */

var SpinWheelSkins = {
    'default': {
        outerCircle: { color: "gradient:linear:#ececec:#d4d4d4", margin: 10, shadow: { type: 'outer' } },
        slice: { color: "rgba(255, 255, 255, 1)", margin: 20, offset: 2, shadow: { type: 'outer', blur: 2 }, bgcolors: ['#FFC107', '#00BCD4', '#4CAF50', '#E91E63', 'gradient:linear:#f3c5bd:#e86c57:#ea2803:#c72200'], text: { color: '#ffffff', font: 'Arial', font_size: 10, shadow: { blur: 2, color: '#000000' } } },
        innerCircle: [
            { color: "gradient:linear:#ececec:#d4d4d4", margin: 80, shadow: { type: 'inner' } },
            { color: "gradient:linear:#d2ff52:#7cbc0a", margin: 85, shadow: { type: 'outer' } }
        ],
        arrow: { image: '<svg height="1024" width="650" xmlns="http://www.w3.org/2000/svg" style="fill:green;"><defs><filter id="f3" x="0" y="0" width="200%" height="200%"><feOffset result="offOut" in="SourceAlpha" dx="20" dy="20" /><feGaussianBlur result="blurOut" in="offOut" stdDeviation="10" /><feBlend in="SourceGraphic" in2="blurOut" mode="normal" />   </filter></defs><path  filter="url(#f3)" d="M320 0C143.219 0 0 143.21900000000005 0 320s320 704 320 704 320-527.219 320-704S496.75 0 320 0zM320 448c-70.656 0-128-57.344-128-128s57.344-128 128-128c70.625 0 128 57.344 128 128S390.625 448 320 448z"/><ellipse stroke="#000" ry="128.999996" rx="128" id="svg_2" cy="319.999996" cx="319.5" stroke-width="1.5"  style="fill:#E91E63;"/></svg>', color: ['#bee552', '#52c0e5'] },
    }
};

(function ($) {

    var defaults = {
        radius: 100,
        slices: [],
        skin: 'default',
        tick_sound: null,
        easing: 'linear',
        speed: 2,
        duration: 3000,
    };

    var SpinWheel = function (element, options) {
        this.id = this._guid();
        this.element = $(element);
        this.options = $.extend({}, defaults, options);
        this.radius = 100;
        this.availarea = this.radius;
        this.innerarea = 0;
        this.scale = 1;
        this.diameter = this.radius * 2;

        this.speed = this.options.speed >=1 ? this.options.speed:1;
        this.start_angle = 0;
        this.duration = this.options.duration;// in miliseconds
        this.rotating = false;

        this.rotate_arrow = 0;
        this.images = [];

        this.canvas = null;
        this.ctx = null;
        this.arrow = null;
        this.arrow_angle = 270; //on top
        this.audio = null;
        this.winner = -1;
        this.init();
    }

    SpinWheel.prototype = {
        constructor: SpinWheel,

        config: {
            skins: SpinWheelSkins
        },

        init: function () {
            this._create();
            this._prepareArrow()
            this.render();


            //this.spin();
        },

        getSkin: function () {
            return this.config.skins[this.options.skin];
        },

        _guid: function () {
            function s4() {
                return Math.floor((1 + Math.random()) * 0x10000)
                    .toString(16)
                    .substring(1);
            }
            return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
                s4() + '-' + s4() + s4() + s4();
        },

        _toRadian: function (angle) {
            return angle * (Math.PI / 180);
        },

        _toDegrees: function (angle) {
            return angle * (180 / Math.PI);
        },

        _create: function () {
            this.canvas = $('<canvas></canvas>').attr('width', this.diameter + "px")
                .attr('height', this.diameter + "px")
                .css({
                    width: this.diameter + "px",
                    height: this.diameter + "px",
                    cursor: 'pointer',
                    'user-select': 'none',
                    '-webkit-user-select': 'none',
                    '-moz-user-select': 'none'
                });
            this.ctx = this.canvas[0].getContext("2d");


            if (this.options.radius != this.radius) {
                var scale = this.options.radius / this.radius;
                this.scale = scale;
                this.canvas.attr('width', (this.diameter * scale) + "px")
                    .attr('height', (this.diameter * scale) + "px")
                    .width(this.diameter * scale).height(this.diameter * scale);
                this.ctx.scale(scale, scale);
            }
            this.element.after(this.canvas).hide();
            if (this.options.tick_sound) {
                this.audio = $('<audio><source src="' + this.options.tick_sound + '"></source></audio>');
                this.element.after(this.canvas);
            }

        },

        _onStop: function () {
            if (this.options.onStop) {
                this.options.onStop(this.winner, this.options.slices[this.winner]);
            }
        },

        _onTick: function () {
            this.rotate_arrow = 10;
            if (this.options.onArrowTick) {
                this.options.onArrowTick();
            }
            if (this.audio) {
                this.audio[0].play();
            }
        },

        spin: function (speed, duration) {
            if (speed) this.speed = speed;
            if (duration) this.duration = duration;
            this.start_time = Date.now();
            this.velocity = 0;
            this.start_angle = 0;
            this._calcChance();
            this._rotate();
        },

        render: function () {
            // Get Skin
            var skin = this.getSkin();

            // clear canvas
            this.ctx.clearRect(0, 0, this.diameter, this.diameter);

            // create outer circle
            if (skin.outerCircle instanceof Array) {
                for (var c of skin.outerCircle) {
                    this._drawCircle(c);
                }
            } else {
                this._drawCircle(skin.outerCircle);
            }

            if (skin.innerCircle instanceof Array) {
                this.availarea = skin.innerCircle[0].margin - skin.slice.margin;
                this.innerarea = this.radius - skin.innerCircle[0].margin
            } else {
                this.availarea = skin.innerCircle.margin - skin.slice.margin;
                this.innerarea = this.radius - skin.innerCircle.margin;
            }

            this._drawSlices(skin.slice);

            if (skin.innerCircle instanceof Array) {
                for (var c of skin.innerCircle) {
                    this._drawCircle(c);
                }
            } else {
                this._drawCircle(skin.innerCircle);
            }

            this._drawArrow(skin.arrow);

        },

        _calcChance: function () {
            var chances = [];
            var idx = 0;
            for (var s of this.options.slices) {
                for (var i = 0, l = s.chance ? s.chance : 1; i < l; i++) {
                    chances.push(idx);
                }
                idx++;
            }
            this.winner = chances[Math.floor(Math.random() * chances.length)];
            //console.log(this.winner, this.options.slices[this.winner]);
        },

        _rotate: function () {
            this.rotating = true;
            var self = this;
            var sa = 360/this.options.slices.length;
            var angle = this.arrow_angle + (360 * this.speed) - ( (this.winner+1) * sa ) + (Math.random()*sa);
            var args = $.speed(this.duration, this.easing, function(){
                self.rotating = false;
                self.render();
                self._onStop();
            });
            args.step = function (now, fx) {
                self.start_angle = self._toRadian(now);
                self.render();
                //console.log('rotate(' + now + 'deg)');
            };

            $({ deg: 0 }).animate({ deg: angle }, args);
        },

        _parseColor: function (color, center, radius, is_circle = false) {
            //var center = 0, radius = this.radius;
            if (!is_circle) is_circle = false;
            var start = is_circle ? -radius : center;
            //console.info(radius);
            //var diameter = 2 * radius;
            if (typeof color == 'object') {
                if (color.type == 'radial') {
                    if (color.positions) {
                        var grd = this.ctx.createRadialGradient.apply(this.ctx, color.positions);
                    } else {
                        var grd = this.ctx.createRadialGradient(center, center, 0, center, center, radius);
                    }
                } else {
                    //if (color.colors.length > 2) start = -radius;
                    if (color.positions) {
                        var grd = this.ctx.createLinearGradient.apply(this.ctx, color.positions);
                    } else {
                        var grd = this.ctx.createLinearGradient(start, start, radius, radius);
                    }
                }

                if (color.distribute) {
                    for (var k = 0; k < color.distribute.length; k++) {
                        grd.addColorStop(color.distribute[k], color.colors[k]);
                    }
                } else {
                    var d = 1 / (color.colors.length - 1), j = 0;
                    for (var k = 0; k < color.colors.length; k++) {
                        grd.addColorStop(j, color.colors[k]);
                        j += d;
                    }
                }
                return grd;

            } else if (color.match(/^gradient/)) {
                //gradieant
                var info_arr = color.split(":");

                //if (info_arr[2].match(/^distribute/) || info_arr.length-2 > 2) start = -radius;

                if (info_arr[1] == "radial") {
                    var grd = this.ctx.createRadialGradient(center, center, 0, center, center, radius);
                } else if (info_arr[1] == "linear-v") {
                    var grd = this.ctx.createLinearGradient(start, 0, radius, 0);
                } else if (info_arr[1] == "linear-h") {
                    var grd = this.ctx.createLinearGradient(0, start, 0, radius);
                } else {
                    var grd = this.ctx.createLinearGradient(start, start, radius, radius);
                }

                var i = 2;
                if (info_arr[2].match(/^distribute/)) {
                    var i = 3, j = 0;
                    var distb_arr = info_arr[2].replace(/^distribute-/, '').split(",");
                    for (var k = i; k < info_arr.length; k++) {
                        var d = parseFloat(distb_arr[j++], 10);
                        console.log('color stop at', d, info_arr[k]);
                        grd.addColorStop(d, info_arr[k]);
                    }
                } else {
                    var d = 1 / (info_arr.length - 3), j = 0;
                    for (var k = i; k < info_arr.length; k++) {
                        grd.addColorStop(j, info_arr[k]);
                        j += d;
                    }
                }
                return grd;
            } else {
                return color;
            }
        },

        _drawCircle: function (props) {
            this.ctx.save();

            var radius = this.radius;
            var center = 0;

            if (props.margin) radius = radius - props.margin;
            if (props.stroke) radius = radius - props.stroke.width;

            var angle = props.angle ? props.angle : this._toRadian(360);
            var start_angle = props.start_angle ? props.start_angle : 0;
            var offset = props.offset ? props.offset : 0;

            //angle = Math.abs(angle) > 1 ? this._toRadian(angle) : angle * Math.PI * 2;
            //start_angle = Math.abs(start_angle) > 1 ? this._toRadian(start_angle) : start_angle * Math.PI * 2;
            var mid_angle = (2 * start_angle + angle) / 2;
            var offsetX = Math.cos(mid_angle) * offset;
            var offsetY = Math.sin(mid_angle) * offset;

            this.ctx.beginPath();
            this.ctx.translate(this.radius, this.radius);
            if (props.rotate) {
                this.ctx.rotate(props.rotate);
            }

            //this.ctx.moveTo(center + offsetX, center + offsetY);
            this.ctx.arc(center + offsetX, center + offsetY, radius, start_angle, start_angle + angle);
            if (offset > 0) {
                this.ctx.lineTo(center + offsetX, center + offsetY);
            }

            if (props.shadow && props.shadow.type == 'outer') {
                this.ctx.lineWidth = (props.shadow.width ? props.shadow.width : 0);
                this.ctx.shadowBlur = (props.shadow.blur ? props.shadow.blur : 5) * this.scale;
                this.ctx.shadowColor = props.shadow.color ? props.shadow.color : 'rgba(0, 0, 0, 0.6)';
                this.ctx.shadowOffsetX = (props.shadow.offsetX ? props.shadow.offsetX : 0) * this.scale;
                this.ctx.shadowOffsetY = (props.shadow.offsetY ? props.shadow.offsetY : 0) * this.scale;
            }

            if (props.color) {
                this.ctx.fillStyle = this._parseColor(props.color, center + offsetX, radius, angle == this._toRadian(360));
                this.ctx.fill();
            }

            if (props.image) {
                var self = this;
                if (!props.patternImage) {
                    var img = $('<img/>', {
                        load: function () {
                            props.patternImage = img[0];
                            self.render();
                            //self._drawArrow(props);
                        },
                        src: props.image,
                        height: radius,
                        width: radius,
                    });
                } else {
                    //this.ctx.clip();
                    var r = radius * 0.9;
                    var pattern = this.ctx.drawImage(props.patternImage, -r, -r, 2 * r, 2 * r);
                }
            } else if (props.pattern) {
                var self = this;
                //console.log(props.patternImage);
                if (!props.patternImage) {
                    var img = $('<img/>', {
                        load: function () {
                            props.patternImage = img[0];
                            self.render();
                            //self._drawArrow(props);
                        },
                        src: props.pattern,
                    });
                } else {
                    var pattern = this.ctx.createPattern(props.patternImage, 'repeat');
                    this.ctx.fillStyle = pattern;
                    this.ctx.fill();
                }
            }

            if (props.stroke) {
                this.ctx.lineWidth = props.stroke.width;
                this.ctx.strokeStyle = this._parseColor(props.stroke.color);
                this.ctx.stroke();
            }

            if (props.shadow && props.shadow.type == 'inner') {

                this.ctx.beginPath();
                this.ctx.arc(center, center, radius, 0, Math.PI * 2, false);
                this.ctx.clip();

                this.ctx.beginPath();
                this.ctx.strokeStyle = '#000000';
                this.ctx.lineWidth = (props.shadow.width ? props.shadow.width : 5);
                this.ctx.shadowBlur = (props.shadow.blur ? props.shadow.blur : 5) * this.scale;
                this.ctx.shadowColor = props.shadow.color ? props.shadow.color : 'rgba(0, 0, 0, 0.6)';
                this.ctx.shadowOffsetX = (props.shadow.offsetX ? props.shadow.offsetX : 0) * this.scale;
                this.ctx.shadowOffsetY = (props.shadow.offsetY ? props.shadow.offsetY : 0) * this.scale;
                this.ctx.arc(center, center, radius + 3, 0, 2 * Math.PI, false);
                this.ctx.stroke();
            }
            this.ctx.closePath();
            this.ctx.restore();

            if (props.text) {
                this._drawText(props.rotate || start_angle, angle, props.text)
            }
        },

        _wrapText: function (text, props, maxWidth, lineHeight, y = 0) {
            var words = text.split(' ');
            var line = '';

            this.ctx.font = props.font_size + 'px ' + props.font;

            for (var n = 0; n < words.length; n++) {
                var testLine = line + words[n] + ' ';
                var metrics = this.ctx.measureText(testLine);
                var testWidth = metrics.width;
                if (testWidth > maxWidth && n > 0) {
                    if (props.stroke) this.ctx.strokeText(line, -this.ctx.measureText(line).width / 2, y);
                    this.ctx.fillText(line, -this.ctx.measureText(line).width / 2, y);
                    line = words[n] + ' ';
                    y += lineHeight;
                }
                else {
                    line = testLine;
                }
            }
            if (props.stroke) this.ctx.strokeText(line, -this.ctx.measureText(line).width / 2, y);
            this.ctx.fillText(line, -this.ctx.measureText(line).width / 2, y);
        },

        _resizeText: function (text, sw, props) {
            var fontsize = props.font_size;
            do {
                this.ctx.font = fontsize + 'px ' + props.font;
                fontsize--;
            } while (this.ctx.measureText(text).width > sw)
            if (props.stroke) this.ctx.strokeText(text, -this.ctx.measureText(text).width / 2, 0);
            this.ctx.fillText(text, -this.ctx.measureText(text).width / 2, 0);
        },

        _drawText: function (start_angle, angle, props) {
            this.ctx.save();
            var mid_angle = (2 * start_angle + angle) / 2;
            var text = props.text;
            var ms = 7;
            var center = this.radius;
            var mul = (this.options.slices.length <= ms && !props.show_vertical) ? props.radius : (this.availarea / 2 + this.innerarea);
            var offsetX = Math.cos(mid_angle) * mul;
            var offsetY = Math.sin(mid_angle) * mul;
            if (props.shadow) {
                this.ctx.shadowOffsetX = (props.shadow.offsetX ? props.shadow.offsetX : 0);
                this.ctx.shadowOffsetY = (props.shadow.offsetY ? props.shadow.offsetY : 0);
                this.ctx.shadowBlur = (props.shadow.blur ? props.shadow.blur : 0) * this.scale;
                this.ctx.shadowColor = props.shadow.color;
            }
            this.ctx.fillStyle = props.color;
            this.ctx.translate(center + offsetX, center + offsetY);

            if (props.stroke) {
                this.ctx.lineWidth = props.stroke.width;
                this.ctx.strokeStyle = this._parseColor(props.stroke.color);
            }

            if (this.options.slices.length <= ms && !props.show_vertical) {

                var a = Math.cos(start_angle) * props.radius - Math.cos(start_angle + angle) * props.radius;
                var b = Math.sin(start_angle) * props.radius - Math.sin(start_angle + angle) * props.radius;
                var sw = Math.sqrt(a * a + b * b);

                this.ctx.rotate(mid_angle + Math.PI / 2);
                if (props.font) {
                    //this._resizeText(text, sw, props);
                    this._wrapText(text, props, sw, props.font_size);
                } else {
                    if (props.stroke) this.ctx.strokeText(text, -this.ctx.measureText(text).width / 2, 0);
                    this.ctx.fillText(text, -this.ctx.measureText(text).width / 2, 0);
                }
            } else {
                this.ctx.rotate(mid_angle + Math.PI);
                this._resizeText(text, this.availarea, props);
            }
            this.ctx.strokeStyle = 'blue';
            //this.ctx.strokeText(text);

            this.ctx.restore();
        },

        _drawSlices: function (props) {
            var sa = this.start_angle;
            var slices = this.options.slices;
            var arc = this._toRadian(360 / slices.length);
            //this._drawCircle({color: props.color, stroke: props.stroke?props.stroke:null , angle: 20, margin: props.margin  });
            this.ctx.save();
            var clridx = 0;
            for (var i = 0; i < slices.length; i++) {
                var slice = slices[i];
                var text = slice.label;

                if (!slice.props) {
                    slice.props = $.extend({}, props, slice.style || {});
                }
                var params = $.extend(slice.props, { start_angle: 0, angle: arc, rotate: sa + arc * i }); //sa + arc * i
                if (props.bgcolors) {
                    params['color'] = slice.style && slice.style.color ? slice.style.color : props.bgcolors[clridx];
                    clridx++;
                    if (clridx >= props.bgcolors.length) clridx = 0;
                }
                if (slice.style && slice.style.color) {
                    params['pattern'] = null;
                    params['color'] = slice.style.color;
                }
                $.extend(params.text, { text: text, radius: this.radius * 0.80 - props.margin });
                //console.log(params);
                //params["text"] = { text: text, style: slice.text ? slice.text:props.text, radius: this.radius * 0.80 - props.margin };
                var slicea = (sa + arc * (i + 1)) % this._toRadian(360);
                var da = this.velocity * this._toRadian(30);
                if (slicea >= this._toRadian(this.arrow_angle) && slicea <= this._toRadian(this.arrow_angle+10) && this.rotate_arrow == 0 && this.rotating) {
                    this._onTick();
                }
                //console.log(slicea, this._toRadian(this.arrow_angle));
                this._drawCircle(params);
                this.ctx.save();

                this.ctx.restore();
                //this._drawText(text, sa + arc * i, arc, props.text);
            }
            this.ctx.restore();
        },

        _drawArrow: function (props) {
            if (this.arrow) {
                this.ctx.save();
                this.ctx.beginPath();
                this.ctx.translate(this.radius - this.arrow.width/2, 5);
                if (this.rotate_arrow > 0 && this.rotating) {
                    this.ctx.rotate(-this._toRadian(this.rotate_arrow));
                    this.rotate_arrow += 5;
                    if (this.rotate_arrow >= 50) {
                        this.rotate_arrow = 0;
                    }
                } 
                this.ctx.drawImage(this.arrow, 0, -5);
                this.ctx.restore();
            }
        },

        _prepareArrow: function () {
            var skin = this.getSkin();
            var props = skin.arrow;
            var svg = props.image;

            if (props.color) {
                if (props.color instanceof Array) {
                    var t = 0;
                    for (var i = 0; i < props.color.length; i++) {
                        var t = 0;
                        svg = svg.replace(/fill:[^;]*/g, function (match) {
                            return t++ == i ? 'fill:' + props.color[i] : match;
                        });
                    }
                } else {
                    svg = svg.replace(/fill:[^;]*/, 'fill:' + props.color);
                }

            }

            var svg = $.parseXML(svg);
            var svge = $(svg).find('svg');
            var svgh = svge.attr('height');
            var svgw = svge.attr('width');
            var h = 25;
            var sh = h / svgh;
            var w = svgw * sh;
            var sw = w / svgw;
            var transformTag = $(document.createElementNS('http://www.w3.org/2000/svg', 'g'))
                .attr('transform', 'scale(' + sw + ', ' + sh + ')');

            svge.attr({
                'height': h,
                'viewbox': '0 0 ' + w + ' ' + h,
                'width': w
            }).wrapInner(transformTag);
            var self = this;

            svg = (new XMLSerializer()).serializeToString(svge[0]);
            image = $('<img/>', {
                height: h,
                load: function () {
                    self.arrow = image[0];
                    self._drawArrow(props);
                },
                src: 'data:image/svg+xml,' + window.escape(svg),
                width: w
            });
        }

    }


    $.fn.spinWheel = function (options) {
        if (!$(this).data("spin-wheel")) {
            $(this).each(function () {
                var wheel = new SpinWheel($(this)[0], options);
                $(this).data("spin-wheel", wheel);
            })
        } else {
            return $(this).data("spin-wheel");
        }
    }

    $(function () {
        $("[data-spin-wheel]").spinWheel();
    })

    /** if not requestanimationframe found  */
    window.requestAnimationFrame = window.requestAnimationFrame
        || window.mozRequestAnimationFrame
        || window.webkitRequestAnimationFrame
        || window.msRequestAnimationFrame
        || function (f) { return setTimeout(f, 1000 / 60) };

}(jQuery));

