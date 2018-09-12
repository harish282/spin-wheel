#spin-wheel

![spin-wheel](https://github.com/harish282/spin-wheel/blob/master/screen.png)

- 10 Sep 2018

This library needs jquery to run. 
Create spinning prize wheels using HTML canvas.

## Description

This is a feature packed JavaScript library that allows you to easily create HTML5 canvas Spin Wheels highly configurable jQuery plugin class.

Wheels can be animated using inbuild easing functions and many other powerful animation features.

Features Include:
* Easy to use, highly configurable.
* Draw wheels using code generated.
* Numerous text orientation, direction, size and colour options.
* Priority wise prize stopping location.
* Play sounds while the wheel is spinning including a "tick" sound.
* It is free to use with an open source licence.

## Options
* slices: wheel slice data, you can provide additional style for each style to overload default text style like style: { text: { color: '#ffffff', font: 'sans-serif', font_size: 10, shadow: { blur: 6, color: '#d011dd' }, stroke: { width: 1, color: '#d011dd' } } }
* skin: right now 2 skins available, default and wood. You can extend or create new skins easily. Check example code to check to extend skin
* radius: radius of wheel
* tick_sound: if you want to tick on each slice pass
* duration: rotation duration
* speed: speed of duration, min speed is 1
* events: onStop and onArrowTick

Spin function have 2 parameters to overload default speed and duration
like spin(seed, duration)

## Example

Spin Wheel options 

Check example.html included in source

## Guide
TODO: I am not having time to write a guide for now, but in future will do so. 
