/*
 * Copyright (c) 2015 by Gerrit Grunwald
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var enzo = (function() {

  // Controls
  var gauge = function(parameters) {
    this.Limit = Object.freeze({
      EXCEEDED: 'exceeded',
      IN_RANGE: 'in range',
      UNDERRUN: 'underrun'
    });

    this.TickLabelOrientation = Object.freeze({
      HORIZONTAL: 'horizontal',
      ORTHOGNAL: 'orthogonal',
      TANGENT: 'tangent'
    });

    this.NumberFormat = Object.freeze({
      AUTO: '0',
      STANDARD: '0',
      FRACTIONAL: '0.0#',
      SCIENTIFIC: '0.##E0',
      PERCENTAGE: '##0.0%'
    });

    var doc                     = document;
    var param                   = parameters || {};
    var id                      = param.id || 'control';
    var parentId                = param.parentId || 'body';
    var size                    = param.size || 200;
    var centerX                 = size * 0.5;
    var centerY                 = size * 0.5;
    var scalable                = param.scalable === undefined ? true : param.scalable;
    var oldValue                = value;
    var minValue                = param.minValue || 0;
    var maxValue                = param.maxValue || 100;
    var value                   = param.value || minValue;
    var range                   = maxValue - minValue;
    var threshold               = param.threshold || (maxValue - minValue) * 0.5;
    var thresholdVisible        = param.thresholdVisible === undefined ? true : param.thresholdVisible;
    var minMeasuredValue        = maxValue;
    var minMeasuredValueVisible = param.minMeasuredValueVisible === undefined ? true : param.minMeasuredValueVisible;
    var maxMeasuredValue        = minValue;
    var maxMeasuredValueVisible = param.maxMeasuredValueVisible === undefined ? true : param.maxMeasuredValueVisible;
    var decimals                = param.decimals || 0;
    var title                   = param.title || '';
    var unit                    = param.unit || '';
    var animated                = param.animated === undefined ? true : param.animated;
    var duration                = clamp(0, 10, param.duration) || 1;
    var startAngle              = param.startAngle || 320;
    var angleRange              = param.angleRange || 280;
    var autoScale               = param.autoScale || false;
    var needleColor             = param.needleColor || '#F8907D';
    var tickLabelOrientation    = param.tickLabelOrientation || this.TickLabelOrientation.HORIZONTAL;
    var numberFormat            = param.numberFormat || this.NumberFormat.STANDARD;
    var limit                   = this.Limit.IN_RANGE;
    var sections                = param.sections || [ ];
    var sectionsVisible         = param.sectionsVisible === undefined ? true : param.sectionsVisible;
    var areas                   = param.areas || [ ];
    var areasVisible            = param.areasVisible === undefined ? true : param.areasVisible;
    var markers                 = param.markers || [ ];
    var markersVisible          = param.markersVisible === undefined ? true : param.markersVisible;
    var majorTickSpace          = param.majorTickSpace || 10;
    var minorTickSpace          = param.minorTickSpace || 1;
    var plainValue              = param.plainValue === undefined ? true : param.plainValue;
    var dropShadowEnabled       = param.dropShadowEnabled === undefined ? true : param.dropShadowEnabled;
    var interactive             = param.interactive || false;
    var tickMarkColor           = param.tickMarkColor || 'black';
    var tickLabelColor          = param.tickLabelColor || 'black';

    var angleStep = angleRange / (maxValue - minValue);


    // ******************** Methods *********************************************
    this.getSize = function() { return size; }
    this.setSize = function(nSize) {
      size = nSize;
      onResize();
    };

    this.isScalable = function() {
      return scalable;
    };
    this.setScalable = function(nScalable) {
      scalable = nScalable;
    };

    this.getValue = function() {
      return value;
    };
    this.setValue = function(nValue) {
      if (nValue < this.getMinValue()) {
        setLimit(this.Limit.UNDERRUN);
      } else if (nValue > this.getMaxValue()) {
        setLimit(this.Limit.EXCEEDED);
      } else {
        setLimit(this.Limit.IN_RANGE);
      }
      var newValue = parseFloat(nValue);
      if (animated) {
        var targetValue = newValue < minValue ? minValue : (newValue > maxValue ? maxValue : newValue);
        var tween = new Tween(new Object(), '', Tween.regularEaseInOut, value, targetValue, duration);
        tween.onMotionChanged = function(event) {
          value = event.target._pos;
          drawNeedle();
          drawForeground();
          repaint();
        };
        tween.start();
      } else {
        var oldValue = value;
        value = newValue < minValue ? minValue : (newValue > maxValue ? maxValue : newValue);
        if (value !== oldValue) {
          drawForeground();
          repaint();
        }
      }
    };

    this.getMinValue = function() {
      return minValue;
    };
    this.setMinValue = function(nMinValue) {
      minValue = nMinValue;
      range = maxValue - minValue;
      calcAutoScale();
    };

    this.getMaxValue = function() {
      return maxValue;
    };
    this.setMaxValue = function(nMaxValue) {
      maxValue = nMaxValue;
      range = maxValue - minValue;
      calcAutoScale();
    };

    this.getThreshold = function() {
      return threshold;
    };
    this.setThreshold = function(nThreshold) {
      threshold = clamp(minValue, maxValue, nThreshold);
    };

    this.getMinMeasuredValue = function() {
      return minMeasuredValue;
    };
    var setMinMeasuredValue = function(nMinMeasuredValue) {
      minMeasuredValue = nMinMeasuredValue;
    };

    this.getMaxMeasuredValue = function() {
      return maxMeasuredValue;
    };
    var setMaxMeasuredValue = function(nMaxMeasuredValue) {
      maxMeasuredValue = nMaxMeasuredValue;
    };

    this.resetMinMeasuredValue = function() {
      setMinMeasuredValue(value);
    };
    this.resetMaxMeasuredValue = function() {
      setMaxMeasuredValue(value);
    };
    this.resetMinAndMaxMeasuredValue = function() {
      setMinMeasuredValue(value);
      setMaxMeasuredValue(value);
    };

    this.getDecimals = function() {
      return decimals;
    };
    this.setDecimals = function(nDecimals) {
      decimals = nDecimals;
      drawForeground();
      repaint();
    };

    this.getTitle = function() {
      return title;
    };
    this.setTitle = function(nTitle) {
      title = nTitle;
      drawForeground();
      repaint();
    };

    this.getUnit = function() {
      return unit;
    };
    this.setUnit = function(nUnit) {
      unit = nUnit;
      drawForeground();
      repaint();
    };

    this.isAnimated = function() {
      return animated;
    };
    this.setAnimated = function(nAnimated) {
      animated = nAnimated;
    };

    this.getAnimationDuration = function() {
      return duration;
    };
    this.setAnimationDuration = function(nAnimationDuration) {
      duration = nAnimationDuration;
    };

    this.getStartAngle = function() {
      return startAngle;
    };
    this.setStartAngle = function(nStartAngle) {
      startAngle = nStartAngle;
    };

    this.getAngleRange = function() {
      return angleRange;
    };
    this.setAngleRange = function(nAngleRange) {
      angleRange = nAngleRange;
    };

    this.isAutoScale = function() {
      return autoScale;
    };
    this.setAutoScale = function(nAutoScale) {
      autoScale = nAutoScale;
      calcAutoScale();
    };

    this.getNeedleColor = function() {
      return needleColor;
    };
    this.setNeedleColor = function(nNeedleColor) {
      needleColor = nNeedleColor;
    };

    this.getTickLabelOrientation = function() {
      return tickLabelOrientation;
    };
    this.setTickLabelOrientation = function(nTickLabelOrientation) {
      tickLabelOrientation = nTickLabelOrientation;
    };

    this.getNumberFormat = function() {
      return numberFormat;
    };
    this.setNumberFormat = function(nNumberFormat) {
      numberFormat = nNumberFormat;
    };

    this.getSections = function() {
      return sections;
    };
    this.setSections = function(nSections) {
      sections = nSections;
    };

    this.addSection = function(section) {
      sections.push(section);
    };
    this.removeSection = function(section) {
      if (section in sections) {
        delete sections[section];
      }
    };

    this.areSectionsVisible = function() {
      return sectionsVisible;
    };
    this.setSectionsVisible = function(nSectionsVisible) {
      sectionsVisible = nSectionsVisible;
    };

    this.getAreas = function() {
      return areas;
    };
    this.setAreas = function(nAreas) {
      areas = nAreas;
    };

    this.addArea = function(area) {
      areas.push(area);
    };
    this.removeArea = function(area) {
      if (area in areas) {
        delete areas[area];
      }
    };

    this.areAreasVisible = function() {
      return areasVisible;
    };
    this.setAreasVisible = function(nAreasVisible) {
      areasVisible = nAreasVisible;
    };

    this.getMarkers = function() {
      return markers;
    };
    this.setMarkers = function(nMarkers) {
      markers = nMarkers;
    };

    this.addMarker = function(marker) {
      markers.push(marker);
    };
    this.removeMarker = function(marker) {
      if (marker in markers) {
        delete markers[marker];
      }
    };

    this.areMarkersVisible = function() {
      return markersVisible;
    };
    this.setMarkersVisible = function(nMarkersVisible) {
      markersVisible = nMarkersVisible;
    };

    this.getMajorTickSpace = function() {
      return majorTickSpace;
    };
    this.setMajorTickSpace = function(nMajorTickSpace) {
      majorTickSpace = nMajorTickSpace;
    };

    this.getMinorTickSpace = function() {
      return minorTickSpace;
    };
    this.setMinorTickSpace = function(nMinorTickSpace) {
      minorTickSpace = nMinorTickSpace;
    };

    this.isPlainValue = function() {
      return plainValue;
    };
    this.setPlainValue = function(nPlainValue) {
      plainValue = nPlainValue;
    };

    this.isDropShadowEnabled = function() {
      return dropShadowEnabled;
    };
    this.setDropShadowEnabled = function(nDropShadowEnabled) {
      dropShadowEnabled = nDropShadowEnabled;
    };

    this.isThresholdVisible = function() {
      return thresholdVisible;
    };
    this.setThresholdVisible = function(nThresholdVisible) {
      thresholdVisible = nThresholdVisible;
    };

    this.isMinMeasuredValueVisible = function() {
      return minMeasuredValueVisible;
    };
    this.setMinMeasuredValueVisible = function(nMinMeasuredValueVisible) {
      minMeasuredValueVisible = nMinMeasuredValueVisible;
    };

    this.isMaxMeasuredValueVisible = function() {
      return maxMeasuredValueVisible;
    };
    this.setMaxMeasuredValueVisible = function(nMaxMeasuredValueVisible) {
      maxMeasuredValueVisible = nMaxMeasuredValueVisible;
    };

    this.getTickMarkColor = function() {
      return tickMarkColor;
    };
    this.setTickMarkColor = function(nTickMarkColor) {
      tickMarkColor = nTickMarkColor;
    };

    this.getTickLabelColor = function() {
      return tickLabelColor;
    };
    this.setTickLabelColor = function(nTickLabelColor) {
      tickLabelColor = nTickLabelColor;
    };

    this.getLimit = function() {
      return limit;
    };

    var isInteractive = function() {
      return interactive;
    }
    var setInteractive = function(nInteractive) {
      interactive = nInteractive;
    };


    function setLimit(nLimit) {
      limit = nLimit;
    }

    function calcAutoScale() {
      if (autoScale) {
        var maxNoOfMajorTicks = 10;
        var maxNoOfMinorTicks = 10;
        var niceMinValue;
        var niceMaxValue;
        var niceRange = calcNiceNumber((maxValue - minValue), false);
        majorTickSpace = calcNiceNumber(niceRange / (maxNoOfMajorTicks - 1), true);
        niceMinValue = Math.floor(minValue / majorTickSpace) * majorTickSpace;
        niceMaxValue = Math.ceil(maxValue / majorTickSpace) * majorTickSpace;
        minorTickSpace = calcNiceNumber(majorTickSpace / (maxNoOfMinorTicks - 1), true);
        minValue = niceMinValue;
        maxValue = niceMaxValue;
      }
    }

    function calcNiceNumber(range, round) {
      var exponent = Math.floor(Math.log10(range));   // exponent of range
      var fraction = range / Math.pow(10, exponent);  // fractional part of range
      var niceFraction;

      if (round) {
        if (fraction < 1.5) {
          niceFraction = 1;
        } else if (fraction < 3) {
          niceFraction = 2;
        } else if (fraction < 7) {
          niceFraction = 5;
        } else {
          niceFraction = 10;
        }
      } else {
        if (fraction <= 1) {
          niceFraction = 1;
        } else if (fraction <= 2) {
          niceFraction = 2;
        } else if (fraction <= 5) {
          niceFraction = 5;
        } else {
          niceFraction = 10;
        }
      }
      return niceFraction * Math.pow(10, exponent);
    }

    function validate() {
      if (value < minValue)
        value = minValue;
      if (value > maxValue)
        value = maxValue;

      if (threshold < minValue)
        threshold = minValue;
      if (threshold > maxvalue)
        threshold = maxValue;

      var len;
      for (var i = 0, len = markers.length; i < len; i++) {
        if (markers[i].getValue() < minValue)
          markers[i].setValue(minValue);
        if (markers[i].getValue() > maxValue)
          markers[i].setValue(maxValue);
      }

      for (var i = 0, len = sections.length; i < len; i++) {
        if (sections[i].getStart() < minValue)
          sections[i].setStart(minValue);
        if (sections[i].getStart() > maxValue)
          sections[i].setStart(maxValue);
        if (sections[i].getStop() < minValue)
          sections[i].setStop(minValue);
        if (sections[i].getStop() > maxValue)
          sections[i].setStop(maxValue);
      }
    }

    function clamp(min, max, value) {
      if (value < min)
        return min;
      if (value > max)
        return max;
      return value;
    }

    function onResize() {
      if (scalable) {
        size = window.innerWidth < window.innerHeight ? window.innerWidth : window.innerHeight;
      }
      size *= 0.98;
      centerX = size * 0.5;
      centerY = size * 0.5;

      canvas.width = size;
      canvas.height = size;

      backgroundBuffer.width = size;
      backgroundBuffer.height = size;
      ticksAndSections.width = size;
      ticksAndSections.height = size;
      needleBuffer.width = size;
      needleBuffer.height = size;
      foregroundBuffer.width = size;
      foregroundBuffer.height = size;

      mainCtx.canvas.width = canvas.width;
      mainCtx.canvas.height = canvas.height;

      drawBackground();
      drawTicksAndSections();
      drawNeedle();
      drawForeground();

      repaint();
    }

    function repaint() {
      mainCtx.clearRect(0, 0, canvas.width, canvas.height);
      mainCtx.drawImage(backgroundBuffer, 0, 0);
      mainCtx.drawImage(ticksAndSections, 0, 0);
      mainCtx.drawImage(needleBuffer, 0, 0);
      mainCtx.drawImage(foregroundBuffer, 0, 0);
    }

    var drawBackground = function() {
      var ctx  = backgroundBuffer.getContext('2d');
      var size = backgroundBuffer.width < backgroundBuffer.height ? backgroundBuffer.width : backgroundBuffer.height;

      ctx.clearRect(0, 0, size, size);

      ctx.beginPath();
      ctx.arc(centerX, centerY, 0.5 * size, 0, 2 * Math.PI, false);
      ctx.closePath();
      var outerBorderGradient = ctx.createLinearGradient(0, 0, 0, size);
      outerBorderGradient.addColorStop(0, 'rgb(224, 224, 224)');
      outerBorderGradient.addColorStop(0.26, 'rgb(133, 133, 133)');
      outerBorderGradient.addColorStop(1, 'rgb(84, 84, 84)');
      ctx.fillStyle = outerBorderGradient;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(centerX, centerY, 0.485 * size, 0, 2 * Math.PI, false);
      ctx.closePath();
      var highlightBorderGradient = ctx.createLinearGradient(0, 0.015 * size, 0, 0.9985 * size);
      highlightBorderGradient.addColorStop(0, 'rgb(255, 255, 255)');
      highlightBorderGradient.addColorStop(0.5, 'rgb(146, 146, 147)');
      highlightBorderGradient.addColorStop(1, 'rgb(135, 136, 138)');
      ctx.fillStyle = highlightBorderGradient;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(centerX, centerY, 0.4825 * size, 0, 2 * Math.PI, false);
      ctx.closePath();
      var innerBorderGradient = ctx.createLinearGradient(0, 0.0175 * size, 0, 0.99825 * size);
      innerBorderGradient.addColorStop(0, 'rgb(71, 72, 72)');
      innerBorderGradient.addColorStop(0.5, 'rgb(110, 106, 107)');
      innerBorderGradient.addColorStop(1, 'rgb(186, 185, 187)');
      ctx.fillStyle = innerBorderGradient;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(centerX, centerY, 0.4675 * size, 0, 2 * Math.PI, false);
      ctx.closePath();
      var bodyGradient = ctx.createLinearGradient(0, 0.0375 * size, 0, 0.9625 * size);
      bodyGradient.addColorStop(0, 'rgb(245, 245, 245)');
      bodyGradient.addColorStop(1, 'rgb(235, 235, 235)');
      ctx.fillStyle = bodyGradient;
      ctx.fill();

      // Inner Shadow
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, 0.4825 * size, 0, 2 * Math.PI, false);
      ctx.closePath();
      ctx.clip();
      ctx.beginPath();
      ctx.strokeStyle = innerBorderGradient;
      ctx.lineWidth = 0.015 * size;
      ctx.shadowBlur = 0.1 * size;
      ctx.shadowColor = 'black';
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0.03 * size;
      ctx.arc(centerX, centerY, 0.4825 * size, 0, 2 * Math.PI, false);
      ctx.closePath();
      ctx.stroke();
      ctx.restore();

    };

    var drawTicksAndSections = function() {
      var ctx = ticksAndSections.getContext('2d');
      var size = ticksAndSections.width < ticksAndSections.height ? ticksAndSections.width : ticksAndSections.height;
      ctx.clearRect(0, 0, size, size);
      drawSections(ctx);
      drawAreas(ctx);
      drawTickMarks(ctx);
      drawMarkers(ctx);
    };

    var drawTickMarks = function(ctx) {
      var sinValue;
      var cosValue;
      var orthText = 'orthogonal' === tickLabelOrientation ? 0.33 : 0.31;
      for (var angle = 0, counter = minValue; counter <= maxValue; angle -= angleStep, counter++) {
        sinValue = Math.sin((angle + startAngle) * Math.PI / 180);
        cosValue = Math.cos((angle + startAngle) * Math.PI / 180);

        var innerMainPoint   = {x: centerX + size * 0.368 * sinValue, y: centerY + size * 0.368 * cosValue};
        var innerMediumPoint = {x: centerX + size * 0.388 * sinValue, y: centerY + size * 0.388 * cosValue};
        var innerMinorPoint  = {x: centerX + size * 0.3975 * sinValue, y: centerY + size * 0.3975 * cosValue};
        var outerPoint       = {x: centerX + size * 0.432 * sinValue, y: centerY + size * 0.432 * cosValue};
        var textPoint        = {x: centerX + size * orthText * sinValue, y: centerY + size * orthText * cosValue};

        ctx.strokeStyle = tickMarkColor;
        if (counter % majorTickSpace === 0) {
          // Draw major tickmark
          ctx.lineWidth = size * 0.0055;

          ctx.beginPath();
          ctx.moveTo(innerMainPoint.x, innerMainPoint.y);
          ctx.lineTo(outerPoint.x, outerPoint.y);
          ctx.stroke();

          // Draw text
          ctx.save();
          ctx.translate(textPoint.x, textPoint.y);
          switch (tickLabelOrientation) {
            case 'orthogonal':
              if ((360 - startAngle - angle) % 360 > 90 && (360 - startAngle - angle) % 360 < angleRange) {
                ctx.rotate((180 - startAngle - angle) % 360);
              } else {
                ctx.rotate((360 - startAngle - angle) % 360);
              }
              break;
            case 'tangent':
              if ((360 - startAngle - angle - 90) % 360 > 90 && (360 - startAngle - angle - 90) % 360 < angleRange) {
                ctx.rotate((90 - startAngle - angle) % 360);
              } else {
                ctx.rotate((angleRange - startAngle - angle) % 360);
              }
              break;
            case 'horizontal':
            default:
              break;
          }
          ctx.fillStyle = tickLabelColor;
          ctx.font         = 'normal ' + (0.045 * size) + 'px roboto-regular';
          ctx.textAlign    = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(parseInt(counter), 0, 0);
          ctx.restore();
        } else if (minorTickSpace % 2 !== 0 && counter % 5 === 0) {
          ctx.lineWidth = size * 0.0035;
          ctx.beginPath();
          ctx.moveTo(innerMediumPoint.x, innerMediumPoint.y);
          ctx.lineTo(outerPoint.x, outerPoint.y);
          ctx.stroke();
        } else if (counter % minorTickSpace === 0) {
          ctx.lineWidth = size * 0.00225;
          ctx.beginPath();
          ctx.moveTo(innerMinorPoint.x, innerMinorPoint.y);
          ctx.lineTo(outerPoint.x, outerPoint.y);
          ctx.stroke();
        }
      }
    };

    var drawSection = function(ctx, size, start, stop, color) {
      start = start < minValue ? minValue : start > maxValue ? maxValue : start;
      stop = stop < minValue ? minValue : stop > maxValue ? maxValue : stop;

      var sectionStartAngle = ((angleRange / range * start - angleRange / range * minValue)) * Math.PI / 180;
      var sectionStopAngle = sectionStartAngle + (stop - start) / (range / angleRange) * Math.PI / 180;

      ctx.translate(centerX, centerY);
      ctx.beginPath();
      ctx.arc(0, 0, 0.415 * size, sectionStartAngle, sectionStopAngle, false);
      ctx.translate(-centerX, -centerY);
      ctx.strokeStyle = color;
      ctx.lineWidth = size * 0.037;
      ctx.linecap = 'butt';
      ctx.stroke();
    };

    var drawSections = function(ctx) {
      var OFFSET = 90 - startAngle;

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(OFFSET * Math.PI / 180);
      ctx.translate(-centerX, -centerY);

      var len;
      for (var i = 0, len = sections.length; i < len; i++) {
        var SECTION = sections[i];
        var SECTION_START_ANGLE;
        if (SECTION.start <= maxValue && SECTION.stop >= minValue) {
          drawSection(ctx, size, SECTION.start, SECTION.stop, SECTION.color);
        }
      }
      ctx.restore();
    };

    var drawArea = function(ctx, size, start, stop, color) {
      start = start < minValue ? minValue : start > maxValue ? maxValue : start;
      stop = stop < minValue ? minValue : stop > maxValue ? maxValue : stop;

      var areaStartAngle = ((angleRange / range * start - angleRange / range * minValue)) * Math.PI / 180;
      var areaStopAngle = areaStartAngle + (stop - start) / (range / angleRange) * Math.PI / 180;

      ctx.translate(centerX, centerY);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, 0.395 * size, areaStartAngle, areaStopAngle, false);
      ctx.translate(-centerX, -centerY);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
    };

    var drawAreas = function(ctx) {
      var OFFSET = 90 - startAngle;

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(OFFSET * Math.PI / 180);
      ctx.translate(-centerX, -centerY);

      var len;
      for (var i = 0, len = areas.length; i < len; i++) {
        var AREA = areas[i];
        var AREA_START_ANGLE;
        if (AREA.start <= maxValue && AREA.stop >= minValue) {
          drawArea(ctx, size, AREA.start, AREA.stop, AREA.color);
        }
      }
      ctx.restore();
    };

    var drawMarkers = function(ctx) {
      var len;
      for (var i = 0, len = markers.length; i < len; i++) {
        var MARKER = markers[i];

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate((((angleStep * (MARKER.value - minValue)) - (angleRange * 0.5))) * Math.PI / 180);
        ctx.translate(-centerX, -centerY);

        ctx.beginPath();
        ctx.arc(0.5 * size, 0.07 * size, 0.015 * size, 0, 2 * Math.PI, false);
        ctx.closePath();
        ctx.lineWidth = 0.005 * size;
        ctx.fillStyle = MARKER.color;
        ctx.fill();
        ctx.strokeStyle = deriveColor(MARKER.color, -20);
        ctx.stroke();

        ctx.restore();
      }
    };

    var drawThreshold = function(ctx) {

    };

    var drawNeedle = function() {
      var ctx = needleBuffer.getContext('2d');
      var size = backgroundBuffer.width < backgroundBuffer.height ? backgroundBuffer.width : backgroundBuffer.height;

      ctx.clearRect(0, 0, size, size);

      //needle
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate((((angleStep * (value - minValue)) - (angleRange * 0.5))) * Math.PI / 180);
      ctx.translate(-centerX, -centerY);

      ctx.beginPath();
      ctx.moveTo(0.49524 * size, 0.085 * size);
      ctx.lineTo(0.48008 * size, 0.5 * size);
      ctx.lineTo(0.51992 * size, 0.5 * size);
      ctx.lineTo(0.50476 * size, 0.085 * size);
      ctx.lineTo(0.49524 * size, 0.085 * size);
      ctx.closePath();

      var needleGradient = ctx.createLinearGradient(0, 0.13 * size, 0, 0.5 * size);
      needleGradient.addColorStop(0, deriveColor(needleColor, 0.15));
      needleGradient.addColorStop(1, deriveColor(needleColor, -0.15));
      ctx.fillStyle = needleGradient;
      ctx.fill();
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
      ctx.shadowBlur = 0.015 * size;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0.015 * size;
      ctx.fill();
      ctx.restore();

      var needleHighlight = ctx.createLinearGradient(0.48008 * size, 0, 0.51992 * size, 0);
      needleHighlight.addColorStop(0, 'transparent');
      needleHighlight.addColorStop(0.5, 'transparent');
      needleHighlight.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
      needleHighlight.addColorStop(1, 'rgba(255, 255, 255, 0.2)');
      ctx.fillStyle = needleHighlight;
      ctx.fill();

      ctx.restore();
    };

    var drawForeground = function() {
      var ctx = foregroundBuffer.getContext('2d');
      var size = backgroundBuffer.width < backgroundBuffer.height ? backgroundBuffer.width : backgroundBuffer.height;

      ctx.clearRect(0, 0, size, size);

      ctx.beginPath();
      ctx.arc(centerX, centerY, 0.175 * size, 0, 2 * Math.PI, false);
      ctx.closePath();
      var knobFrameGradient = ctx.createLinearGradient(0, 0.325 * size, 0, 0.675 * size);
      knobFrameGradient.addColorStop(0, 'white');
      knobFrameGradient.addColorStop(0.52, 'rgb(230, 230, 230)');
      knobFrameGradient.addColorStop(1, 'rgb(240, 240, 240)');
      ctx.fillStyle = knobFrameGradient;
      ctx.fill();
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
      ctx.shadowBlur = 0.035 * size;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0.015 * size;
      ctx.fill();
      ctx.restore();
      ctx.beginPath();
      ctx.arc(centerX, centerY, 0.165 * size, 0, 2 * Math.PI, false);
      ctx.closePath();
      var knobGradient = ctx.createLinearGradient(0, 0.335 * size, 0, 0.665 * size);
      knobGradient.addColorStop(0, 'rgb(250, 250, 250)');
      knobGradient.addColorStop(1, 'rgb(230, 230, 230)');
      ctx.fillStyle = knobGradient;
      ctx.fill();

      //title
      ctx.textAlign = 'center';
      ctx.fillStyle = '#888888';
      ctx.textBaseline = 'middle';
      ctx.font = (0.06 * size) + 'px ' + 'roboto-regular';
      ctx.fillText(title, size * 0.5, size * 0.84, size * 0.25);

      //unit
      ctx.font = (0.045 * size) + 'px ' + 'roboto-regular';
      ctx.fillText(unit, size * 0.5, size * 0.4, size * 0.35);

      //value
      ctx.fillStyle = deriveColor('#ffffff', -20);
      ctx.font = (0.1 * size) + 'px roboto-medium';
      ctx.fillText((parseFloat(value).toFixed(decimals)), size * 0.5, size * 0.5, size * 0.33);
    };


    // Create the <canvas> element
    var canvas = doc.createElement('canvas');
    canvas.id     = id;
    canvas.width  = size;
    canvas.height = size;
    parentId === 'body' ? doc.body.appendChild(canvas) : doc.getElementById(parentId).appendChild(canvas);

    // Get the <canvas> context and create all buffers
    var mainCtx = doc.getElementById(id).getContext('2d');
    var backgroundBuffer = doc.createElement('canvas');
    var ticksAndSections = doc.createElement('canvas');
    var needleBuffer = doc.createElement('canvas');
    var foregroundBuffer = doc.createElement('canvas');

    // register listeners
    if (scalable)
      window.addEventListener("resize", onResize, false);
    canvas.onmousedown = function(event) {
      checkForInteractive(event);
    };
    canvas.onmousemove = function(event) {
      if (interactive) {

      }
    };
    canvas.ontouchstart = function(event) {
      checkForInteractive(event);
    };
    canvas.ontouchmove = function(event) {
      if (interactive) {

      }
    };

    function checkForInteractive(event) {
      var x = event.x;
      var y = event.y;
      if (x >= 0.325 * size && x <= 0.675 * size &&
          y >= 0.325 * size && y <= 0.625 * size) {
        setInteractive(!isInteractive());
      }
    }

    value = clamp(minValue, maxValue, value);

    // Initial paint
    onResize();

    return this;
  };

  var oneEightyGauge = function(parameters) {
    var doc                = document;
    var param              = parameters || {};
    var id                 = param.id || 'control';
    var parentId           = param.parentId || 'body';
    var width              = param.width || 270;
    var height             = param.height || 200;
    var scalable           = param.scalable === undefined ? false : param.scalable;
    var minValue           = param.minValue || 0;
    var maxValue           = param.maxValue || 100;
    var value              = param.value || minValue;
    var decimals           = clamp(0, 6, param.decimals) || 0;
    var animated           = param.animated === undefined ? false : param.animated;
    var duration           = clamp(0, 10, param.duration) || 3;
    var shadowEnabled      = param.shadowEnabled === undefined ? false : param.shadowEnabled;
    var title              = param.title || 'title';
    var unit               = param.unit || 'unit';
    var barColor           = param.barColor || 'rgb(50, 33, 201)';
    var barBackgroundColor = param.barBackgroundColor || 'rgb(239, 240, 240)';
    var titleColor         = param.titleColor || 'rgb(  0,   0,   0)';
    var valueColor         = param.valueColor || 'rgb(  0,   0,   0)';
    var unitColor          = param.unitColor || 'rgb(  0,   0,   0)';
    var minValueColor      = param.minValueColor || 'rgb(  0,   0,   0)';
    var maxValueColor      = param.maxValueColor || 'rgb(  0,   0,   0)';
    var dynamicBarColor    = param.dynamicBarColor === undefined ? false : param.dynamicBarColor;
    var stops              = param.stops || [ {} ];

    var currentValueAngle  = 0;

    var ASPECT_RATIO             = 0.74074;
    var ANGLE_RANGE              = Math.PI;
    var RANGE                    = maxValue - minValue;
    var ANGLE_STEP               = ANGLE_RANGE / RANGE;
    var START_ANGLE              = Math.PI;
    var STOP_ANGLE               = 0;
    var ROBOTO_THIN_FONT_NAME    = 'roboto-thin';
    var ROBOTO_REGULAR_FONT_NAME = 'roboto-regular';

    var gradientLookup = new enzo.GradientLookup(stops);

    var smallFont = Math.floor(0.12 * height) + 'px ' + ROBOTO_THIN_FONT_NAME;
    var bigFont   = Math.floor(0.24 * height) + 'px ' + ROBOTO_REGULAR_FONT_NAME;

    if (scalable) { window.addEventListener("resize", onResize, false); }

    // Create the <canvas> element
    var canvas = doc.createElement('canvas');
    canvas.id     = id;
    canvas.width  = width;
    canvas.height = height;
    parentId === 'body' ? doc.body.appendChild(canvas) : doc.getElementById(parentId).appendChild(canvas);

    // Get the <canvas> context and create all buffers
    var mainCtx          = doc.getElementById(id).getContext('2d');
    var backgroundBuffer = doc.createElement('canvas');
    var foregroundBuffer = doc.createElement('canvas');


    function onResize() {
      if (scalable) {
        width  = window.innerWidth;
        height = window.innerHeight;
      }

      if (ASPECT_RATIO * width > height) {
        width = 1 / (ASPECT_RATIO / height);
      } else if (1 / (ASPECT_RATIO / height) > width) {
        height = ASPECT_RATIO * width;
      }
      smallFont = Math.floor(0.12 * height) + 'px ' + ROBOTO_THIN_FONT_NAME;
      bigFont = Math.floor(0.24 * height) + 'px ' + ROBOTO_REGULAR_FONT_NAME;

      canvas.width  = width;
      canvas.height = height;

      backgroundBuffer.width  = width;
      backgroundBuffer.height = height;
      foregroundBuffer.width  = width;
      foregroundBuffer.height = height;

      mainCtx.canvas.width  = canvas.width;
      mainCtx.canvas.height = canvas.height;

      drawBackground();
      updateBar();

      repaint();
    }

    function repaint() {
      mainCtx.clearRect(0, 0, canvas.width, canvas.height);
      mainCtx.drawImage(backgroundBuffer, 0, 0);
      mainCtx.drawImage(foregroundBuffer, 0, 0);
    }

    function clamp(min, max, value) {
      if (value < min)
        return min;
      if (value > max)
        return max;
      return value;
    }

    var drawBackground = function() {
      var ctx = backgroundBuffer.getContext('2d');
      ctx.clearRect(0, 0, width, height);

      // barBackground
      ctx.beginPath();
      ctx.arc(0.5 * width, 0.675 * height, 0.48 * width, START_ANGLE, STOP_ANGLE, false);
      ctx.arc(0.5 * width, 0.675 * height, 0.25778 * width, STOP_ANGLE, START_ANGLE, true);
      ctx.closePath();
      ctx.fillStyle = barBackgroundColor;
      ctx.fill();

      // innerShadow
      if (shadowEnabled) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(0.5 * width, 0.675 * height, 0.48 * width, START_ANGLE, STOP_ANGLE, false);
        ctx.arc(0.5 * width, 0.675 * height, 0.25778 * width, STOP_ANGLE, START_ANGLE, true);
        ctx.closePath();
        ctx.clip();
        ctx.beginPath();
        ctx.strokeStyle   = barBackgroundColor;
        ctx.lineWidth     = 2;
        ctx.shadowBlur    = 30;
        ctx.shadowColor   = 'black';
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 10;
        ctx.arc(0.5 * width, 0.675 * height, 0.48 * width, START_ANGLE, STOP_ANGLE, false);
        ctx.arc(0.5 * width, 0.675 * height, 0.25778 * width, STOP_ANGLE, START_ANGLE, true);
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
      }

      // unit
      ctx.font      = smallFont;
      ctx.textAlign = 'center';
      ctx.fillStyle = unitColor;
      ctx.fillText(unit, 0.5 * width, 0.55 * height);

      // title
      ctx.fillStyle = titleColor;
      ctx.fillText(title, 0.5 * width, 0.92 * height);

      // minValue
      ctx.fillStyle = minValueColor;
      ctx.fillText((parseFloat(minValue).toFixed(decimals)), width * 0.13, height * 0.79, 0.22222 * width);

      // maxValue
      ctx.fillStyle = maxValueColor;
      ctx.fillText((parseFloat(maxValue).toFixed(decimals)), width * 0.87, height * 0.79, 0.22222 * width);
    };

    var updateBar = function() {
      var ctx = foregroundBuffer.getContext('2d');
      ctx.clearRect(0, 0, width, height);

      //bar
      currentValueAngle = ANGLE_STEP * (value - minValue) + START_ANGLE;
      ctx.beginPath();
      ctx.arc(0.5 * width, 0.675 * height, 0.481 * width, START_ANGLE, currentValueAngle, false);
      ctx.arc(0.5 * width, 0.675 * height, 0.25678 * width, currentValueAngle, START_ANGLE, true);
      ctx.closePath();
      ctx.fillStyle = dynamicBarColor ? gradientLookup.getColorAt(value / RANGE).getRgb() : barColor;
      ctx.fill();

      if (shadowEnabled) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(0.5 * width, 0.675 * height, 0.48 * width, START_ANGLE, currentValueAngle, false);
        ctx.arc(0.5 * width, 0.675 * height, 0.25778 * width, currentValueAngle, START_ANGLE, true);
        ctx.closePath();
        ctx.clip();
        ctx.beginPath();
        ctx.strokeStyle = dynamicBarColor ? gradientLookup.getColorAt(value / RANGE).getRgb() : barColor;
        ctx.lineWidth = 2;
        ctx.shadowBlur = 30;
        ctx.shadowColor = 'black';
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 10;
        ctx.arc(0.5 * width, 0.675 * height, 0.48 * width, START_ANGLE, currentValueAngle, false);
        ctx.arc(0.5 * width, 0.675 * height, 0.25778 * width, currentValueAngle, START_ANGLE, true);
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
      }

      //value
      ctx.textAlign = 'center';
      ctx.fillStyle = valueColor;
      ctx.font      = bigFont;
      ctx.fillText((parseFloat(value).toFixed(decimals)), width * 0.5, height * 0.79);
    };

    // Public methods
    this.getWidth = function() { return width; };
    this.setWidth = function(nWidth) {
      width = nWidth;
      onResize();
    };

    this.getHeight = function() { return height; };
    this.setHeight = function(nHeight) {
      height = nHeight;
      onResize();
    };

    this.isScalable = function() { return scalable; };
    this.setScalable = function(nScalable) {
      scalable = nScalable;
      window.addEventListener("resize", onResize, false);
    };

    this.getMinValue = function() { return minValue; };
    this.setMinValue = function(nMinValue) {
      minValue       = clamp(Nubmer.MIN_VALUE, maxValue, nMinValue);
      var RANGE      = maxValue - minValue;
      var ANGLE_STEP = ANGLE_RANGE / RANGE;
    };

    this.getMaxValue = function() { return maxValue; };
    this.setMaxValue = function(nMaxValue) {
      maxValue       = clamp(minValue, Number.MAX_VALUE, nMaxValue);
      var RANGE      = maxValue - minValue;
      var ANGLE_STEP = ANGLE_RANGE / RANGE;
    };

    this.getValue = function() { return value; };
    this.setValue = function(newValue) {
      var targetValue = clamp(minValue, maxValue, parseFloat(newValue));

      if (animated) {
        var tween = new Tween(new Object(), '', Tween.regularEaseInOut, value, targetValue, duration);
        tween.onMotionChanged = function(event) {
          value = event.target._pos;
          updateBar();
          repaint();
        };
        tween.start();
      } else {
        var oldValue = value;
        value = targetValue;
        if (value !== oldValue) {
          updateBar();
          repaint();
        }
      }
    };

    this.getDecimals = function() { return decimals; };
    this.setDecimals = function(nDecimals) {
      decimals = clamp(0, 6, nDecimals);
      onResize();
    };

    this.isAnimated = function() { return animated; };
    this.setAnimated = function(nAnimated) {
      animated = nAnimated;
    };

    this.getDuration = function() { return duration; };
    this.setDuration = function(nDuration) {
      duration = clamp(0, 10, nDuration);
    };

    this.isShadowEnabled = function() { return shadowEnabled; };
    this.setShadowEnabled = function(nShadowEnabled) {
      shadowEnabled = nShadowEnabled;
      onResize();
    };

    this.getTitle = function() { return title; };
    this.setTitle = function(newTitle) {
      title = newTitle;
      drawForeground();
      repaint();
    };

    this.getUnit = function() { return unit; };
    this.setUnit = function(nUnit) {
      unit = nUnit;
      onResize();
    };

    this.getBarColor = function() { return barColor; };
    this.setBarColor = function(nBarColor) {
      barColor = nBarColor;
      onResize();
    };

    this.getBarBackgroundColor = function() { return barBackgroundColor; };
    this.setBarBackgroundColor = function(nBarBackgroundColor) {
      barBackgroundColor = nBarBackgroundColor;
      onResize();
    };

    this.getTitleColor = function() { return titleColor; };
    this.setTitleColor = function(nTitleColor) {
      titleColor = nTitleColor;
      onResize();
    };

    this.getValueColor = function() { return valueColor; };
    this.setValueColor = function(nValueColor) {
      valueColor = nValueColor;
      onResize();
    };

    this.getUnitColor = function() { return unitColor; };
    this.setUnitColor = function(nUnitColor) {
      unitColor = nUnitColor;
      onResize();
    };

    this.getMinValueColor = function() { return minValueColor; };
    this.setMinValueColor = function(nMinValueColor) {
      minValueColor = nMinValueColor;
      onResize();
    };

    this.getMaxValueColor = function() { return maxValueColor; };
    this.setMaxValueColor = function(nMaxValueColor) {
      maxValueColor = nMaxValueColor;
      onResize();
    };

    this.getDynamicBarColor = function() { return dynamicBarColor; };
    this.setDynamicBarColor = function(nDynamicBarColor) {
      dynamicBarColor = nDynamicBarColor;
      onResize();
    };

    this.getStops = function() { return stops; };
    this.setStops = function(nStops) {
      stops = nStops;
      onResize();
    };

    this.setSize = function(newWidth, newHeight) {
      width = newWidth;
      height = newHeight;
      onResize();
    };

    // Initial paint
    onResize();

    return this;
  };

  var avGauge = function(parameters) {
    var doc             = document;
    var param           = parameters || {};
    var id              = param.id || 'control';
    var parentId        = param.parentId || 'body';
    var size            = param.size || 200;
    var scalable        = param.scalable === undefined ? false : param.scalable;
    var minValue        = param.minValue || 0;
    var maxValue        = param.maxValue || 100;
    var outerValue      = param.outerValue || minValue;
    var innerValue      = param.innerValue || minValue;
    var decimals        = clamp(0, 6, param.decimals) || 0;
    var animated        = param.animated === undefined ? false : param.animated;
    var duration        = clamp(0, 10, param.duration) || 3;
    var title           = param.title || 'title';
    var outerBarColor   = param.outerBarColor || 'rgb(50, 33, 201)';
    var innerBarColor   = param.innerBarColor || 'rgb(50, 33, 201)';
    var backgroundColor = param.backgroundColor || 'rgba(65, 65, 65, 0.7)';
    var barBorderColor  = param.barBorderColor || 'rgba(65, 65, 65, 0.7)';
    var titleColor      = param.titleColor || 'rgb(255, 255, 255)';
    var outerValueColor = param.outerValueColor || 'rgb(255, 255, 255)';
    var innerValueColor = param.innerValueColor || 'rgb(255, 255, 255)';
    var dynamicBarColor = param.dynamicBarColor === undefined ? false : param.dynamicBarColor;
    var outerStops      = param.outerStops || [ {} ];
    var innerStops      = param.innerStops || [ {} ];

    var currentOuterValueAngle = 0;
    var currentInnerValueAngle = 0;

    var ANGLE_RANGE          = 2 * Math.PI;
    var RANGE                = maxValue - minValue;
    var ANGLE_STEP           = ANGLE_RANGE / RANGE;
    var START_ANGLE          = -Math.PI / 2;
    var STOP_ANGLE           = START_ANGLE + ANGLE_RANGE;
    var LATO_LIGHT_FONT_NAME = 'latolight';

    var outerGradientLookup = new enzo.GradientLookup(outerStops);
    var innerGradientLookup = new enzo.GradientLookup(innerStops);

    var smallFont = Math.floor(0.08 * size) + 'px ' + LATO_LIGHT_FONT_NAME;
    var bigFont   = Math.floor(0.2 * size) + 'px ' + LATO_LIGHT_FONT_NAME;

    if (scalable) { window.addEventListener("resize", onResize, false); }

    // Create the <canvas> element
    var canvas = doc.createElement('canvas');
    canvas.id     = id;
    canvas.width  = size;
    canvas.height = size;
    parentId === 'body' ? doc.body.appendChild(canvas) : doc.getElementById(parentId).appendChild(canvas);

    // Get the <canvas> context and create all buffers
    var mainCtx = doc.getElementById(id).getContext('2d');
    var backgroundBuffer = doc.createElement('canvas');
    var outerBarBuffer   = doc.createElement('canvas');
    var innerBarBuffer   = doc.createElement('canvas');


    function onResize() {
      if (scalable) { size = window.innerWidth < window.innerHeight ? window.innerWidth : window.innerHeight; }

      smallFont = Math.floor(0.08 * size) + 'px ' + LATO_LIGHT_FONT_NAME;
      bigFont   = Math.floor(0.2 * size) + 'px ' + LATO_LIGHT_FONT_NAME;

      canvas.width  = size;
      canvas.height = size;

      backgroundBuffer.width  = size;
      backgroundBuffer.height = size;
      outerBarBuffer.width    = size;
      outerBarBuffer.height   = size;
      innerBarBuffer.width    = size;
      innerBarBuffer.height   = size;

      mainCtx.canvas.width  = canvas.width;
      mainCtx.canvas.height = canvas.height;

      drawBackground();
      updateOuterBar();
      updateInnerBar();
      repaint();
    }

    function repaint() {
      mainCtx.clearRect(0, 0, canvas.width, canvas.height);
      mainCtx.drawImage(backgroundBuffer, 0, 0);
      mainCtx.drawImage(outerBarBuffer, 0, 0);
      mainCtx.drawImage(innerBarBuffer, 0, 0);
    }

    function clamp(min, max, value) {
      if (value < min)
        return min;
      if (value > max)
        return max;
      return value;
    }

    var drawBackground = function() {
      var ctx = backgroundBuffer.getContext('2d');
      ctx.clearRect(0, 0, size, size);

      // barBackground
      ctx.beginPath();
      ctx.arc(0.5 * size, 0.5 * size, 0.48 * size, START_ANGLE, STOP_ANGLE, false);
      ctx.arc(0.5 * size, 0.5 * size, 0.28 * size, STOP_ANGLE, START_ANGLE, true);
      ctx.closePath();
      ctx.strokeStyle = barBorderColor;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0.5 * size, 0.5 * size, 0.28 * size, START_ANGLE, STOP_ANGLE, false);
      ctx.closePath();
      ctx.fillStyle = backgroundColor;
      ctx.fill();

      // title
      ctx.font = smallFont;
      ctx.textAlign = 'center';
      ctx.fillStyle = titleColor;
      ctx.fillText(title, 0.5 * size, 0.62 * size);
    };

    var updateOuterBar = function() {
      var ctx = outerBarBuffer.getContext('2d');
      ctx.clearRect(0, 0, size, size);

      //bar
      currentOuterValueAngle = ANGLE_STEP * (outerValue - minValue) + START_ANGLE;
      ctx.beginPath();
      ctx.arc(0.5 * size, 0.5 * size, 0.48 * size, START_ANGLE, currentOuterValueAngle, false);
      ctx.arc(0.5 * size, 0.5 * size, 0.38 * size, currentOuterValueAngle, START_ANGLE, true);
      ctx.closePath();
      ctx.fillStyle = dynamicBarColor ? outerGradientLookup.getColorAt(outerValue / RANGE).getRgb() : outerBarColor;
      ctx.fill();

      //outerValue
      ctx.textAlign = 'center';
      ctx.fillStyle = outerValueColor;
      ctx.font = bigFont;
      ctx.fillText((parseFloat(outerValue).toFixed(decimals)), size * 0.5, size * 0.48);
    };

    var updateInnerBar = function() {
      var ctx = innerBarBuffer.getContext('2d');
      ctx.clearRect(0, 0, size, size);

      //bar
      currentInnerValueAngle = ANGLE_STEP * (innerValue - minValue) + START_ANGLE;
      ctx.beginPath();
      ctx.arc(0.5 * size, 0.5 * size, 0.381 * size, START_ANGLE, currentInnerValueAngle, false);
      ctx.arc(0.5 * size, 0.5 * size, 0.28 * size, currentInnerValueAngle, START_ANGLE, true);
      ctx.closePath();
      ctx.fillStyle = dynamicBarColor ? innerGradientLookup.getColorAt(innerValue / RANGE).getRgb() : innerBarColor;
      ctx.fill();

      //innerValue
      ctx.textAlign = 'center';
      ctx.fillStyle = innerValueColor;
      ctx.font = smallFont;
      ctx.fillText((parseFloat(innerValue).toFixed(decimals)), size * 0.5, size * 0.72);
    };


    // Public methods
    this.getSize = function() { return size; };
    this.setSize = function(nSize) {
      width  = nSize;
      height = nSize;
      onResize();
    };

    this.isScalable = function() { return scalable; };
    this.setScalable = function(nScalable) {
      scalable = nScalable;
      if (scalable) { window.addEventListener("resize", onResize, false); }
    };

    this.getMinValue = function() { return minValue; };
    this.setMinValue = function(nMinValue) {
      minValue = clamp(Number.MIN_VALUE, maxValue, nMinValue);
      var RANGE      = maxValue - minValue;
      ANGLE_STEP = ANGLE_RANGE / RANGE;
      onResize();
    };

    this.getMaxValue = function() { return maxValue; };
    this.setMaxValue = function(nMaxValue) {
      maxValue = clamp(minValue, Number.MAX_VALUE, nMaxValue);
      var RANGE      = maxValue - minValue;
      ANGLE_STEP = ANGLE_RANGE / RANGE;
      onResize();
    };

    this.getOuterValue = function() { return outerValue; };
    this.setOuterValue = function(newValue) {
      var targetValue = clamp(minValue, maxValue, parseFloat(newValue));

      if (animated) {
        var tween = new Tween(new Object(), '', Tween.regularEaseInOut, outerValue, targetValue, duration);
        tween.onMotionChanged = function(event) {
          outerValue = event.target._pos;
          updateOuterBar();
          repaint();
        };
        tween.start();
      } else {
        var oldOuterValue = outerValue;
        outerValue = targetValue;
        if (outerValue !== oldOuterValue) {
          updateOuterBar();
          repaint();
        }
      }
    };

    this.getInnerValue = function() { return innerValue; };
    this.setInnerValue = function(newValue) {
      var targetValue = clamp(minValue, maxValue, parseFloat(newValue));

      if (animated) {
        var tween = new Tween(new Object(), '', Tween.regularEaseInOut, innerValue, targetValue, duration);
        tween.onMotionChanged = function(event) {
          innerValue = event.target._pos;
          updateInnerBar();
          repaint();
        };
        tween.start();
      } else {
        var oldInnerValue = innerValue;
        innerValue = targetValue;
        if (innerValue !== oldInnerValue) {
          updateInnerBar();
          repaint();
        }
      }
    };

    this.getDecimals = function() { return decimals; };
    this.setDecimals = function(nDecimals) {
      decimals = clamp(0, 6, nDecimals);
      onResize();
    };

    this.isAnimated = function() { return animated; };
    this.setAnimated = function(nAnimated) {
      animated = nAnimated;
    };

    this.getDuration = function() { return duration; };
    this.setDuration = function(nDuration) {
      duration = clamp(0, 10, nDuration);
    };

    this.getTitle = function() { return title; };
    this.setTitle = function(newTitle) {
      title = newTitle;
      drawBackground();
      repaint();
    };

    this.getOuterBarColor = function() { return outerBarColor; };
    this.setOuterBarColor = function(nOuterBarColor) {
      outerBarColor = nOuterBarColor;
      onResize();
    };

    this.getInnerBarColor = function() { return innerBarColor; };
    this.setInnerBarColor = function(nInnerBarColor) {
      innerBarColor = nInnerBarColor;
      onResize();
    };

    this.getBackgroundColor = function() { return backgroundColor; };
    this.setBackgroundColor = function(nBackgroundColor) {
      backgroundColor = nBackgroundColor;
      onResize();
    };

    this.getBarBorderColor = function() { return barBorderColor; };
    this.setBarBorderColor = function(nBarBorderColor) {
      barBorderColor = nBarBorderColor;
      onResize();
    };

    this.getTitleColor = function() { return titleColor; };
    this.setTitleColor = function(nTitleColor) {
      titleColor = nTitleColor;
      onResize();
    };

    this.getOuterValueColor = function() { return outerValueColor; };
    this.setOuterValueColor = function(nOuterValueColor) {
      outerValueColor = nOuterValueColor;
      onResize();
    };

    this.getInnerValueColor = function() { return innerValueColor; };
    this.setInnerValueColor = function(nInnerValueColor) {
      innerValueColor = nInnerValueColor;
      onResize();
    };

    this.isDynamicBarColor = function() { return dynamicBarColor; };
    this.setDynamicBarColor = function(nDynamicBarColor) {
      dynamicBarColor = nDynamicBarColor;
    };

    this.getOuterStops = function() { return outerStops; };
    this.setOuterStops = function(nOuterStops) {
      outerStops = nOuterStops;
      onResize();
    }

    this.getInnerStops = function() { return innerStops; };
    this.setInnerStops = function(nInnerStops) {
      innerStops = nInnerStops;
      onResize();
    };

    // Initial paint
    onResize();

    return this;
  };

  var flatGauge = function(parameters) {
    var doc              = document;
    var param            = parameters || {};
    var id               = param.id || 'control';
    var parentId         = param.parentId || 'body';
    var size             = param.size || 200;
    var scalable         = param.scalable === undefined ? false : param.scalable;
    var minValue         = param.minValue || 0;
    var maxValue         = param.maxValue || 100;
    var value            = param.value || minValue;
    var unit             = param.unit || '';
    var decimals         = clamp(0, 6, param.decimals) || 0;
    var animated         = param.animated === undefined ? false : param.animated;
    var duration         = clamp(0, 10, param.duration) || 3;
    var title            = param.title || '';
    var barColor         = param.barColor || '#00ffff';
    var backgroundColor  = param.backgroundColor || '#ffffff';
    var titleColor       = param.titleColor || '#333333';
    var valueColor       = param.valueColor || '#333333';
    var unitColor        = param.unitColor || '#333333';
    var dynamicBarColor  = param.dynamicBarColor === undefined ? false : param.dynamicBarColor;
    var stops            = param.stops || [ {} ];
    var separatorColor   = param.separatorColor === undefined ? '#d0d0d0' : param.separatorColor;
    var separatorVisible = param.separatorVisible === undefined ? true : param.separatorVisible;
    var colorRingVisible = param.colorRingVisible === undefined ? true : param.colorRingVisible;


    var currentValueAngle = 0;

    var ANGLE_RANGE              = 2 * Math.PI;
    var RANGE                    = maxValue - minValue;
    var ANGLE_STEP               = ANGLE_RANGE / RANGE;
    var START_ANGLE              = -Math.PI / 2;
    var STOP_ANGLE               = START_ANGLE + ANGLE_RANGE;
    var ROBOTO_LIGHT_FONT_NAME   = 'roboto-light';
    var ROBOTO_REGULAR_FONT_NAME = 'roboto-regular';

    var gradientLookup           = new enzo.GradientLookup(stops);

    var smallFont = Math.floor(0.08 * size) + 'px ' + ROBOTO_LIGHT_FONT_NAME;
    var bigFont   = Math.floor(0.2 * size) + 'px ' + ROBOTO_REGULAR_FONT_NAME;

    if (scalable) { window.addEventListener("resize", onResize, false); }

    // Create the <canvas> element
    var canvas = doc.createElement('canvas');
    canvas.id     = id;
    canvas.width  = size;
    canvas.height = size;
    parentId === 'body' ? doc.body.appendChild(canvas) : doc.getElementById(parentId).appendChild(canvas);

    // Get the <canvas> context and create all buffers
    var mainCtx = doc.getElementById(id).getContext('2d');
    var backgroundBuffer = doc.createElement('canvas');
    var barBuffer        = doc.createElement('canvas');

    function onResize() {
      if (scalable) { size = window.innerWidth < window.innerHeight ? window.innerWidth : window.innerHeight; }

      smallFont = Math.floor(0.08 * size) + 'px ' + ROBOTO_LIGHT_FONT_NAME;
      bigFont   = Math.floor(0.3 * size) + 'px ' + ROBOTO_REGULAR_FONT_NAME;

      canvas.width  = size;
      canvas.height = size;

      backgroundBuffer.width  = size;
      backgroundBuffer.height = size;
      barBuffer.width         = size;
      barBuffer.height        = size;

      mainCtx.canvas.width    = canvas.width;
      mainCtx.canvas.height   = canvas.height;

      drawBackground();
      updateBar();
      repaint();
    }

    function repaint() {
      mainCtx.clearRect(0, 0, canvas.width, canvas.height);
      mainCtx.drawImage(backgroundBuffer, 0, 0);
      mainCtx.drawImage(barBuffer, 0, 0);
    }

    function clamp(min, max, value) {
      if (value < min)
        return min;
      if (value > max)
        return max;
      return value;
    }

    var drawBackground = function() {
      var ctx = backgroundBuffer.getContext('2d');
      ctx.clearRect(0, 0, size, size);

      // color ring
      if (colorRingVisible) {
        ctx.beginPath();
        ctx.arc(0.5 * size, 0.5 * size, 0.496 * size, START_ANGLE, STOP_ANGLE, false);
        ctx.closePath();
        ctx.lineWidth = size * 0.0075;
        ctx.strokeStyle = barColor;
        ctx.stroke();
      }

      // separator
      if (separatorVisible) {
        ctx.beginPath();
        ctx.moveTo(0.5 * size, 0.02 * size);
        ctx.lineTo(0.5 * size, 0.138 * size);
        ctx.closePath();
        ctx.lineWidth = 0.5;
        ctx.strokeStyle = separatorColor;
        ctx.stroke();
      }

      // barBackground
      ctx.beginPath();
      ctx.arc(0.5 * size, 0.5 * size, 0.363 * size, START_ANGLE, STOP_ANGLE, false);
      ctx.closePath();
      ctx.fillStyle = backgroundColor;
      ctx.fill();

      // title
      ctx.font      = smallFont;
      ctx.textAlign = 'center';
      ctx.fillStyle = titleColor;
      ctx.fillText(title, 0.5 * size, 0.315 * size);

      // unit
      ctx.font      = smallFont;
      ctx.textAlign = 'center';
      ctx.fillStyle = unitColor;
      ctx.fillText(unit, 0.5 * size, 0.75 * size);
    };

    var updateBar = function() {
      var ctx = barBuffer.getContext('2d');
      ctx.clearRect(0, 0, size, size);

      //bar
      currentValueAngle = ANGLE_STEP * (value - minValue) + START_ANGLE;
      ctx.beginPath();
      ctx.arc(0.5 * size, 0.5 * size, 0.421 * size, START_ANGLE, currentValueAngle, false);
      ctx.lineWidth = size * 0.12;
      ctx.strokeStyle = dynamicBarColor ? gradientLookup.getColorAt(value / RANGE).getRgb() : barColor;
      ctx.stroke();

      //value
      ctx.textAlign    = 'center';
      ctx.fillStyle    = valueColor;
      ctx.font         = bigFont;
      ctx.textBaseLine = 'middle';
      ctx.fillText((parseFloat(value).toFixed(decimals)), size * 0.5, size * 0.6);
    };


    // Public methods
    this.getSize = function() { return size; };
    this.setSize = function(nSize) {
      width  = nSize;
      height = nSize;
      onResize();
    };

    this.isScalable = function() { return scalable; };
    this.setScalable = function(nScalable) {
      scalable = nScalable;
      if (scalable) { window.addEventListener("resize", onResize, false); }
    };

    this.getMinValue = function() { return minValue; };
    this.setMinValue = function(nMinValue) {
      minValue = clamp(Number.MIN_VALUE, maxValue, nMinValue);
      var RANGE      = maxValue - minValue;
      ANGLE_STEP = ANGLE_RANGE / RANGE;
      onResize();
    };

    this.getMaxValue = function() { return maxValue; };
    this.setMaxValue = function(nMaxValue) {
      maxValue = clamp(minValue, Number.MAX_VALUE, nMaxValue);
      var RANGE      = maxValue - minValue;
      ANGLE_STEP = ANGLE_RANGE / RANGE;
      onResize();
    };

    this.getValue = function() { return value; };
    this.setValue = function(newValue) {
      var targetValue = clamp(minValue, maxValue, parseFloat(newValue));

      if (animated) {
        var tween = new Tween(new Object(), '', Tween.regularEaseInOut, value, targetValue, duration);
        tween.onMotionChanged = function(event) {
          value = event.target._pos;
          updateBar();
          repaint();
        };
        tween.start();
      } else {
        var oldValue = value;
        value = targetValue;
        if (value !== oldValue) {
          updateBar();
          repaint();
        }
      }
    };

    this.getDecimals = function() { return decimals; };
    this.setDecimals = function(nDecimals) {
      decimals = clamp(0, 6, nDecimals);
      onResize();
    };

    this.isAnimated = function() { return animated; };
    this.setAnimated = function(nAnimated) {
      animated = nAnimated;
    };

    this.getDuration = function() { return duration; };
    this.setDuration = function(nDuration) {
      duration = clamp(0, 10, nDuration);
    };

    this.getTitle = function() { return title; };
    this.setTitle = function(nTitle) {
      title = nTitle;
      drawBackground();
      repaint();
    };

    this.getUnit = function() { return unit; };
    this.setUnit = function(nUnit) {
      unit = nUnit;
      drawBackground();
      repaint();
    };

    this.getBarColor = function() { return barColor; };
    this.setBarColor = function(nBarColor) {
      barColor = nBarColor;
      onResize();
    };

    this.getBackgroundColor = function() { return backgroundColor; };
    this.setBackgroundColor = function(nBackgroundColor) {
      backgroundColor = nBackgroundColor;
      onResize();
    };

    this.getTitleColor = function() { return titleColor; };
    this.setTitleColor = function(nTitleColor) {
      titleColor = nTitleColor;
      onResize();
    };

    this.getValueColor = function() { return valueColor; };
    this.setValueColor = function(nValueColor) {
      valueColor = nValueColor;
      onResize();
    };

    this.getUnitColor = function() { return unitColor; };
    this.setUnitColor = function(nUnitColor) {
      unitColor = nUnitColor;
      onResize();
    };

    this.isDynamicBarColor = function() { return dynamicBarColor; };
    this.setDynamicBarColor = function(nDynamicBarColor) {
      dynamicBarColor = nDynamicBarColor;
    };

    this.getStops = function() { return stops; };
    this.setStops = function(nStops) {
      stops = nStops;
      onResize();
    };

    // Initial paint
    onResize();

    return this;
  };

  var simpleGauge = function(parameters) {
    var doc                = document;
    var param              = parameters || {};
    var id                 = param.id || 'control';
    var parentId           = param.parentId || 'body';
    var size               = param.size || 100;
    var scalable           = param.scalable === undefined ? false : param.scalable;
    var decimals           = clamp(0, 6, param.decimals) || 0;
    var animated           = param.animated === undefined ? false : param.animated;
    var duration           = clamp(0, 10, param.duration) || 3;
    var title              = param.title || 'title';
    var unit               = param.unit || '';
    var minValue           = param.minValue || 0;
    var maxValue           = param.maxValue || 100;
    var value              = param.value || minValue;
    var sections           = param.sections || {};
    var sectionIconVisible = param.sectionIconVisible || false;
    var needleColor        = param.needleColor || 'rgb(90, 97, 95)';

    var ANGLE_RANGE = 270;
    var RANGE       = maxValue - minValue;
    var ANGLE_STEP  = ANGLE_RANGE / RANGE;
    var START_ANGLE = 135 * Math.PI / 180;
    var ROBOTO_REGULAR_FONT_NAME = 'roboto-regular';

    var bigFont   = Math.floor(0.145 * size) + 'px ' + ROBOTO_REGULAR_FONT_NAME;
    var smallFont = Math.floor(0.045 * size) + 'px ' + ROBOTO_REGULAR_FONT_NAME;

    value = value < minValue ? minValue : value;

    if (scalable) { window.addEventListener("resize", onResize, false); }

    // Create the <canvas> element
    var canvas = doc.createElement('canvas');
    canvas.id     = id;
    canvas.width  = size;
    canvas.height = size;
    parentId === 'body' ? doc.body.appendChild(canvas) : doc.getElementById(parentId).appendChild(canvas);

    // Get the <canvas> context and create all buffers
    var mainCtx = doc.getElementById(id).getContext('2d');
    var backgroundBuffer = doc.createElement('canvas');
    var foregroundBuffer = doc.createElement('canvas');


    function onResize() {
      if (scalable) {
        size = window.innerWidth < window.innerHeight ? window.innerWidth : window.innerHeight;
      }

      canvas.width = size;
      canvas.height = size;

      backgroundBuffer.width = size;
      backgroundBuffer.height = size;
      foregroundBuffer.width = size;
      foregroundBuffer.height = size;

      mainCtx.canvas.width = canvas.width;
      mainCtx.canvas.height = canvas.height;

      bigFont = Math.floor(0.145 * size) + 'px ' + ROBOTO_REGULAR_FONT_NAME;
      smallFont = Math.floor(0.045 * size) + 'px ' + ROBOTO_REGULAR_FONT_NAME;

      drawBackground();
      drawForeground();

      repaint();
    }

    function repaint() {
      mainCtx.clearRect(0, 0, canvas.width, canvas.height);
      mainCtx.drawImage(backgroundBuffer, 0, 0);
      mainCtx.drawImage(foregroundBuffer, 0, 0);
    }

    function clamp(min, max, value) {
      if (value < min)
        return min;
      if (value > max)
        return max;
      return value;
    }

    var drawBackground = function() {
      var ctx = backgroundBuffer.getContext('2d');
      ctx.clearRect(0, 0, size, size);

      //sections
      ctx.save();
      ctx.translate(0.5 * size, 0.5 * size);
      ctx.rotate(START_ANGLE);
      ctx.translate(-0.5 * size, -0.5 * size);
      var length = sections.length;
      if (null !== sections && 0 < length) {
        for (var i = 0; i < length; i++) {
          drawSection(ctx, size, sections[i].start, sections[i].stop, sections[i].color, true);
          if (sectionIconVisible) drawSectionIcon(ctx, size, sections[i].start, sections[i].stop, sections[i].image);
        }
      }
      drawSection(ctx, size, minValue, maxValue, 'white', false);
      ctx.restore();
    };

    var drawSection = function(ctx, size, start, stop, color, fill) {
      start = start < minValue ? minValue : start > maxValue ? maxValue : start;
      stop  = stop < minValue ? minValue : stop > maxValue ? maxValue : stop;
      var angleStep = ANGLE_RANGE / RANGE;
      var sectionStartAngle = ((angleStep * start - angleStep * minValue)) * Math.PI / 180;
      var sectionStopAngle = sectionStartAngle + (stop - start) / (RANGE / ANGLE_RANGE) * Math.PI / 180;

      ctx.translate(0.5 * size, 0.5 * size);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0.0, 0.0, 0.49 * size, sectionStartAngle, sectionStopAngle, false);
      if (fill) ctx.moveTo(0, 0);
      ctx.translate(-0.5 * size, -0.5 * size);
      ctx.closePath();
      if (fill) {
        ctx.fillStyle = color;
        ctx.fill();
      } else {
        ctx.strokeStyle = color;
        ctx.lineWidth   = 0.02 * size;
        ctx.stroke();
      }
    };

    var drawSectionIcon = function(ctx, size, start, stop, icon) {
      start = start < minValue ? minValue : start > maxValue ? maxValue : start;
      stop  = stop < minValue ? minValue : stop > maxValue ? maxValue : stop;

      var angleStep = ANGLE_RANGE / RANGE;
      var sectionStartAngle = START_ANGLE + (start - minValue) * angleStep;
      var sectionStopAngle  = (stop - start) * angleStep;

      var sinValue  = Math.sin(START_ANGLE + Math.radians(180 - sectionStartAngle - sectionStopAngle * 0.5 + 0.015 * size));
      var cosValue  = Math.cos(START_ANGLE + Math.radians(180 - sectionStartAngle - sectionStopAngle * 0.5 + 0.015 * size));
      var iconPoint = new Array((size * 0.5 + size * 0.365 * sinValue), (size * 0.5 + size * 0.365 * cosValue));

      var img = new Image();
      img.src = icon;
      img.onload = function() {
        ctx.drawImage(img, iconPoint[0] - size * 0.06, iconPoint[1] - size * 0.06, size * 0.12, size * 0.12);
      }
    };

    var drawForeground = function() {
      var ctx = foregroundBuffer.getContext('2d');
      ctx.clearRect(0, 0, size, size);

      //needle
      ctx.save();
      ctx.translate(0.5 * size, 0.5 * size);
      ctx.rotate((((ANGLE_STEP * (value - minValue)) - 135)) * Math.PI / 180);
      ctx.translate(-0.5 * size, -0.5 * size);

      ctx.beginPath();
      ctx.moveTo(0.275 * size, 0.5 * size);
      ctx.bezierCurveTo(0.275 * size, 0.62426575 * size, 0.37573425 * size, 0.725 * size, 0.5 * size, 0.725 * size);
      ctx.bezierCurveTo(0.62426575 * size, 0.725 * size, 0.725 * size, 0.62426575 * size, 0.725 * size, 0.5 * size);
      ctx.bezierCurveTo(0.725 * size, 0.3891265 * size, 0.6448105 * size, 0.296985 * size, 0.5392625 * size, 0.2784125 * size);
      ctx.lineTo(0.5 * size, size * 0.012);
      ctx.lineTo(0.4607375 * size, 0.2784125 * size);
      ctx.bezierCurveTo(0.3551895 * size, 0.296985 * size, 0.275 * size, 0.3891265 * size, 0.275 * size, 0.5 * size);
      ctx.closePath();
      ctx.fillStyle = needleColor;
      ctx.fill();

      ctx.strokeStyle = 'white';
      ctx.lineJoin = 'bevel';
      ctx.lineCap = 'round';
      ctx.lineWidth = (size * 0.03).toFixed(0);
      ctx.stroke();
      ctx.restore();

      //value
      ctx.textAlign = 'center';
      ctx.fillStyle = 'white';
      ctx.font      = bigFont;
      var fontSize  = Math.floor(0.145 * size);
      var valueText = (parseFloat(value).toFixed(decimals) + unit);
      var metrics   = ctx.measureText(valueText);
      var textWidth = metrics.width;
      if (textWidth > 0.395 * size) {
        var decrement = 0;
        while (textWidth > 0.395 * size && fontSize > 0) {
          fontSize  = size * (0.145 - decrement);
          ctx.font  = Math.floor(fontSize) + 'px ' + ROBOTO_REGULAR_FONT_NAME;
          metrics   = ctx.measureText(valueText);
          textWidth = metrics.width;
          decrement += 0.01;
        }
      }
      ctx.fillText((parseFloat(value).toFixed(decimals) + unit), size * 0.5, title.length > 0 ? size * 0.54 : size * 0.52);

      //title
      if (title.length > 0) {
        ctx.font = smallFont;
        fontSize  = Math.floor(0.045 * size);
        metrics   = ctx.measureText(title);
        textWidth = metrics.width;
        if (textWidth > 0.395 * size) {
          var decrement = 0;
          while (textWidth > 0.395 * size && fontSize > 0) {
            fontSize  = size * (0.145 - decrement);
            ctx.font  = Math.floor(fontSize) + 'px ' + ROBOTO_REGULAR_FONT_NAME;
            metrics   = ctx.measureText(title);
            textWidth = metrics.width;
            decrement += 0.01;
          }
        }
        ctx.fillText(title, size * 0.5, size * 0.62);
      }
    };

    // Public methods
    this.getSize = function() {
      return size;
        };
    this.setSize = function(nSize) {
      size = nSize;
      onResize();
    };

    this.isScalable = function() { return scalable; };
    this.setScalable = function(nScalable) {
        scalable = nScalable;
        if (scalable) { window.addEventListener("resize", onResize, false); }
    };

    this.getDecimals = function() { return decimals; };
    this.setDecimals = function(nDecimals) {
        decimals = clamp(0, 6, nDecimals);
          drawForeground();
          repaint();
    };

    this.isAnimated = function() {
      return animated;
    };
    this.setAnimated = function(nAnimated) {
      animated = nAnimated;
    };

    this.getDuration = function() {
      return duration;
    };
    this.setDuration = function(nDuration) {
      duration = clamp(0, 10, nDuration);
    };

    this.getTitle = function() {
      return title;
    };
    this.setTitle = function(nTitle) {
      title = nTitle;
      drawForeground();
      repaint();
    };

    this.getUnit = function() {
      return unit;
    };
    this.setUnit = function(nUnit) {
      unit = nUnit;
      drawForeground();
      repaint();
    };

    this.getMinValue = function() { return minValue; };
    this.setMinValue = function(nMinValue) {
      minValue    = clamp(Number.MIN_VALUE, maxValue, nMinValue);
      RANGE       = maxValue - minValue;
      ANGLE_STEP  = ANGLE_RANGE / RANGE;
      drawBackground();
      drawForeground();
      repaint();
    };

    this.getMaxValue = function() { return maxValue; };
    this.setMaxValue = function(nMaxValue) {
      maxValue    = clamp(minValue, Number.MAX_VALUE, nMaxValue);
      RANGE       = maxValue - minValue;
      ANGLE_STEP  = ANGLE_RANGE / RANGE;
      drawBackground();
      drawForeground();
      repaint();
    };

    this.getValue = function() { return value; };
    this.setValue = function(nValue) {
      var newValue = parseFloat(nValue);
      if (animated) {
        var targetValue = newValue < minValue ? minValue : (newValue > maxValue ? maxValue : newValue);
        var tween = new Tween(new Object(), '', Tween.regularEaseInOut, value, targetValue, duration);
        tween.onMotionChanged = function(event) {
          value = event.target._pos;
          drawForeground();
          repaint();
        };
        tween.start();
      } else {
        var oldValue = value;
        value = newValue < minValue ? minValue : (newValue > maxValue ? maxValue : newValue);
        if (value !== oldValue) {
          drawForeground();
          repaint();
    }
    }
    };

    this.getSections = function() { return sections; };
    this.setSections = function(nSections) {
        sections = nSections;
        drawBackground();
        drawForeground();
        repaint();
    };

    this.isSectionIconVisible = function() { return sectionIconVisible; };
    this.setSectionIconVisible = function(nSectionIconVisible) {
        sectionIconVisible = nSectionIconVisible;
        drawBackground();
        repaint();
    };

    this.getNeedleColor = function() { return needleColor; };
    this.setNeedleColor = function(nNeedleColor) {
        needleColor = nNeedleColor;
        drawForeground();
        repaint();
    };

    // Initial paint
    onResize();

    return this;
  };

  var lcd = function(parameters) {
    var doc = document;
    var param                   = parameters || {};
    var id                      = param.id || 'control';
    var parentId                = param.parentId || 'body';
    var upperCenterText         = param.upperCenterText || '';
    var upperCenterTextVisible  = param.upperCenterTextVisible === undefined ? false : param.upperCenterTextVisible;
    var unit                    = param.unitString || '';
    var unitVisible             = param.unitVisible === undefined ? false : param.unitVisible;
    var lowerRightText          = param.lowerRightText || '';
    var lowerRightTextVisible   = param.lowerRightTextVisible === undefined ? false : param.lowerRightTextVisible;
    var minValue                = param.minValue || 0;
    var maxValue                = param.maxValue || 100;
    var value                   = param.value || minValue;
    var decimals                = param.decimals || 2;
    var threshold               = param.threshold || 100;
    var thresholdVisible        = param.thresholdVisible === undefined ? false : param.thresholdVisible;
    var upperLeftText           = param.upperLeftText || 0;
    var upperLeftTextVisible    = param.upperLeftTextVisible === undefined ? false : param.upperLeftTextVisible;
    var upperRightText          = param.upperRightText || 0;
    var upperRightTextVisible   = param.upperRightTextVisible === undefined ? false : param.upperRightTextVisible;
    var lowerCenterText         = param.lowerCenterText == undefined ? '' : param.lowerCenterText;
    var lowerCenterTextVisible  = param.lowerCenterTextVisible === undefined ? false : param.lowerCenterTextVisible;
    var formerValueVisible      = param.formerValueVisible === undefined ? false : param.formerValueVisible;
    var battery                 = param.battery || '';
    var batteryVisible          = param.batteryVisible === undefined ? false : param.batteryVisible;
    var trend                   = param.trend || '';
    var trendVisible            = param.trendVisible === undefined ? false : param.trendVisible;
    var alarmVisible            = param.alarmVisible === undefined ? false : param.alarmVisible;
    var signalVisible           = param.signalVisible === undefined ? false : clamp(0, 1, param.signalVisible);
    var signalStrength          = param.signalStrength === undefined ? 0 : param.signalStrength;
    var crystalEffectVisible    = param.crystalEffectVisible === undefined ? false : param.crystalEffectVisible;
    var width                   = param.width || window.innerWidth;
    var height                  = param.height || window.innerWidth * 0.2666666666;
    var scalable                = param.scalable || false;
    var design                  = param.design || 'standard';
    var animated                = param.animated === undefined ? false : param.animated;
    var duration                = clamp(0, 10, param.duration) || 0.8;
    var foregroundShadowEnabled = param.foregroundShadowEnabled === undefined ? false : param.foregroundShadowEnabled;

    var showThreshold           = false;

    var foregroundColor = 'rgb(53, 42, 52)';
    var backgroundColor = 'rgba(53, 42, 52, 0.1)';

    if (scalable) { window.addEventListener("resize", onResize, false); }

    var LCD_FONT_NAME = 'digital-7mono';
    var lcdFontHeight = Math.floor(0.5833333333 * height);
    var lcdFont       = lcdFontHeight + 'px ' + LCD_FONT_NAME;

    var STD_FONT_NAME = 'Arial, sans-serif';
    var lcdUnitFont   = (0.26 * height) + 'px ' + STD_FONT_NAME;
    var lcdTitleFont  = (0.1666666667 * height) + 'px ' + STD_FONT_NAME;
    var lcdSmallFont  = (0.1666666667 * height) + 'px ' + STD_FONT_NAME;

    var aspectRatio   = height / width;

    var minMeasuredValue = maxValue;
    var maxMeasuredValue = minValue;
    var formerValue      = 0;

    // Create <canvas> element
    var canvas = doc.createElement('canvas');
    canvas.id = id;
    if (parentId === 'body') {
      doc.body.appendChild(canvas);
    } else {
      doc.getElementById(parentId).appendChild(canvas);
    }

    var mainCtx       = doc.getElementById(id).getContext('2d');
    var lcdBuffer     = doc.createElement('canvas');
    var textBuffer    = doc.createElement('canvas');
    var iconsBuffer   = doc.createElement('canvas');
    var crystalBuffer = doc.createElement('canvas');


    // ******************** private methods ************************************
    var drawLcd = function() {
      var ctx = lcdBuffer.getContext("2d");
      var width = lcdBuffer.width;
      var height = lcdBuffer.height;

      var radius = 0.09375 * height;

      ctx.clearRect(0, 0, width, height);

      // adjust design
      var frame = ctx.createLinearGradient(0, 0, 0, height);
      frame.addColorStop(0.0, 'rgb(26, 26, 26)');
      frame.addColorStop(0.01, 'rgb(77, 77, 77)');
      frame.addColorStop(0.83, 'rgb(77, 77, 77)');
      frame.addColorStop(1.0, 'rgb(221, 221, 221)');

      var main = ctx.createLinearGradient(0, 0.021 * height, 0, 0.98 * height);

      if (design === 'lcd-beige') {
        main.addColorStop(0.0, 'rgb(200, 200, 177)');
        main.addColorStop(0.005, 'rgb(241, 237, 207)');
        main.addColorStop(0.5, 'rgb(234, 230, 194)');
        main.addColorStop(0.5, 'rgb(225, 220, 183)');
        main.addColorStop(1.0, 'rgb(237, 232, 191)');
        foregroundColor = 'rgb(0, 0, 0)';
        backgroundColor = 'rgba(0, 0, 0, 0.1)';
      } else if (design === 'blue') {
        main.addColorStop(0.0, 'rgb(255, 255, 255)');
        main.addColorStop(0.005, 'rgb(231, 246, 255)');
        main.addColorStop(0.5, 'rgb(170, 224, 255)');
        main.addColorStop(0.5, 'rgb(136, 212, 255)');
        main.addColorStop(1.0, 'rgb(192, 232, 255)');
        foregroundColor = 'rgb( 18, 69, 100)';
        backgroundColor = 'rgba(18, 69, 100, 0.1)';
      } else if (design === 'orange') {
        main.addColorStop(0.0, 'rgb(255, 255, 255)');
        main.addColorStop(0.005, 'rgb(255, 245, 225)');
        main.addColorStop(0.5, 'rgb(255, 217, 147)');
        main.addColorStop(0.5, 'rgb(255, 201, 104)');
        main.addColorStop(1.0, 'rgb(255, 227, 173)');
        foregroundColor = 'rgb( 80, 55, 0)';
        backgroundColor = 'rgba(80, 55, 0, 0.1)';
      } else if (design === 'red') {
        main.addColorStop(0.0, 'rgb(255, 255, 255)');
        main.addColorStop(0.005, 'rgb(255, 225, 225)');
        main.addColorStop(0.5, 'rgb(252, 114, 115)');
        main.addColorStop(0.5, 'rgb(252, 114, 115)');
        main.addColorStop(1.0, 'rgb(254, 178, 178)');
        foregroundColor = 'rgb( 79, 12, 14)';
        backgroundColor = 'rgba(79, 12, 14, 0.1)';
      } else if (design === 'yellow') {
        main.addColorStop(0.0, 'rgb(255, 255, 255)');
        main.addColorStop(0.005, 'rgb(245, 255, 186)');
        main.addColorStop(0.5, 'rgb(158, 205,   0)');
        main.addColorStop(0.5, 'rgb(158, 205,   0)');
        main.addColorStop(1.0, 'rgb(210, 255,   0)');
        foregroundColor = 'rgb( 64, 83, 0)';
        backgroundColor = 'rgba(64, 83, 0, 0.1)';
      } else if (design === 'white') {
        main.addColorStop(0.0, 'rgb(255, 255, 255)');
        main.addColorStop(0.005, 'rgb(255, 255, 255)');
        main.addColorStop(0.5, 'rgb(241, 246, 242)');
        main.addColorStop(0.5, 'rgb(229, 239, 244)');
        main.addColorStop(1.0, 'rgb(255, 255, 255)');
        foregroundColor = 'rgb(0, 0, 0)';
        backgroundColor = 'rgba(0, 0, 0, 0.1)';
      } else if (design === 'gray') {
        main.addColorStop(0.0, 'rgb( 65,  65,  65)');
        main.addColorStop(0.005, 'rgb(117, 117, 117)');
        main.addColorStop(0.5, 'rgb( 87,  87,  87)');
        main.addColorStop(0.5, 'rgb( 65,  65,  65)');
        main.addColorStop(1.0, 'rgb( 81,  81,  81)');
        foregroundColor = 'rgb(255, 255, 255)';
        backgroundColor = 'rgba(255, 255, 255, 0.1)';
      } else if (design === 'black') {
        main.addColorStop(0.0, 'rgb( 65,  65,  65)');
        main.addColorStop(0.005, 'rgb(102, 102, 102)');
        main.addColorStop(0.5, 'rgb( 51,  51,  51)');
        main.addColorStop(0.5, 'rgb(  0,   0,   0)');
        main.addColorStop(1.0, 'rgb( 51,  51,  51)');
        foregroundColor = 'rgb(204, 204, 204)';
        backgroundColor = 'rgba(204, 204, 204, 0.1)';
      } else if (design === 'green') {
        main.addColorStop(0.0, 'rgb( 33,  67,  67)');
        main.addColorStop(0.005, 'rgb( 33,  67,  67)');
        main.addColorStop(0.5, 'rgb( 29,  58,  58)');
        main.addColorStop(0.5, 'rgb( 28,  57,  57)');
        main.addColorStop(1.0, 'rgb( 23,  46,  46)');
        foregroundColor = 'rgb(  0, 185, 165)';
        backgroundColor = 'rgba(0,  185, 165, 0.1)';
      } else if (design === 'green-darkgreen') {
        main.addColorStop(0.0, 'rgb( 27,  41,  17)');
        main.addColorStop(0.005, 'rgb( 70,  84,  58)');
        main.addColorStop(0.5, 'rgb( 36,  60,  14)');
        main.addColorStop(0.5, 'rgb( 24,  50,   1)');
        main.addColorStop(1.0, 'rgb(  8,  10,   7)');
        foregroundColor = 'rgb(152,  255, 74)';
        backgroundColor = 'rgba(152, 255, 74, 0.1)';
      } else if (design === 'blue2') {
        main.addColorStop(0.0, 'rgb(  0,  68, 103)');
        main.addColorStop(0.005, 'rgb(  8, 109, 165)');
        main.addColorStop(0.5, 'rgb(  0,  72, 117)');
        main.addColorStop(0.5, 'rgb(  0,  72, 117)');
        main.addColorStop(1.0, 'rgb(  0,  68, 103)');
        foregroundColor = 'rgb(111, 182, 228)';
        backgroundColor = 'rgba(111, 182, 228, 0.1)';
      } else if (design === 'blue-black') {
        main.addColorStop(0.0, 'rgb( 22, 125, 212)');
        main.addColorStop(0.005, 'rgb(  3, 162, 254)');
        main.addColorStop(0.5, 'rgb(  3, 162, 254)');
        main.addColorStop(0.5, 'rgb(  3, 162, 254)');
        main.addColorStop(1.0, 'rgb( 11, 172, 244)');
        foregroundColor = 'rgb(  0,   0,   0)';
        backgroundColor = 'rgba( 0,   0,   0, 0.1)';
      } else if (design === 'blue-darkblue') {
        main.addColorStop(0.0, 'rgb( 18,  33,  88)');
        main.addColorStop(0.005, 'rgb( 18,  33,  88)');
        main.addColorStop(0.5, 'rgb( 19,  30,  90)');
        main.addColorStop(0.5, 'rgb( 17,  31,  94)');
        main.addColorStop(1.0, 'rgb( 21,  25,  90)');
        foregroundColor = 'rgb( 23,  99, 221)';
        backgroundColor = 'rgba(23,  99, 221, 0.1)';
      } else if (design === 'blue-lightblue') {
        main.addColorStop(0.0, 'rgb( 88, 107, 132)');
        main.addColorStop(0.005, 'rgb( 53,  74, 104)');
        main.addColorStop(0.5, 'rgb( 27,  37,  65)');
        main.addColorStop(0.5, 'rgb(  5,  12,  40)');
        main.addColorStop(1.0, 'rgb( 32,  47,  79)');
        foregroundColor = 'rgb( 71, 178, 254)';
        backgroundColor = 'rgba(71, 178, 254, 0.1)';
      } else if (design === 'blue-gray') {
        main.addColorStop(0.0, 'rgb(135, 174, 255)');
        main.addColorStop(0.005, 'rgb(101, 159, 255)');
        main.addColorStop(0.5, 'rgb( 44,  93, 255)');
        main.addColorStop(0.5, 'rgb( 27,  65, 254)');
        main.addColorStop(1.0, 'rgb( 12,  50, 255)');
        foregroundColor = 'rgb(178, 180, 237)';
        backgroundColor = 'rgba(178, 180, 237, 0.1)';
      } else if (design === 'standard') {
        main.addColorStop(0.0, 'rgb(131, 133, 119)');
        main.addColorStop(0.005, 'rgb(176, 183, 167)');
        main.addColorStop(0.5, 'rgb(165, 174, 153)');
        main.addColorStop(0.5, 'rgb(166, 175, 156)');
        main.addColorStop(1.0, 'rgb(175, 184, 165)');
        foregroundColor = 'rgb( 35,  42,  52)';
        backgroundColor = 'rgba(35,  42,  52, 0.1)';
      } else if (design === 'lightgreen') {
        main.addColorStop(0.0, 'rgb(194, 212, 188)');
        main.addColorStop(0.005, 'rgb(212, 234, 206)');
        main.addColorStop(0.5, 'rgb(205, 224, 194)');
        main.addColorStop(0.5, 'rgb(206, 225, 194)');
        main.addColorStop(1.0, 'rgb(214, 233, 206)');
        foregroundColor = 'rgb(  0,  12,   6)';
        backgroundColor = 'rgba(0,   12,   6, 0.1)';
      } else if (design === 'standard-green') {
        main.addColorStop(0.0, 'rgb(255, 255, 255)');
        main.addColorStop(0.005, 'rgb(219, 230, 220)');
        main.addColorStop(0.5, 'rgb(179, 194, 178)');
        main.addColorStop(0.5, 'rgb(153, 176, 151)');
        main.addColorStop(1.0, 'rgb(114, 138, 109)');
        foregroundColor = 'rgb(  0,  12,   6)';
        backgroundColor = 'rgba(0,   12,   6, 0.1)';
      } else if (design === 'blue-blue') {
        main.addColorStop(0.0, 'rgb(100, 168, 253)');
        main.addColorStop(0.005, 'rgb(100, 168, 253)');
        main.addColorStop(0.5, 'rgb( 95, 160, 250)');
        main.addColorStop(0.5, 'rgb( 80, 144, 252)');
        main.addColorStop(1.0, 'rgb( 74, 134, 255)');
        foregroundColor = 'rgb(  0,  44, 187)';
        backgroundColor = 'rgba( 0,  44, 187, 0.1)';
      } else if (design === 'red-darkred') {
        main.addColorStop(0.0, 'rgb( 72,  36,  50)');
        main.addColorStop(0.005, 'rgb(185, 111, 110)');
        main.addColorStop(0.5, 'rgb(148,  66,  72)');
        main.addColorStop(0.5, 'rgb( 83,  19,  20)');
        main.addColorStop(1.0, 'rgb(  7,   6,  14)');
        foregroundColor = 'rgb(254, 139, 146)';
        backgroundColor = 'rgba(254, 139, 146, 0.1)';
      } else if (design === 'darkblue') {
        main.addColorStop(0.0, 'rgb( 14,  24,  31)');
        main.addColorStop(0.005, 'rgb( 46, 105, 144)');
        main.addColorStop(0.5, 'rgb( 19,  64,  96)');
        main.addColorStop(0.5, 'rgb(  6,  20,  29)');
        main.addColorStop(1.0, 'rgb(  8,   9,  10)');
        foregroundColor = 'rgb( 61, 179, 255)';
        backgroundColor = 'rgba(61, 179, 255, 0.1)';
      } else if (design === 'purple') {
        main.addColorStop(0.0, 'rgb(175, 164, 255)');
        main.addColorStop(0.005, 'rgb(188, 168, 253)');
        main.addColorStop(0.5, 'rgb(176, 159, 255)');
        main.addColorStop(0.5, 'rgb(174, 147, 252)');
        main.addColorStop(1.0, 'rgb(168, 136, 233)');
        foregroundColor = 'rgb(  7,  97,  72)';
        backgroundColor = 'rgba( 7,  97,  72, 0.1)';
      } else if (design === 'black-red') {
        main.addColorStop(0.0, 'rgb(  8,  12,  11)');
        main.addColorStop(0.005, 'rgb( 10,  11,  13)');
        main.addColorStop(0.5, 'rgb( 11,  10,  15)');
        main.addColorStop(0.5, 'rgb(  7,  13,   9)');
        main.addColorStop(1.0, 'rgb(  9,  13,  14)');
        foregroundColor = 'rgb(181,   0,  38)';
        backgroundColor = 'rgba(181,  0,  38, 0.1)';
      } else if (design === 'darkgreen') {
        main.addColorStop(0.0, 'rgb( 25,  85,   0)');
        main.addColorStop(0.005, 'rgb( 47, 154,   0)');
        main.addColorStop(0.5, 'rgb( 30, 101,   0)');
        main.addColorStop(0.5, 'rgb( 30, 101,   0)');
        main.addColorStop(1.0, 'rgb( 25,  85,   0)');
        foregroundColor = 'rgb( 35,  49,  35)';
        backgroundColor = 'rgba(35,  49,  35, 0.1)';
      } else if (design === 'amber') {
        main.addColorStop(0.0, 'rgb(182,  71,   0)');
        main.addColorStop(0.005, 'rgb(236, 155,  25)');
        main.addColorStop(0.5, 'rgb(212,  93,   5)');
        main.addColorStop(0.5, 'rgb(212,  93,   5)');
        main.addColorStop(1.0, 'rgb(182,  71,   0)');
        foregroundColor = 'rgb( 89,  58,  10)';
        backgroundColor = 'rgba(89,  58,  10, 0.1)';
      } else if (design === 'lightblue') {
        main.addColorStop(0.0, 'rgb(125, 146, 184)');
        main.addColorStop(0.005, 'rgb(197, 212, 231)');
        main.addColorStop(0.5, 'rgb(138, 155, 194)');
        main.addColorStop(0.5, 'rgb(138, 155, 194)');
        main.addColorStop(1.0, 'rgb(125, 146, 184)');
        foregroundColor = 'rgb(  9,   0,  81)';
        backgroundColor = 'rgba( 9,   0,  81, 0.1)';
      } else if (design === 'green-black') {
        main.addColorStop(0.0, 'rgb(  1,  47,   0)');
        main.addColorStop(0.005, 'rgb( 20, 106,  61)');
        main.addColorStop(0.5, 'rgb( 33, 125,  84)');
        main.addColorStop(0.5, 'rgb( 33, 125,  84)');
        main.addColorStop(1.0, 'rgb( 33, 109,  63)');
        foregroundColor = 'rgb(  3,  15,  11)';
        backgroundColor = 'rgba(3, 15, 11, 0.1)';
      } else if (design === 'yellow-black') {
        main.addColorStop(0.0, 'rgb(223, 248,  86)');
        main.addColorStop(0.005, 'rgb(222, 255,  28)');
        main.addColorStop(0.5, 'rgb(213, 245,  24)');
        main.addColorStop(0.5, 'rgb(213, 245,  24)');
        main.addColorStop(1.0, 'rgb(224, 248,  88)');
        foregroundColor = 'rgb(  9,  19,   0)';
        backgroundColor = 'rgba( 9,  19,   0, 0.1)';
      } else if (design === 'black-yellow') {
        main.addColorStop(0.0, 'rgb( 43,   3,   3)');
        main.addColorStop(0.005, 'rgb( 29,   0,   0)');
        main.addColorStop(0.5, 'rgb( 26,   2,   2)');
        main.addColorStop(0.5, 'rgb( 31,   5,   8)');
        main.addColorStop(1.0, 'rgb( 30,   1,   3)');
        foregroundColor = 'rgb(255, 254,  24)';
        backgroundColor = 'rgba(255, 254, 24, 0.1)';
      } else if (design === 'lightgreen-black') {
        main.addColorStop(0.0, 'rgb( 79, 121,  19)');
        main.addColorStop(0.005, 'rgb( 96, 169,   0)');
        main.addColorStop(0.5, 'rgb(120, 201,   2)');
        main.addColorStop(0.5, 'rgb(118, 201,   0)');
        main.addColorStop(1.0, 'rgb(105, 179,   4)');
        foregroundColor = 'rgb(  0,  35,   0)';
        backgroundColor = 'rgba( 0,  35,   0, 0.1)';
      } else if (design === 'darkpurple') {
        main.addColorStop(0.0, 'rgb( 35,  24,  75)');
        main.addColorStop(0.005, 'rgb( 42,  20, 111)');
        main.addColorStop(0.5, 'rgb( 40,  22, 103)');
        main.addColorStop(0.5, 'rgb( 40,  22, 103)');
        main.addColorStop(1.0, 'rgb( 41,  21, 111)');
        foregroundColor = 'rgb(158, 167, 210)';
        backgroundColor = 'rgba(158, 167, 210, 0.1)';
      } else if (design === 'darkamber') {
        main.addColorStop(0.0, 'rgb(134,  39,  17)');
        main.addColorStop(0.005, 'rgb(120,  24,   0)');
        main.addColorStop(0.5, 'rgb( 83,  15,  12)');
        main.addColorStop(0.5, 'rgb( 83,  15,  12)');
        main.addColorStop(1.0, 'rgb(120,  24,   0)');
        foregroundColor = 'rgb(233, 140,  44)';
        backgroundColor = 'rgba(233, 140, 44, 0.1)';
      } else if (design === 'blue-lightblue2') {
        main.addColorStop(0.0, 'rgb( 15,  84, 151)');
        main.addColorStop(0.005, 'rgb( 60, 103, 198)');
        main.addColorStop(0.5, 'rgb( 67, 109, 209)');
        main.addColorStop(0.5, 'rgb( 67, 109, 209)');
        main.addColorStop(1.0, 'rgb( 64, 101, 190)');
        foregroundColor = 'rgb(193, 253, 254)';
        backgroundColor = 'rgba(193, 253, 254, 0.1)';
      } else if (design === 'gray-purple') {
        main.addColorStop(0.0, 'rgb(153, 164, 161)');
        main.addColorStop(0.005, 'rgb(203, 215, 213)');
        main.addColorStop(0.5, 'rgb(202, 212, 211)');
        main.addColorStop(0.5, 'rgb(202, 212, 211)');
        main.addColorStop(1.0, 'rgb(198, 209, 213)');
        foregroundColor = 'rgb( 99, 124, 204)';
        backgroundColor = 'rgba(99, 124, 204, 0.1)';
      } else if (design === 'sections') {
        main.addColorStop(0.0, 'rgb(178, 178, 178)');
        main.addColorStop(0.005, 'rgb(255, 255, 255)');
        main.addColorStop(0.5, 'rgb(196, 196, 196)');
        main.addColorStop(0.5, 'rgb(196, 196, 196)');
        main.addColorStop(1.0, 'rgb(178, 178, 178)');
        foregroundColor = 'rgb(0, 0, 0)';
        backgroundColor = 'rgba(0, 0, 0, 0.1)';
      } else if (design === 'yoctopuce') {
        main.addColorStop(0.0, 'rgb(14, 24, 31)');
        main.addColorStop(0.005, 'rgb(35, 35, 65)');
        main.addColorStop(0.5, 'rgb(30, 30, 60)');
        main.addColorStop(0.5, 'rgb(30, 30, 60)');
        main.addColorStop(1.0, 'rgb(25, 25, 55)');
        foregroundColor = 'rgb(153, 229, 255)';
        backgroundColor = 'rgba(153,229,255, 0.1)';
      } else if (design === 'flat-turqoise') {
        frame = 'rgb(255, 255, 255)';
        main.addColorStop(0.0, 'rgb( 31, 188, 156)');
        main.addColorStop(0.005, 'rgb( 31, 188, 156)');
        main.addColorStop(0.5, 'rgb( 31, 188, 156)');
        main.addColorStop(0.5, 'rgb( 31, 188, 156)');
        main.addColorStop(1.0, 'rgb( 31, 188, 156)');
        foregroundColor = 'rgb(255, 255, 255)';
        backgroundColor = 'rgba(255, 255, 255, 0.1)';
      } else if (design === 'flat-green-sea') {
        frame = 'rgb(255, 255, 255)';
        main.addColorStop(0.0, 'rgb( 26, 188, 156)');
        main.addColorStop(0.005, 'rgb( 26, 188, 156)');
        main.addColorStop(0.5, 'rgb( 26, 188, 156)');
        main.addColorStop(0.5, 'rgb( 26, 188, 156)');
        main.addColorStop(1.0, 'rgb( 26, 188, 156)');
        foregroundColor = 'rgb(255, 255, 255)';
        backgroundColor = 'rgba(255, 255, 255, 0.1)';
      } else if (design === 'flat-emerland') {
        frame = 'rgb(255, 255, 255)';
        main.addColorStop(0.0, 'rgb( 46, 204, 113)');
        main.addColorStop(0.005, 'rgb( 46, 204, 113)');
        main.addColorStop(0.5, 'rgb( 46, 204, 113)');
        main.addColorStop(0.5, 'rgb( 46, 204, 113)');
        main.addColorStop(1.0, 'rgb( 46, 204, 113)');
        foregroundColor = 'rgb(255, 255, 255)';
        backgroundColor = 'rgba(255, 255, 255, 0.1)';
      } else if (design === 'flat-nephritis') {
        frame = 'rgb(255, 255, 255)';
        main.addColorStop(0.0, 'rgb( 39, 174,  96)');
        main.addColorStop(0.005, 'rgb( 39, 174,  96)');
        main.addColorStop(0.5, 'rgb( 39, 174,  96)');
        main.addColorStop(0.5, 'rgb( 39, 174,  96)');
        main.addColorStop(1.0, 'rgb( 39, 174,  96)');
        foregroundColor = 'rgb(255, 255, 255)';
        backgroundColor = 'rgba(255, 255, 255, 0.1)';
      } else if (design === 'flat-peter-river') {
        frame = 'rgb(255, 255, 255)';
        main.addColorStop(0.0, 'rgb( 52, 152, 219)');
        main.addColorStop(0.005, 'rgb( 52, 152, 219)');
        main.addColorStop(0.5, 'rgb( 52, 152, 219)');
        main.addColorStop(0.5, 'rgb( 52, 152, 219)');
        main.addColorStop(1.0, 'rgb( 52, 152, 219)');
        foregroundColor = 'rgb(255, 255, 255)';
        backgroundColor = 'rgba(255, 255, 255, 0.1)';
      } else if (design === 'flat-belize-hole') {
        frame = 'rgb(255, 255, 255)';
        main.addColorStop(0.0, 'rgb( 41, 128, 185)');
        main.addColorStop(0.005, 'rgb( 41, 128, 185)');
        main.addColorStop(0.5, 'rgb( 41, 128, 185)');
        main.addColorStop(0.5, 'rgb( 41, 128, 185)');
        main.addColorStop(1.0, 'rgb( 41, 128, 185)');
        foregroundColor = 'rgb(255, 255, 255)';
        backgroundColor = 'rgba(255, 255, 255, 0.1)';
      } else if (design === 'flat-amythyst') {
        frame = 'rgb(255, 255, 255)';
        main.addColorStop(0.0, 'rgb(155,  89, 182)');
        main.addColorStop(0.005, 'rgb(155,  89, 182)');
        main.addColorStop(0.5, 'rgb(155,  89, 182)');
        main.addColorStop(0.5, 'rgb(155,  89, 182)');
        main.addColorStop(1.0, 'rgb(155,  89, 182)');
        foregroundColor = 'rgb(255, 255, 255)';
        backgroundColor = 'rgba(255, 255, 255, 0.1)';
      } else if (design === 'flat-wisteria') {
        frame = 'rgb(255, 255, 255)';
        main.addColorStop(0.0, 'rgb(142,  68, 173)');
        main.addColorStop(0.005, 'rgb(142,  68, 173)');
        main.addColorStop(0.5, 'rgb(142,  68, 173)');
        main.addColorStop(0.5, 'rgb(142,  68, 173)');
        main.addColorStop(1.0, 'rgb(142,  68, 173)');
        foregroundColor = 'rgb(255, 255, 255)';
        backgroundColor = 'rgba(255, 255, 255, 0.1)';
      } else if (design === 'flat-sunflower') {
        frame = 'rgb(255, 255, 255)';
        main.addColorStop(0.0, 'rgb(241, 196,  15)');
        main.addColorStop(0.005, 'rgb(241, 196,  15)');
        main.addColorStop(0.5, 'rgb(241, 196,  15)');
        main.addColorStop(0.5, 'rgb(241, 196,  15)');
        main.addColorStop(1.0, 'rgb(241, 196,  15)');
        foregroundColor = 'rgb(255, 255, 255)';
        backgroundColor = 'rgba(255, 255, 255, 0.1)';
      } else if (design === 'flat-orange') {
        frame = 'rgb(255, 255, 255)';
        main.addColorStop(0.0, 'rgb(243, 156,  18)');
        main.addColorStop(0.005, 'rgb(243, 156,  18)');
        main.addColorStop(0.5, 'rgb(243, 156,  18)');
        main.addColorStop(0.5, 'rgb(243, 156,  18)');
        main.addColorStop(1.0, 'rgb(243, 156,  18)');
        foregroundColor = 'rgb(255, 255, 255)';
        backgroundColor = 'rgba(255, 255, 255, 0.1)';
      } else if (design === 'flat-carrot') {
        frame = 'rgb(255, 255, 255)';
        main.addColorStop(0.0, 'rgb(230, 126,  34)');
        main.addColorStop(0.005, 'rgb(230, 126,  34)');
        main.addColorStop(0.5, 'rgb(230, 126,  34)');
        main.addColorStop(0.5, 'rgb(230, 126,  34)');
        main.addColorStop(1.0, 'rgb(230, 126,  34)');
        foregroundColor = 'rgb(255, 255, 255)';
        backgroundColor = 'rgba(255, 255, 255, 0.1)';
      } else if (design === 'flat-pumpkin') {
        frame = 'rgb(255, 255, 255)';
        main.addColorStop(0.0, 'rgb(211,  84,   0)');
        main.addColorStop(0.005, 'rgb(211,  84,   0)');
        main.addColorStop(0.5, 'rgb(211,  84,   0)');
        main.addColorStop(0.5, 'rgb(211,  84,   0)');
        main.addColorStop(1.0, 'rgb(211,  84,   0)');
        foregroundColor = 'rgb(255, 255, 255)';
        backgroundColor = 'rgba(255, 255, 255, 0.1)';
      } else if (design === 'flat-alizarin') {
        frame = 'rgb(255, 255, 255)';
        main.addColorStop(0.0, 'rgb(231,  76,  60)');
        main.addColorStop(0.005, 'rgb(231,  76,  60)');
        main.addColorStop(0.5, 'rgb(231,  76,  60)');
        main.addColorStop(0.5, 'rgb(231,  76,  60)');
        main.addColorStop(1.0, 'rgb(231,  76,  60)');
        foregroundColor = 'rgb(255, 255, 255)';
        backgroundColor = 'rgba(255, 255, 255, 0.1)';
      } else if (design === 'flat-pomegranate') {
        frame = 'rgb(255, 255, 255)';
        main.addColorStop(0.0, 'rgb(192,  57,  43)');
        main.addColorStop(0.005, 'rgb(192,  57,  43)');
        main.addColorStop(0.5, 'rgb(192,  57,  43)');
        main.addColorStop(0.5, 'rgb(192,  57,  43)');
        main.addColorStop(1.0, 'rgb(192,  57,  43)');
        foregroundColor = 'rgb(255, 255, 255)';
        backgroundColor = 'rgba(255, 255, 255, 0.1)';
      } else if (design === 'flat-clouds') {
        frame = 'rgb(255, 255, 255)';
        main.addColorStop(0.0, 'rgb(236, 240, 241)');
        main.addColorStop(0.005, 'rgb(236, 240, 241)');
        main.addColorStop(0.5, 'rgb(236, 240, 241)');
        main.addColorStop(0.5, 'rgb(236, 240, 241)');
        main.addColorStop(1.0, 'rgb(236, 240, 241)');
        foregroundColor = 'rgb(  0,   0,   0)';
        backgroundColor = 'rgba(  0,   0,   0, 0.1)';
      } else if (design === 'flat-silver') {
        frame = 'rgb(255, 255, 255)';
        main.addColorStop(0.0, 'rgb(189, 195, 199)');
        main.addColorStop(0.005, 'rgb(189, 195, 199)');
        main.addColorStop(0.5, 'rgb(189, 195, 199)');
        main.addColorStop(0.5, 'rgb(189, 195, 199)');
        main.addColorStop(1.0, 'rgb(189, 195, 199)');
        foregroundColor = 'rgb(  0,   0,   0)';
        backgroundColor = 'rgba(  0,   0,   0, 0.1)';
      } else if (design === 'flat-concrete') {
        frame = 'rgb(255, 255, 255)';
        main.addColorStop(0.0, 'rgb(149, 165, 166)');
        main.addColorStop(0.005, 'rgb(149, 165, 166)');
        main.addColorStop(0.5, 'rgb(149, 165, 166)');
        main.addColorStop(0.5, 'rgb(149, 165, 166)');
        main.addColorStop(1.0, 'rgb(149, 165, 166)');
        foregroundColor = 'rgb(  0,   0,   0)';
        backgroundColor = 'rgba(  0,   0,   0, 0.1)';
      } else if (design === 'flat-asbestos') {
        frame = 'rgb(255, 255, 255)';
        main.addColorStop(0.0, 'rgb(127, 140, 141)');
        main.addColorStop(0.005, 'rgb(127, 140, 141)');
        main.addColorStop(0.5, 'rgb(127, 140, 141)');
        main.addColorStop(0.5, 'rgb(127, 140, 141)');
        main.addColorStop(1.0, 'rgb(127, 140, 141)');
        foregroundColor = 'rgb(255, 255, 255)';
        backgroundColor = 'rgba(255, 255, 255, 0.1)';
      } else if (design === 'flat-wet-asphalt') {
        frame = 'rgb(255, 255, 255)';
        main.addColorStop(0.0, 'rgb( 52,  73,  94)');
        main.addColorStop(0.005, 'rgb( 52,  73,  94)');
        main.addColorStop(0.5, 'rgb( 52,  73,  94)');
        main.addColorStop(0.5, 'rgb( 52,  73,  94)');
        main.addColorStop(1.0, 'rgb( 52,  73,  94)');
        foregroundColor = 'rgb(255, 255, 255)';
        backgroundColor = 'rgba(255, 255, 255, 0.1)';
      } else if (design === 'flat-midnight-blue') {
        frame = 'rgb(255, 255, 255)';
        main.addColorStop(0.0, 'rgb( 44,  62,  80)');
        main.addColorStop(0.005, 'rgb( 44,  62,  80)');
        main.addColorStop(0.5, 'rgb( 44,  62,  80)');
        main.addColorStop(0.5, 'rgb( 44,  62,  80)');
        main.addColorStop(1.0, 'rgb( 44,  62,  80)');
        foregroundColor = 'rgb(255, 255, 255)';
        backgroundColor = 'rgba(255, 255, 255, 0.1)';
      } else {
        main.addColorStop(0.0, 'rgb(131, 133, 119)');
        main.addColorStop(0.005, 'rgb(176, 183, 167)');
        main.addColorStop(0.5, 'rgb(165, 174, 153)');
        main.addColorStop(0.5, 'rgb(166, 175, 156)');
        main.addColorStop(1.0, 'rgb(175, 184, 165)');
        foregroundColor = 'rgb( 35,  42,  52)';
        backgroundColor = 'rgba(35,  42,  52, 0.1)';
      }

      //frame
      roundedRectangle(ctx, 0, 0, width, height, radius);
      ctx.fillStyle = frame;
      ctx.strokeStyle = 'transparent';
      ctx.fill();

      //main
      roundedRectangle(ctx, 1, 1, width - 2, height - 2, 0.0833333333 * height);
      ctx.fillStyle = main;
      ctx.strokeStyle = 'transparent';
      ctx.fill();
    };

    var drawText = function() {
      var ctx = textBuffer.getContext("2d");
      var width = textBuffer.width;
      var height = textBuffer.height;

      ctx.clearRect(0, 0, width, height);

      lcdFontHeight = Math.floor(0.5833333333 * height);
      lcdFont       = lcdFontHeight + 'px ' + LCD_FONT_NAME;

      lcdUnitFont  = Math.floor(0.26 * height) + 'px ' + STD_FONT_NAME;
      lcdTitleFont = Math.floor(0.1666666667 * height) + 'px ' + STD_FONT_NAME;
      lcdSmallFont = Math.floor(0.1666666667 * height) + 'px ' + STD_FONT_NAME;

      ctx.font = lcdUnitFont;
      var unitWidth = ctx.measureText(unit).width;
      ctx.font = lcdFont;
      var textWidth = ctx.measureText(Number(value).toFixed(2)).width;

      // calculate background text
      var oneSegmentWidth = ctx.measureText('8').width;

      // Width of decimals
      var widthOfDecimals = decimals === 0 ? 0 : decimals * oneSegmentWidth + oneSegmentWidth;

      // Available width
      var availableWidth = width - 2 - (unitWidth + height * 0.0833333333) - widthOfDecimals - (signalVisible ? 0.0303 * width : 0);

      // Number of segments
      var noOfSegments = Math.floor(availableWidth / oneSegmentWidth);

      // Add segments to background text
      var backgroundText = '';
      for (var i = 0; i < noOfSegments; i++) {
        backgroundText += '8';
      }
      if (decimals !== 0) {
        backgroundText += ".";
        for (var i = 0; i < decimals; i++) {
          backgroundText += '8';
        }
      }
      var backgroundWidth = ctx.measureText(backgroundText).width;

      //dropshadow
      if (foregroundShadowEnabled) {
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 1;
        ctx.shadowBlur = 2;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      }

      //valueBackground
      ctx.save();
      ctx.fillStyle    = backgroundColor;
      ctx.font         = lcdFont;
      ctx.textBaseline = 'bottom';
      if (unitVisible) {
        ctx.fillText(backgroundText, width - 2 - backgroundWidth - (unitWidth + height * 0.0833333333), 0.77 * height);
      } else {
        ctx.fillText(backgroundText, width - 2 - backgroundWidth - height * 0.0833333333, 0.77 * height);
      }

      ctx.fillStyle = foregroundColor;

      //valueText
      ctx.font = lcdFont;
      ctx.textBaseline = 'bottom';
      if (unitVisible) {
        ctx.fillText(Number(value).toFixed(decimals), width - 2 - textWidth - (unitWidth + height * 0.0833333333), 0.77 * height);
      } else {
        ctx.fillText(Number(value).toFixed(decimals), width - 2 - textWidth - height * 0.0833333333, 0.77 * height);
      }

      //unitText
      if (unitVisible) {
        ctx.fill();
        ctx.font = lcdUnitFont;
        ctx.textBaseline = 'bottom';
        ctx.fillText(unit, width - unitWidth - 0.04 * height, 0.745 * height);
      }

      //lowerCenterText
      if (lowerCenterTextVisible) {
        ctx.font         = lcdSmallFont;
        ctx.textBaseline = 'bottom';
        if (formerValueVisible) {
          ctx.fillText(Number(lowerCenterText).toFixed(decimals), (width - ctx.measureText(Number(lowerCenterText).toFixed(2)).width) * 0.5, 0.98 * height);
        } else {
          ctx.fillText(lowerCenterText, (width - ctx.measureText(lowerCenterText).width) * 0.5, 0.98 * height);
        }
      }

      //upperLeftText
      if (upperLeftTextVisible) {
        ctx.font = lcdSmallFont;
        ctx.textBaseline = 'bottom';
        upperLeftText = Number(minMeasuredValue).toFixed(decimals);
        ctx.fillText(upperLeftText, 0.0416666667 * height, 0.23 * height);
      }

      //upperRightText
      if (upperRightTextVisible) {
        ctx.font = lcdSmallFont;
        ctx.textBaseline = 'bottom';
        upperRightText = Number(maxMeasuredValue).toFixed(decimals);
        ctx.fillText(upperRightText, width - 0.0416666667 * height - ctx.measureText(Number(upperRightText).toFixed(2)).width, 0.23 * height);
      }

      //upperCenterText
      if (upperCenterTextVisible) {
        ctx.font = 'bold ' + lcdTitleFont;
        ctx.textBaseline = 'bottom';
        ctx.fillText(upperCenterText, (width - ctx.measureText(upperCenterText).width) * 0.5, 0.23 * height);
      }

      //lowerRightText
      if (lowerRightTextVisible) {
        ctx.font = lcdSmallFont;
        ctx.textBaseline = 'bottom';
        ctx.fillText(lowerRightText, width - 0.0416666667 * height - ctx.measureText(lowerRightText).width, 0.98 * height);
      }
    };

    var drawIcons = function() {
      var ctx    = iconsBuffer.getContext("2d");
      var width  = iconsBuffer.width;
      var height = iconsBuffer.height;

      ctx.clearRect(0, 0, width, height);

      //dropshadow
      if (foregroundShadowEnabled) {
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 1;
        ctx.shadowBlur = 2;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      }

      ctx.fillStyle = foregroundColor;

      if (thresholdVisible && showThreshold) {
        //threshold
        ctx.beginPath();
        ctx.moveTo(0.07575757575757576 * width, 0.8958333333333334 * height);
        ctx.lineTo(0.08333333333333333 * width, 0.8958333333333334 * height);
        ctx.lineTo(0.08333333333333333 * width, 0.9166666666666666 * height);
        ctx.lineTo(0.07575757575757576 * width, 0.9166666666666666 * height);
        ctx.lineTo(0.07575757575757576 * width, 0.8958333333333334 * height);
        ctx.closePath();
        ctx.moveTo(0.07575757575757576 * width, 0.8125 * height);
        ctx.lineTo(0.08333333333333333 * width, 0.8125 * height);
        ctx.lineTo(0.08333333333333333 * width, 0.875 * height);
        ctx.lineTo(0.07575757575757576 * width, 0.875 * height);
        ctx.lineTo(0.07575757575757576 * width, 0.8125 * height);
        ctx.closePath();
        ctx.moveTo(0.11363636363636363 * width, 0.9375 * height);
        ctx.lineTo(0.08 * width, 0.75 * height);
        ctx.lineTo(0.045454545454545456 * width, 0.9375 * height);
        //ctx.lineTo(0.11363636363636363 * width, 0.9375 * height);
        ctx.closePath();
        ctx.fill();
      }

      if (trendVisible) {
        if (trend === 'down') {
          //trendDown
          ctx.beginPath();
          ctx.moveTo(0.18181818181818182 * width, 0.8125 * height);
          ctx.lineTo(0.21212121212121213 * width, 0.9375 * height);
          ctx.lineTo(0.24242424242424243 * width, 0.8125 * height);
          ctx.lineTo(0.18181818181818182 * width, 0.8125 * height);
          ctx.closePath();
          ctx.fill();
        } else if (trend === 'falling') {
          //trendFalling
          ctx.beginPath();
          ctx.moveTo(0.18181818181818182 * width, 0.8958333333333334 * height);
          ctx.lineTo(0.24242424242424243 * width, 0.9375 * height);
          ctx.lineTo(0.20454545454545456 * width, 0.8125 * height);
          ctx.lineTo(0.18181818181818182 * width, 0.8958333333333334 * height);
          ctx.closePath();
          ctx.fill();
        } else if (trend === 'steady') {
          //trendSteady
          ctx.beginPath();
          ctx.moveTo(0.18181818181818182 * width, 0.8125 * height);
          ctx.lineTo(0.24242424242424243 * width, 0.875 * height);
          ctx.lineTo(0.18181818181818182 * width, 0.9375 * height);
          ctx.lineTo(0.18181818181818182 * width, 0.8125 * height);
          ctx.closePath();
          ctx.fill();
        } else if (trend === 'rising') {
          //trendRising
          ctx.beginPath();
          ctx.moveTo(0.18181818181818182 * width, 0.8541666666666666 * height);
          ctx.lineTo(0.24242424242424243 * width, 0.8125 * height);
          ctx.lineTo(0.20454545454545456 * width, 0.9375 * height);
          ctx.lineTo(0.18181818181818182 * width, 0.8541666666666666 * height);
          ctx.closePath();
          ctx.fill();
        } else if (trend === 'up') {
          //trendUp
          ctx.beginPath();
          ctx.moveTo(0.18181818181818182 * width, 0.9375 * height);
          ctx.lineTo(0.21212121212121213 * width, 0.8125 * height);
          ctx.lineTo(0.24242424242424243 * width, 0.9375 * height);
          ctx.lineTo(0.18181818181818182 * width, 0.9375 * height);
          ctx.closePath();
          ctx.fill();
        }
      }

      if (batteryVisible) {
        if (battery === 'empty') {
          //empty
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(0.8106060606060606 * width, 0.9166666666666666 * height);
          ctx.bezierCurveTo(0.803030303030303 * width, 0.9166666666666666 * height, 0.803030303030303 * width, 0.9166666666666666 * height, 0.803030303030303 * width, 0.9166666666666666 * height);
          ctx.bezierCurveTo(0.803030303030303 * width, 0.9166666666666666 * height, 0.803030303030303 * width, 0.9375 * height, 0.803030303030303 * width, 0.9375 * height);
          ctx.bezierCurveTo(0.803030303030303 * width, 0.9375 * height, 0.7954545454545454 * width, 0.9583333333333334 * height, 0.7954545454545454 * width, 0.9583333333333334 * height);
          ctx.bezierCurveTo(0.7954545454545454 * width, 0.9583333333333334 * height, 0.6742424242424242 * width, 0.9583333333333334 * height, 0.6742424242424242 * width, 0.9583333333333334 * height);
          ctx.bezierCurveTo(0.6742424242424242 * width, 0.9583333333333334 * height, 0.6666666666666666 * width, 0.9375 * height, 0.6666666666666666 * width, 0.9375 * height);
          ctx.bezierCurveTo(0.6666666666666666 * width, 0.9375 * height, 0.6666666666666666 * width, 0.8125 * height, 0.6666666666666666 * width, 0.8125 * height);
          ctx.bezierCurveTo(0.6666666666666666 * width, 0.8125 * height, 0.6742424242424242 * width, 0.7916666666666666 * height, 0.6742424242424242 * width, 0.7916666666666666 * height);
          ctx.bezierCurveTo(0.6742424242424242 * width, 0.7916666666666666 * height, 0.7954545454545454 * width, 0.7916666666666666 * height, 0.7954545454545454 * width, 0.7916666666666666 * height);
          ctx.bezierCurveTo(0.7954545454545454 * width, 0.7916666666666666 * height, 0.803030303030303 * width, 0.8125 * height, 0.803030303030303 * width, 0.8125 * height);
          ctx.bezierCurveTo(0.803030303030303 * width, 0.8125 * height, 0.803030303030303 * width, 0.8333333333333334 * height, 0.803030303030303 * width, 0.8333333333333334 * height);
          ctx.bezierCurveTo(0.803030303030303 * width, 0.8333333333333334 * height, 0.803030303030303 * width, 0.8333333333333334 * height, 0.8106060606060606 * width, 0.8333333333333334 * height);
          ctx.bezierCurveTo(0.8106060606060606 * width, 0.8333333333333334 * height, 0.8106060606060606 * width, 0.8541666666666666 * height, 0.8106060606060606 * width, 0.8541666666666666 * height);
          ctx.bezierCurveTo(0.8106060606060606 * width, 0.8541666666666666 * height, 0.8106060606060606 * width, 0.8958333333333334 * height, 0.8106060606060606 * width, 0.8958333333333334 * height);
          ctx.bezierCurveTo(0.8106060606060606 * width, 0.8958333333333334 * height, 0.8106060606060606 * width, 0.9166666666666666 * height, 0.8106060606060606 * width, 0.9166666666666666 * height);
          ctx.closePath();
          ctx.moveTo(0.7954545454545454 * width, 0.8333333333333334 * height);
          ctx.bezierCurveTo(0.7954545454545454 * width, 0.8125 * height, 0.7954545454545454 * width, 0.8125 * height, 0.7878787878787878 * width, 0.8125 * height);
          ctx.bezierCurveTo(0.7878787878787878 * width, 0.8125 * height, 0.6818181818181818 * width, 0.8125 * height, 0.6818181818181818 * width, 0.8125 * height);
          ctx.bezierCurveTo(0.6742424242424242 * width, 0.8125 * height, 0.6742424242424242 * width, 0.8125 * height, 0.6742424242424242 * width, 0.8333333333333334 * height);
          ctx.bezierCurveTo(0.6742424242424242 * width, 0.8333333333333334 * height, 0.6742424242424242 * width, 0.9166666666666666 * height, 0.6742424242424242 * width, 0.9166666666666666 * height);
          ctx.bezierCurveTo(0.6742424242424242 * width, 0.9375 * height, 0.6742424242424242 * width, 0.9375 * height, 0.6818181818181818 * width, 0.9375 * height);
          ctx.bezierCurveTo(0.6818181818181818 * width, 0.9375 * height, 0.7878787878787878 * width, 0.9375 * height, 0.7878787878787878 * width, 0.9375 * height);
          ctx.bezierCurveTo(0.7954545454545454 * width, 0.9375 * height, 0.7954545454545454 * width, 0.9375 * height, 0.7954545454545454 * width, 0.9166666666666666 * height);
          ctx.bezierCurveTo(0.7954545454545454 * width, 0.9166666666666666 * height, 0.7954545454545454 * width, 0.8333333333333334 * height, 0.7954545454545454 * width, 0.8333333333333334 * height);
          ctx.closePath();
          ctx.fill();
        } else if (battery === 'onethird') {
          // 30%
          ctx.beginPath();
          ctx.moveTo(0.8106060606060606 * width, 0.9166666666666666 * height);
          ctx.bezierCurveTo(0.803030303030303 * width, 0.9166666666666666 * height, 0.803030303030303 * width, 0.9166666666666666 * height, 0.803030303030303 * width, 0.9166666666666666 * height);
          ctx.bezierCurveTo(0.803030303030303 * width, 0.9166666666666666 * height, 0.803030303030303 * width, 0.9375 * height, 0.803030303030303 * width, 0.9375 * height);
          ctx.bezierCurveTo(0.803030303030303 * width, 0.9375 * height, 0.7954545454545454 * width, 0.9583333333333334 * height, 0.7954545454545454 * width, 0.9583333333333334 * height);
          ctx.bezierCurveTo(0.7954545454545454 * width, 0.9583333333333334 * height, 0.6742424242424242 * width, 0.9583333333333334 * height, 0.6742424242424242 * width, 0.9583333333333334 * height);
          ctx.bezierCurveTo(0.6742424242424242 * width, 0.9583333333333334 * height, 0.6666666666666666 * width, 0.9375 * height, 0.6666666666666666 * width, 0.9375 * height);
          ctx.bezierCurveTo(0.6666666666666666 * width, 0.9375 * height, 0.6666666666666666 * width, 0.8125 * height, 0.6666666666666666 * width, 0.8125 * height);
          ctx.bezierCurveTo(0.6666666666666666 * width, 0.8125 * height, 0.6742424242424242 * width, 0.7916666666666666 * height, 0.6742424242424242 * width, 0.7916666666666666 * height);
          ctx.bezierCurveTo(0.6742424242424242 * width, 0.7916666666666666 * height, 0.7954545454545454 * width, 0.7916666666666666 * height, 0.7954545454545454 * width, 0.7916666666666666 * height);
          ctx.bezierCurveTo(0.7954545454545454 * width, 0.7916666666666666 * height, 0.803030303030303 * width, 0.8125 * height, 0.803030303030303 * width, 0.8125 * height);
          ctx.bezierCurveTo(0.803030303030303 * width, 0.8125 * height, 0.803030303030303 * width, 0.8333333333333334 * height, 0.803030303030303 * width, 0.8333333333333334 * height);
          ctx.bezierCurveTo(0.803030303030303 * width, 0.8333333333333334 * height, 0.803030303030303 * width, 0.8333333333333334 * height, 0.8106060606060606 * width, 0.8333333333333334 * height);
          ctx.bezierCurveTo(0.8106060606060606 * width, 0.8333333333333334 * height, 0.8106060606060606 * width, 0.8541666666666666 * height, 0.8106060606060606 * width, 0.8541666666666666 * height);
          ctx.bezierCurveTo(0.8106060606060606 * width, 0.8541666666666666 * height, 0.8106060606060606 * width, 0.8958333333333334 * height, 0.8106060606060606 * width, 0.8958333333333334 * height);
          ctx.bezierCurveTo(0.8106060606060606 * width, 0.8958333333333334 * height, 0.8106060606060606 * width, 0.9166666666666666 * height, 0.8106060606060606 * width, 0.9166666666666666 * height);
          ctx.closePath();
          ctx.moveTo(0.7954545454545454 * width, 0.8333333333333334 * height);
          ctx.bezierCurveTo(0.7954545454545454 * width, 0.8125 * height, 0.7954545454545454 * width, 0.8125 * height, 0.7878787878787878 * width, 0.8125 * height);
          ctx.bezierCurveTo(0.7878787878787878 * width, 0.8125 * height, 0.6818181818181818 * width, 0.8125 * height, 0.6818181818181818 * width, 0.8125 * height);
          ctx.bezierCurveTo(0.6742424242424242 * width, 0.8125 * height, 0.6742424242424242 * width, 0.8125 * height, 0.6742424242424242 * width, 0.8333333333333334 * height);
          ctx.bezierCurveTo(0.6742424242424242 * width, 0.8333333333333334 * height, 0.6742424242424242 * width, 0.9166666666666666 * height, 0.6742424242424242 * width, 0.9166666666666666 * height);
          ctx.bezierCurveTo(0.6742424242424242 * width, 0.9375 * height, 0.6742424242424242 * width, 0.9375 * height, 0.6818181818181818 * width, 0.9375 * height);
          ctx.bezierCurveTo(0.6818181818181818 * width, 0.9375 * height, 0.7878787878787878 * width, 0.9375 * height, 0.7878787878787878 * width, 0.9375 * height);
          ctx.bezierCurveTo(0.7954545454545454 * width, 0.9375 * height, 0.7954545454545454 * width, 0.9375 * height, 0.7954545454545454 * width, 0.9166666666666666 * height);
          ctx.bezierCurveTo(0.7954545454545454 * width, 0.9166666666666666 * height, 0.7954545454545454 * width, 0.8333333333333334 * height, 0.7954545454545454 * width, 0.8333333333333334 * height);
          ctx.closePath();
          ctx.moveTo(0.6818181818181818 * width, 0.8333333333333334 * height);
          ctx.lineTo(0.7121212121212122 * width, 0.8333333333333334 * height);
          ctx.lineTo(0.7121212121212122 * width, 0.9166666666666666 * height);
          ctx.lineTo(0.6818181818181818 * width, 0.9166666666666666 * height);
          ctx.lineTo(0.6818181818181818 * width, 0.8333333333333334 * height);
          ctx.closePath();
          ctx.fill();
        } else if (battery === 'twothirds') {
          // 60%
          ctx.beginPath();
          ctx.moveTo(0.8106060606060606 * width, 0.9166666666666666 * height);
          ctx.bezierCurveTo(0.803030303030303 * width, 0.9166666666666666 * height, 0.803030303030303 * width, 0.9166666666666666 * height, 0.803030303030303 * width, 0.9166666666666666 * height);
          ctx.bezierCurveTo(0.803030303030303 * width, 0.9166666666666666 * height, 0.803030303030303 * width, 0.9375 * height, 0.803030303030303 * width, 0.9375 * height);
          ctx.bezierCurveTo(0.803030303030303 * width, 0.9375 * height, 0.7954545454545454 * width, 0.9583333333333334 * height, 0.7954545454545454 * width, 0.9583333333333334 * height);
          ctx.bezierCurveTo(0.7954545454545454 * width, 0.9583333333333334 * height, 0.6742424242424242 * width, 0.9583333333333334 * height, 0.6742424242424242 * width, 0.9583333333333334 * height);
          ctx.bezierCurveTo(0.6742424242424242 * width, 0.9583333333333334 * height, 0.6666666666666666 * width, 0.9375 * height, 0.6666666666666666 * width, 0.9375 * height);
          ctx.bezierCurveTo(0.6666666666666666 * width, 0.9375 * height, 0.6666666666666666 * width, 0.8125 * height, 0.6666666666666666 * width, 0.8125 * height);
          ctx.bezierCurveTo(0.6666666666666666 * width, 0.8125 * height, 0.6742424242424242 * width, 0.7916666666666666 * height, 0.6742424242424242 * width, 0.7916666666666666 * height);
          ctx.bezierCurveTo(0.6742424242424242 * width, 0.7916666666666666 * height, 0.7954545454545454 * width, 0.7916666666666666 * height, 0.7954545454545454 * width, 0.7916666666666666 * height);
          ctx.bezierCurveTo(0.7954545454545454 * width, 0.7916666666666666 * height, 0.803030303030303 * width, 0.8125 * height, 0.803030303030303 * width, 0.8125 * height);
          ctx.bezierCurveTo(0.803030303030303 * width, 0.8125 * height, 0.803030303030303 * width, 0.8333333333333334 * height, 0.803030303030303 * width, 0.8333333333333334 * height);
          ctx.bezierCurveTo(0.803030303030303 * width, 0.8333333333333334 * height, 0.803030303030303 * width, 0.8333333333333334 * height, 0.8106060606060606 * width, 0.8333333333333334 * height);
          ctx.bezierCurveTo(0.8106060606060606 * width, 0.8333333333333334 * height, 0.8106060606060606 * width, 0.8541666666666666 * height, 0.8106060606060606 * width, 0.8541666666666666 * height);
          ctx.bezierCurveTo(0.8106060606060606 * width, 0.8541666666666666 * height, 0.8106060606060606 * width, 0.8958333333333334 * height, 0.8106060606060606 * width, 0.8958333333333334 * height);
          ctx.bezierCurveTo(0.8106060606060606 * width, 0.8958333333333334 * height, 0.8106060606060606 * width, 0.9166666666666666 * height, 0.8106060606060606 * width, 0.9166666666666666 * height);
          ctx.closePath();
          ctx.moveTo(0.7954545454545454 * width, 0.8333333333333334 * height);
          ctx.bezierCurveTo(0.7954545454545454 * width, 0.8125 * height, 0.7954545454545454 * width, 0.8125 * height, 0.7878787878787878 * width, 0.8125 * height);
          ctx.bezierCurveTo(0.7878787878787878 * width, 0.8125 * height, 0.6818181818181818 * width, 0.8125 * height, 0.6818181818181818 * width, 0.8125 * height);
          ctx.bezierCurveTo(0.6742424242424242 * width, 0.8125 * height, 0.6742424242424242 * width, 0.8125 * height, 0.6742424242424242 * width, 0.8333333333333334 * height);
          ctx.bezierCurveTo(0.6742424242424242 * width, 0.8333333333333334 * height, 0.6742424242424242 * width, 0.9166666666666666 * height, 0.6742424242424242 * width, 0.9166666666666666 * height);
          ctx.bezierCurveTo(0.6742424242424242 * width, 0.9375 * height, 0.6742424242424242 * width, 0.9375 * height, 0.6818181818181818 * width, 0.9375 * height);
          ctx.bezierCurveTo(0.6818181818181818 * width, 0.9375 * height, 0.7878787878787878 * width, 0.9375 * height, 0.7878787878787878 * width, 0.9375 * height);
          ctx.bezierCurveTo(0.7954545454545454 * width, 0.9375 * height, 0.7954545454545454 * width, 0.9375 * height, 0.7954545454545454 * width, 0.9166666666666666 * height);
          ctx.bezierCurveTo(0.7954545454545454 * width, 0.9166666666666666 * height, 0.7954545454545454 * width, 0.8333333333333334 * height, 0.7954545454545454 * width, 0.8333333333333334 * height);
          ctx.closePath();
          ctx.moveTo(0.7196969696969697 * width, 0.8333333333333334 * height);
          ctx.lineTo(0.75 * width, 0.8333333333333334 * height);
          ctx.lineTo(0.75 * width, 0.9166666666666666 * height);
          ctx.lineTo(0.7196969696969697 * width, 0.9166666666666666 * height);
          ctx.lineTo(0.7196969696969697 * width, 0.8333333333333334 * height);
          ctx.closePath();
          ctx.moveTo(0.6818181818181818 * width, 0.8333333333333334 * height);
          ctx.lineTo(0.7121212121212122 * width, 0.8333333333333334 * height);
          ctx.lineTo(0.7121212121212122 * width, 0.9166666666666666 * height);
          ctx.lineTo(0.6818181818181818 * width, 0.9166666666666666 * height);
          ctx.lineTo(0.6818181818181818 * width, 0.8333333333333334 * height);
          ctx.closePath();
          ctx.fill();
        } else if (battery === 'full') {
          //battery_1
          ctx.beginPath();
          ctx.moveTo(0.8106060606060606 * width, 0.9166666666666666 * height);
          ctx.bezierCurveTo(0.803030303030303 * width, 0.9166666666666666 * height, 0.803030303030303 * width, 0.9166666666666666 * height, 0.803030303030303 * width, 0.9166666666666666 * height);
          ctx.bezierCurveTo(0.803030303030303 * width, 0.9166666666666666 * height, 0.803030303030303 * width, 0.9375 * height, 0.803030303030303 * width, 0.9375 * height);
          ctx.bezierCurveTo(0.803030303030303 * width, 0.9375 * height, 0.7954545454545454 * width, 0.9583333333333334 * height, 0.7954545454545454 * width, 0.9583333333333334 * height);
          ctx.bezierCurveTo(0.7954545454545454 * width, 0.9583333333333334 * height, 0.6742424242424242 * width, 0.9583333333333334 * height, 0.6742424242424242 * width, 0.9583333333333334 * height);
          ctx.bezierCurveTo(0.6742424242424242 * width, 0.9583333333333334 * height, 0.6666666666666666 * width, 0.9375 * height, 0.6666666666666666 * width, 0.9375 * height);
          ctx.bezierCurveTo(0.6666666666666666 * width, 0.9375 * height, 0.6666666666666666 * width, 0.8125 * height, 0.6666666666666666 * width, 0.8125 * height);
          ctx.bezierCurveTo(0.6666666666666666 * width, 0.8125 * height, 0.6742424242424242 * width, 0.7916666666666666 * height, 0.6742424242424242 * width, 0.7916666666666666 * height);
          ctx.bezierCurveTo(0.6742424242424242 * width, 0.7916666666666666 * height, 0.7954545454545454 * width, 0.7916666666666666 * height, 0.7954545454545454 * width, 0.7916666666666666 * height);
          ctx.bezierCurveTo(0.7954545454545454 * width, 0.7916666666666666 * height, 0.803030303030303 * width, 0.8125 * height, 0.803030303030303 * width, 0.8125 * height);
          ctx.bezierCurveTo(0.803030303030303 * width, 0.8125 * height, 0.803030303030303 * width, 0.8333333333333334 * height, 0.803030303030303 * width, 0.8333333333333334 * height);
          ctx.bezierCurveTo(0.803030303030303 * width, 0.8333333333333334 * height, 0.803030303030303 * width, 0.8333333333333334 * height, 0.8106060606060606 * width, 0.8333333333333334 * height);
          ctx.bezierCurveTo(0.8106060606060606 * width, 0.8333333333333334 * height, 0.8106060606060606 * width, 0.8541666666666666 * height, 0.8106060606060606 * width, 0.8541666666666666 * height);
          ctx.bezierCurveTo(0.8106060606060606 * width, 0.8541666666666666 * height, 0.8106060606060606 * width, 0.8958333333333334 * height, 0.8106060606060606 * width, 0.8958333333333334 * height);
          ctx.bezierCurveTo(0.8106060606060606 * width, 0.8958333333333334 * height, 0.8106060606060606 * width, 0.9166666666666666 * height, 0.8106060606060606 * width, 0.9166666666666666 * height);
          ctx.closePath();
          ctx.moveTo(0.7954545454545454 * width, 0.8333333333333334 * height);
          ctx.bezierCurveTo(0.7954545454545454 * width, 0.8125 * height, 0.7954545454545454 * width, 0.8125 * height, 0.7878787878787878 * width, 0.8125 * height);
          ctx.bezierCurveTo(0.7878787878787878 * width, 0.8125 * height, 0.6818181818181818 * width, 0.8125 * height, 0.6818181818181818 * width, 0.8125 * height);
          ctx.bezierCurveTo(0.6742424242424242 * width, 0.8125 * height, 0.6742424242424242 * width, 0.8125 * height, 0.6742424242424242 * width, 0.8333333333333334 * height);
          ctx.bezierCurveTo(0.6742424242424242 * width, 0.8333333333333334 * height, 0.6742424242424242 * width, 0.9166666666666666 * height, 0.6742424242424242 * width, 0.9166666666666666 * height);
          ctx.bezierCurveTo(0.6742424242424242 * width, 0.9375 * height, 0.6742424242424242 * width, 0.9375 * height, 0.6818181818181818 * width, 0.9375 * height);
          ctx.bezierCurveTo(0.6818181818181818 * width, 0.9375 * height, 0.7878787878787878 * width, 0.9375 * height, 0.7878787878787878 * width, 0.9375 * height);
          ctx.bezierCurveTo(0.7954545454545454 * width, 0.9375 * height, 0.7954545454545454 * width, 0.9375 * height, 0.7954545454545454 * width, 0.9166666666666666 * height);
          ctx.bezierCurveTo(0.7954545454545454 * width, 0.9166666666666666 * height, 0.7954545454545454 * width, 0.8333333333333334 * height, 0.7954545454545454 * width, 0.8333333333333334 * height);
          ctx.closePath();
          ctx.moveTo(0.7575757575757576 * width, 0.8333333333333334 * height);
          ctx.lineTo(0.7878787878787878 * width, 0.8333333333333334 * height);
          ctx.lineTo(0.7878787878787878 * width, 0.9166666666666666 * height);
          ctx.lineTo(0.7575757575757576 * width, 0.9166666666666666 * height);
          ctx.lineTo(0.7575757575757576 * width, 0.8333333333333334 * height);
          ctx.closePath();
          ctx.moveTo(0.7196969696969697 * width, 0.8333333333333334 * height);
          ctx.lineTo(0.75 * width, 0.8333333333333334 * height);
          ctx.lineTo(0.75 * width, 0.9166666666666666 * height);
          ctx.lineTo(0.7196969696969697 * width, 0.9166666666666666 * height);
          ctx.lineTo(0.7196969696969697 * width, 0.8333333333333334 * height);
          ctx.closePath();
          ctx.moveTo(0.6818181818181818 * width, 0.8333333333333334 * height);
          ctx.lineTo(0.7121212121212122 * width, 0.8333333333333334 * height);
          ctx.lineTo(0.7121212121212122 * width, 0.9166666666666666 * height);
          ctx.lineTo(0.6818181818181818 * width, 0.9166666666666666 * height);
          ctx.lineTo(0.6818181818181818 * width, 0.8333333333333334 * height);
          ctx.closePath();
          ctx.fill();
        }
      }
      
      if (alarmVisible) {
        ctx.beginPath();
        ctx.moveTo(0.3333333333333333 * width, 0.9166666666666666 * height);
        ctx.bezierCurveTo(0.3333333333333333 * width, 0.9375 * height, 0.32575757575757575 * width, 0.9375 * height, 0.32575757575757575 * width, 0.9375 * height);
        ctx.bezierCurveTo(0.3181818181818182 * width, 0.9375 * height, 0.3106060606060606 * width, 0.9375 * height, 0.3106060606060606 * width, 0.9166666666666666 * height);
        ctx.bezierCurveTo(0.3106060606060606 * width, 0.9166666666666666 * height, 0.3333333333333333 * width, 0.9166666666666666 * height, 0.3333333333333333 * width, 0.9166666666666666 * height);
        ctx.closePath();
        ctx.moveTo(0.3560606060606061 * width, 0.8958333333333334 * height);
        ctx.bezierCurveTo(0.3333333333333333 * width, 0.8541666666666666 * height, 0.3484848484848485 * width, 0.75 * height, 0.32575757575757575 * width, 0.75 * height);
        ctx.bezierCurveTo(0.32575757575757575 * width, 0.75 * height, 0.32575757575757575 * width, 0.75 * height, 0.32575757575757575 * width, 0.75 * height);
        ctx.bezierCurveTo(0.32575757575757575 * width, 0.75 * height, 0.32575757575757575 * width, 0.75 * height, 0.32575757575757575 * width, 0.75 * height);
        ctx.bezierCurveTo(0.29545454545454547 * width, 0.75 * height, 0.3106060606060606 * width, 0.8541666666666666 * height, 0.2878787878787879 * width, 0.8958333333333334 * height);
        ctx.bezierCurveTo(0.2878787878787879 * width, 0.8958333333333334 * height, 0.2878787878787879 * width, 0.8958333333333334 * height, 0.2878787878787879 * width, 0.8958333333333334 * height);
        ctx.bezierCurveTo(0.2878787878787879 * width, 0.8958333333333334 * height, 0.2878787878787879 * width, 0.8958333333333334 * height, 0.2878787878787879 * width, 0.8958333333333334 * height);
        ctx.bezierCurveTo(0.2878787878787879 * width, 0.8958333333333334 * height, 0.2878787878787879 * width, 0.8958333333333334 * height, 0.2878787878787879 * width, 0.8958333333333334 * height);
        ctx.bezierCurveTo(0.2878787878787879 * width, 0.8958333333333334 * height, 0.32575757575757575 * width, 0.8958333333333334 * height, 0.32575757575757575 * width, 0.8958333333333334 * height);
        ctx.bezierCurveTo(0.32575757575757575 * width, 0.8958333333333334 * height, 0.3560606060606061 * width, 0.8958333333333334 * height, 0.3560606060606061 * width, 0.8958333333333334 * height);
        ctx.bezierCurveTo(0.3560606060606061 * width, 0.8958333333333334 * height, 0.3560606060606061 * width, 0.8958333333333334 * height, 0.3560606060606061 * width, 0.8958333333333334 * height);
        ctx.bezierCurveTo(0.3560606060606061 * width, 0.8958333333333334 * height, 0.3560606060606061 * width, 0.8958333333333334 * height, 0.3560606060606061 * width, 0.8958333333333334 * height);
        ctx.bezierCurveTo(0.3560606060606061 * width, 0.8958333333333334 * height, 0.3560606060606061 * width, 0.8958333333333334 * height, 0.3560606060606061 * width, 0.8958333333333334 * height);
        ctx.closePath();
        ctx.fill();
      }

      if (signalVisible) {
        ctx.fillStyle = backgroundColor;
        ctx.beginPath();
        ctx.moveTo(0.015151515151515152 * width, 0.22916666666666666 * height);
        ctx.lineTo(0.015151515151515152 * width, 0.3541666666666667 * height);
        ctx.lineTo(0.030303030303030304 * width, 0.3541666666666667 * height);
        ctx.lineTo(0.030303030303030304 * width, 0.22916666666666666 * height);
        ctx.lineTo(0.015151515151515152 * width, 0.22916666666666666 * height);
        ctx.closePath();
        ctx.moveTo(0.015151515151515152 * width, 0.375 * height);
        ctx.lineTo(0.015151515151515152 * width, 0.5 * height);
        ctx.lineTo(0.030303030303030304 * width, 0.5 * height);
        ctx.lineTo(0.030303030303030304 * width, 0.375 * height);
        ctx.lineTo(0.015151515151515152 * width, 0.375 * height);
        ctx.closePath();
        ctx.moveTo(0.015151515151515152 * width, 0.5208333333333334 * height);
        ctx.lineTo(0.015151515151515152 * width, 0.6458333333333334 * height);
        ctx.lineTo(0.030303030303030304 * width, 0.6458333333333334 * height);
        ctx.lineTo(0.030303030303030304 * width, 0.5208333333333334 * height);
        ctx.lineTo(0.015151515151515152 * width, 0.5208333333333334 * height);
        ctx.closePath();
        ctx.moveTo(0.015151515151515152 * width, 0.6666666666666666 * height);
        ctx.lineTo(0.015151515151515152 * width, 0.7916666666666666 * height);
        ctx.lineTo(0.030303030303030304 * width, 0.7916666666666666 * height);
        ctx.lineTo(0.030303030303030304 * width, 0.6666666666666666 * height);
        ctx.lineTo(0.015151515151515152 * width, 0.6666666666666666 * height);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = foregroundColor;
        if (signalStrength > 0.13) {
          ctx.beginPath();
          ctx.moveTo(0.015151515151515152 * width, 0.6666666666666666 * height);
          ctx.lineTo(0.030303030303030304 * width, 0.6666666666666666 * height);
          ctx.lineTo(0.030303030303030304 * width, 0.7916666666666666 * height);
          ctx.lineTo(0.015151515151515152 * width, 0.7916666666666666 * height);
          ctx.lineTo(0.015151515151515152 * width, 0.6666666666666666 * height);
          ctx.closePath();
          ctx.fill();
        }
        if (signalStrength > 0.38) {
          ctx.beginPath();
          ctx.moveTo(0.015151515151515152 * width, 0.5208333333333334 * height);
          ctx.lineTo(0.030303030303030304 * width, 0.5208333333333334 * height);
          ctx.lineTo(0.030303030303030304 * width, 0.6458333333333334 * height);
          ctx.lineTo(0.015151515151515152 * width, 0.6458333333333334 * height);
          ctx.lineTo(0.015151515151515152 * width, 0.5208333333333334 * height);
          ctx.closePath();
          ctx.fill();
        }
        if (signalStrength > 0.63) {
          ctx.beginPath();
          ctx.moveTo(0.015151515151515152 * width, 0.375 * height);
          ctx.lineTo(0.030303030303030304 * width, 0.375 * height);
          ctx.lineTo(0.030303030303030304 * width, 0.5 * height);
          ctx.lineTo(0.015151515151515152 * width, 0.5 * height);
          ctx.lineTo(0.015151515151515152 * width, 0.375 * height);
          ctx.closePath();
          ctx.fill();
        }
        if (signalStrength > 0.88) {
          ctx.beginPath();
          ctx.moveTo(0.015151515151515152 * width, 0.22916666666666666 * height);
          ctx.lineTo(0.030303030303030304 * width, 0.22916666666666666 * height);
          ctx.lineTo(0.030303030303030304 * width, 0.3541666666666667 * height);
          ctx.lineTo(0.015151515151515152 * width, 0.3541666666666667 * height);
          ctx.lineTo(0.015151515151515152 * width, 0.22916666666666666 * height);
          ctx.closePath();
          ctx.fill();
        }
      }
    };

    var drawCrystalOverlay = function() {
      var ctx    = crystalBuffer.getContext("2d");
      var width  = crystalBuffer.width;
      var height = crystalBuffer.height;

      //crystal effect
      roundedRectangle(ctx, 2, 2, width - 4, height - 4, 0.0833333333 * height);
      ctx.clip();

      var darkNoise   = 'rgba(100, 100, 100, ';
      var brightNoise = 'rgba(200, 200, 200, ';
      var color;
      var noiseAlpha;
      for (var y = 0; y < height; y++) {
        for (var x = 0; x < width; x++) {
          color         = Math.floor(Math.random()) === 0 ? darkNoise : brightNoise;
          noiseAlpha    = clamp(0, 1, 0.04 + Math.random() * 0.08);
          ctx.fillStyle = color + noiseAlpha + ')';
          ctx.fillRect(x, y, 2, 2);
        }
      }
    };

    function clamp(min, max, value) {
      if (value < min)
        return min;
      if (value > max)
        return max;
      return value;
    }

    function roundedRectangle(ctx, x, y, w, h, radius) {
      var r = x + w,
          b = y + h;
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(r - radius, y);
      ctx.quadraticCurveTo(r, y, r, y + radius);
      ctx.lineTo(r, y + h - radius);
      ctx.quadraticCurveTo(r, b, r - radius, b);
      ctx.lineTo(x + radius, b);
      ctx.quadraticCurveTo(x, b, x, b - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
      ctx.stroke();
    }

    function onResize() {
      if (scalable) {
        width  = window.innerWidth * 0.98;
        height = width * aspectRatio; //window.innerHeight * 0.98;
      }

      canvas.width = width;
      canvas.height = height;

      lcdBuffer.width = width;
      lcdBuffer.height = height;
      textBuffer.width = width;
      textBuffer.height = height;
      iconsBuffer.width = width;
      iconsBuffer.height = height;
      crystalBuffer.width = width;
      crystalBuffer.height = height;

      drawLcd();
      drawText();
      drawIcons();
      if (crystalEffectVisible)
        drawCrystalOverlay();

      repaint();
    }

    function repaint() {
      mainCtx.clearRect(0, 0, canvas.width, canvas.height);
      mainCtx.drawImage(lcdBuffer, 0, 0);
      if (crystalEffectVisible) mainCtx.drawImage(crystalBuffer, 0, 0);
      mainCtx.drawImage(textBuffer, 0, 0);
      mainCtx.drawImage(iconsBuffer, 0, 0);
    }


    // ******************** public methods ************************************
    this.getUpperCenterText = function() { return upperCenterText; };
    this.setUpperCenterText = function(nUpperCenterText) {
      upperCenterText = nUpperCenterText;
      drawText();
      repaint();
    };

    this.isUpperCenterTextVisible = function() { return upperCenterTextVisible; };
    this.setUpperCenterTextVisible = function(nUpperCenterTextVisible) {
      upperCenterTextVisible = nUpperCenterTextVisible;
      drawText();
      repaint();
    };

    this.getUnit = function() { return unit; };
    this.setUnit = function(text) {
      unit = text;
      drawText();
      repaint();
    };

    this.isUnitVisible = function() { return unitVisible; };
    this.setUnitVisible = function(nUnitVisible) {
      unitVisible = nUnitVisible;
      drawText();
      repaint();
    };

    this.getLowerRightText = function() { return lowerRightText; };
    this.setLowerRightText = function(text) {
      lowerRightText = text;
      drawText();
      repaint();
    };

    this.isLowerRightTextVisible = function() { return lowerRightTextVisible; };
    this.setLowerRightTextVisible = function(nLowerRightTextVisible) {
      lowerRightTextVisible = nLowerRightTextVisible;
      drawText();
      repaint();
    };

    this.getMinValue = function() { return minValue; };
    this.setMinValue = function(nMinValue) {
      minValue = clamp(Number.MIN_VALUE, maxValue, nMinValue);
      drawText();
      repaint();
    };

    this.getMaxValue = function() { return maxValue; };
    this.setMaxValue = function(nMaxValue) {
      maxValue = clamp(minValue, Number.MAX_VALUE, nMaxValue);
      drawText();
      repaint();
    };

    this.getValue = function() {
      return value;
    };
    this.setValue = function(nValue) {
      var newValue = parseFloat(nValue);
      if (animated) {
        formerValue = value;
        if (formerValueVisible) { lowerCenterText = Number(value).toFixed(decimals); }
        var tween = new Tween(new Object(), '', Tween.regularEaseInOut, value, newValue, duration);
        tween.onMotionChanged = function(event) {
          value = event.target._pos;
          /*
          if (value < minMeasuredValue) {
            minMeasuredValue = value;
          }
          if (value > maxMeasuredValue) {
            maxMeasuredValue = value;
          }
          */
          showThreshold = value > threshold ? true : false;

          var delta = value - formerValue;
          if (delta >= 1.0) {
            trend = 'up';
          } else if (delta < 1.0 && delta > 0.1) {
            trend = 'rising';
          } else if (delta <= -1) {
            trend = 'down';
          } else if (delta > -1 && delta < -0.1) {
            trend = 'falling';
          } else {
            trend = 'steady';
          }
          drawText();
          drawIcons();

          repaint();
        };
        tween.onMotionFinished = function(event) {
          value = event.target._pos;
          if (value < minMeasuredValue) {
            minMeasuredValue = value;
          }
          if (value > maxMeasuredValue) {
            maxMeasuredValue = value;
          }
          drawText();
          repaint();
        };
        tween.start();
      } else {
        formerValue = value;
        if (formerValueVisible) { lowerCenterText = Number(value).toFixed(decimals); }
        value = newValue;
        if (value < minMeasuredValue) {
          minMeasuredValue = value;
        }
        if (value > maxMeasuredValue) {
          maxMeasuredValue = value;
        }
        thresholdVisible = value > threshold ? true : false;

        var delta = value - formerValue;
        if (delta >= 1.0) {
          trend = 'up';
        } else if (delta < 1.0 && delta > 0.1) {
          trend = 'rising';
        } else if (delta <= -1) {
          trend = 'down';
        } else if (delta > -1 && delta < -0.1) {
          trend = 'falling';
        } else {
          trend = 'steady';
        }
        drawText();
        drawIcons();

        repaint();
      }
    };

    this.getDecimals = function() { return decimals; };
    this.setDecimals = function(nDecimals) {
      decimals = clamp(0, 6, nDecimals);
      drawText();
      repaint();
    };

    this.getThreshold = function() { return threshold; };
    this.setThreshold = function(nThreshold) {
      threshold = clamp(minValue, maxValue, nThreshold);
      drawIcons();
      repaint();
    };

    this.istThresholdVisible = function() { return thresholdVisible; };
    this.setThresholdVisible = function(nThresholdVisible) {
      thresholdVisible = nThresholdVisible;
      drawIcons();
      repaint();
    };

    this.getUpperLeftText = function() { return upperLeftText; };
    this.setUpperLeftText = function(nUpperLeftText) {
      upperLeftText = nUpperLeftText;
      drawText();
      repaint();
    };
    
    this.isUpperLeftTextVisible = function() { return upperLeftTextVisible; };
    this.setUpperLeftTextVisible = function(nUpperLeftTextVisible) {
      upperLeftTextVisible = nUpperLeftTextVisible;
      drawText();
      repaint();
    };

    this.getUpperRightText = function() { return upperRightText; };
    this.setUpperRightText = function(nUpperRightText) {
      upperRightText = nUpperRightText;
      drawText();
      repaint();
    };

    this.isUpperRightTextVisible = function() { return upperRightTextVisible; };
    this.setUpperRightTextVisible = function(nUpperRightTextVisible) {
      upperRightTextVisible = nUpperRightTextVisible;
      drawText();
      repaint();
    };

    this.getLowerCenterText = function() { return lowerCenterText; };
    this.setLowerCenterText = function(nLowerCenterText) {
      lowerCenterText = nLowerCenterText;
      drawText();
      repaint();
    };

    this.isLowerCenterTextVisible = function() { return lowerCenterTextVisible; };
    this.setLowerCenterTextVisible = function(nLowerCenterTextVisible) {
      lowerCenterTextVisible = nLowerCenterTextVisible;
      drawText();
      repaint();
    };

    this.isFormerValueVisible = function() { return formerValueVisible; };
    this.setFormerValueVisible = function(nFormerValueVisible) {
      formerValueVisible = nFormerValueVisible;
      drawText();
      repaint();
    };

    this.getBattery = function() { return battery; };
    this.setBattery = function(nBattery) {
      battery = nBattery;
      drawIcons();
      repaint();
    };

    this.isBatteryVisible = function() { return batteryVisible; };
    this.setBatteryVisible = function(nBatteryVisible) {
      batteryVisible = nBatteryVisible;
      drawIcons();
      repaint();
    };

    this.getTrend = function() { return trend; };
    this.setTrend = function(nTrend) {
      trend = nTrend;
      drawIcons();
      repaint();
    };

    this.isTrendVisible = function() { return trendVisible; };
    this.setTrendVisible = function(nTrendVisible) {
      trendVisible = nTrendVisible;
      drawIcons();
      repaint();
    };

    this.isAlarmVisible = function() { return alarmVisible; };
    this.setAlarmVisible = function(nAlarmVisible) {
      alarmVisible = nAlarmVisible;
      drawIcons();
      repaint();
    };

    this.isSignalVisible = function() { return signalVisible; };
    this.setSignalVisible = function(nSignalVisible) {
      signalVisible = nSignalVisible;
      drawIcons();
      repaint();
    };

    this.getSignalStrength = function() { return signalStrength; };
    this.setSignalStrength = function(nSignalStrength) {
      signalStrength = clamp(0, 1, nSignalStrength);
      drawIcons();
      repaint();
    };

    this.isCrystalEffectVisible = function() { return crystalEffectVisible; };
    this.setCrystalEffectVisible = function(nCrystalEffectVisible) {
      crystalEffectVisible = nCrystalEffectVisible;
      drawLcd();
      repaint();
    };

    this.getWidth = function() { return width; };
    this.setWidth = function(nWidth) {
      width       = nWidth;
      aspectRatio = height / width;
      onResize();
    };

    this.getHeight = function() { return height; };
    this.setHeight = function(nHeight) {
      height      = nHeight;
      aspectRatio = height / width;
      onResize();
    };

    this.isScalable = function() { return scalable; };
    this.setScalable = function(nScalable) {
      scalable = nScalable;
      window.addEventListener("resize", onResize, false);
    };

    this.getDesign = function() { return design; };
    this.setDesign = function(nDesign) {
      design = nDesign;
      onResize();
    };

    this.isAnimated = function() { return animated; };
    this.setAnimated = function(nAnimated) { animated = nAnimated; };

    this.getDuration = function() { return duration; };
    this.setDuration = function(nDuration) {
      duration = clamp(0, 10, nDuration);
    };

    this.isForegroundShadowEnabled = function() { return foregroundShadowEnabled; };
    this.setForegroundShadowEnabled = function(nForegroundShadowEnabled) {
      foregroundShadowEnabled = nForegroundShadowEnabled;
      drawLcd();
      repaint();
    };

    this.getMinMeasuredValue = function() {
      return minMeasuredValue;
    };
    this.getMaxMeasuredValue = function() {
      return maxMeasuredValue;
    };
    this.resetMinMaxMeasuredValue = function() {
      minMeasuredValue = value;
      maxMeasuredValue = value;
      drawText();
      repaint();
    };

    this.setSize = function(newWidth, newHeight) {
      width = newWidth;
      height = newHeight;
      onResize();
    };

    this.update = function(newValue, newAbsMin, newAbsMax) {
      upperLeftText   = Number(newAbsMin).toFixed(decimals);
      upperRightText  = Number(newAbsMax).toFixed(decimals);
      if (formerValueVisible) { lowerCenterText = Number(value).toFixed(decimals); }
      formerValue     = value;
      value           = Number(newValue).toFixed(decimals);

      thresholdVisible = value > threshold ? true : false;

      var delta = value - formerValue;
      if (delta >= 1.0) {
        trend = 'up';
      } else if (delta < 1.0 && delta > 0.1) {
        trend = 'rising';
      } else if (delta <= -1) {
        trend = 'down';
      } else if (delta > -1 && delta < -0.1) {
        trend = 'falling';
      } else {
        trend = 'steady';
      }
      drawText();
      drawIcons();

      repaint();
    };

    // initial paint
    onResize();

    return this;
  };

  var led = function(parameters) {
    var doc          = document;
    var param        = parameters || {};
    var id           = param.id || 'control';
    var parentId     = param.parentId || 'body';
    var size         = param.size || 100;
    var scalable     = param.scalable === undefined ? false : param.scalable;
    var on           = param.on === undefined ? false : param.on;
    var frameVisible = param.frameVisible === undefined ? false : param.frameVisible;
    var color        = param.color || '#FF0000';

    if (scalable) { window.addEventListener("resize", onResize, false); }

    // Create the <canvas> element
    var canvas    = doc.createElement('canvas');
    canvas.id     = id;
    canvas.width  = size;
    canvas.height = size;
    parentId === 'body' ? doc.body.appendChild(canvas) : doc.getElementById(parentId).appendChild(canvas);

    // Get the <canvas> context and create all buffers
    var mainCtx          = doc.getElementById(id).getContext('2d');
    var backgroundBuffer = doc.createElement('canvas');
    var ledOffBuffer     = doc.createElement('canvas');
    var ledOnBuffer      = doc.createElement('canvas');
    var foregroundBuffer = doc.createElement('canvas');

    function onResize() {
      if (scalable) {
        size = window.innerWidth < window.innerHeight ? window.innerWidth : window.innerHeight;
      }

      canvas.width = size;
      canvas.height = size;

      backgroundBuffer.width = size;
      backgroundBuffer.height = size;
      ledOffBuffer.width = size;
      ledOffBuffer.height = size;
      ledOnBuffer.width = size;
      ledOnBuffer.height = size;
      foregroundBuffer.width = size;
      foregroundBuffer.height = size;

      mainCtx.canvas.width = canvas.width;
      mainCtx.canvas.height = canvas.height;

      drawBackground();
      drawLedOff();
      drawLedOn();
      drawForeground();

      repaint();
    }

    function repaint() {
      mainCtx.clearRect(0, 0, canvas.width, canvas.height);
      mainCtx.drawImage(backgroundBuffer, 0, 0);
      on ? mainCtx.drawImage(ledOnBuffer, 0, 0) : mainCtx.drawImage(ledOffBuffer, 0, 0);
      mainCtx.drawImage(foregroundBuffer, 0, 0);
    }

    var drawBackground = function() {
      var ctx = backgroundBuffer.getContext('2d');
      ctx.clearRect(0, 0, size, size);

      ctx.save();
      ctx.scale(1.0, 1);
      ctx.beginPath();
      ctx.arc(0.5 * size, 0.5 * size, 0.35 * size, 0, 2 * Math.PI, false);
      var frame = ctx.createLinearGradient(0.25 * size, 0.25 * size, 0.7379036790187178 * size, 0.7379036790187178 * size);
      frame.addColorStop(0.0, 'rgba(20, 20, 20, 0.6470588235)');
      frame.addColorStop(0.15, 'rgba(20, 20, 20, 0.6470588235)');
      frame.addColorStop(0.26, 'rgba(41, 41, 41, 0.6470588235)');
      frame.addColorStop(0.26009998, 'rgba(41, 41, 41, 0.6431372549)');
      frame.addColorStop(0.85, 'rgba(200, 200, 200, 0.4039215686)');
      frame.addColorStop(1.0, 'rgba(200, 200, 200, 0.3450980392)');
      ctx.fillStyle = frameVisible ? frame : 'transparent';
      ctx.fill();
      ctx.restore();
    };

    var drawLedOff = function() {
      var ctx = ledOffBuffer.getContext('2d');
      ctx.clearRect(0, 0, size, size);

      ctx.save();
      ctx.scale(1.0, 1);
      ctx.beginPath();
      ctx.arc(0.5 * size, 0.5 * size, 0.25 * size, 0, 2 * Math.PI, false);
      var ledOff = ctx.createLinearGradient(0.33 * size, 0.33 * size, 0.6694112549695429 * size, 0.6694112549695427 * size);
      ledOff.addColorStop(0.0, deriveHexColor(color, -0.8));
      ledOff.addColorStop(0.49, deriveHexColor(color, -0.9));
      ledOff.addColorStop(1.0, deriveHexColor(color, -0.8));
      ctx.fillStyle = ledOff;
      ctx.fill();
      ctx.restore();
      ctx.save();
      ctx.scale(1.0, 1);
      ctx.beginPath();
      ctx.arc(0.5 * size, 0.5 * size, 0.25 * size, 0, 2 * Math.PI, false);
      var innerShadow = ctx.createRadialGradient(0.5 * size, 0.5 * size, 0, 0.5 * size, 0.5 * size, 0.25 * size);
      innerShadow.addColorStop(0.0, 'rgba(0, 0, 0, 0)');
      innerShadow.addColorStop(0.85, 'rgba(0, 0, 0, 0)');
      innerShadow.addColorStop(0.86, 'rgba(0, 0, 0, 0.0235294118)');
      innerShadow.addColorStop(1.0, 'rgba(0, 0, 0, 0.4)');
      ctx.fillStyle = innerShadow;
      ctx.fill();
      ctx.restore();
    };

    var drawLedOn = function() {
      var ctx = ledOnBuffer.getContext('2d');
      ctx.clearRect(0, 0, size, size);

      ctx.save();
      ctx.scale(1.0, 1);
      ctx.beginPath();
      ctx.arc(0.5 * size, 0.5 * size, 0.25 * size, 0, 2 * Math.PI, false);
      var ledOn = ctx.createLinearGradient(0.33 * size, 0.33 * size, 0.6694112549695429 * size, 0.6694112549695427 * size);
      ledOn.addColorStop(0.0, deriveHexColor(color, -0.3));
      ledOn.addColorStop(0.49, deriveHexColor(color, -0.4));
      ledOn.addColorStop(1.0, deriveHexColor(color, 0.2));
      ctx.fillStyle = ledOn;
      ctx.fill();
      ctx.shadowOffsetX = 0.0 * size;
      ctx.shadowOffsetY = 0.0 * size;
      ctx.shadowColor = color;
      ctx.shadowBlur = 0.25 * size;
      ctx.fill();
      ctx.restore();
      ctx.save();
      ctx.scale(1.0, 1);
      ctx.beginPath();
      ctx.arc(0.5 * size, 0.5 * size, 0.25 * size, 0, 2 * Math.PI, false);
      var innerShadow = ctx.createRadialGradient(0.5 * size, 0.5 * size, 0, 0.5 * size, 0.5 * size, 0.25 * size);
      innerShadow.addColorStop(0.0, 'rgba(0, 0, 0, 0)');
      innerShadow.addColorStop(0.85, 'rgba(0, 0, 0, 0)');
      innerShadow.addColorStop(0.86, 'rgba(0, 0, 0, 0.0235294118)');
      innerShadow.addColorStop(1.0, 'rgba(0, 0, 0, 0.4)');
      ctx.fillStyle = innerShadow;
      ctx.fill();
      ctx.restore();
    };

    var drawForeground = function() {
      var ctx = foregroundBuffer.getContext('2d');
      ctx.clearRect(0, 0, size, size);

      ctx.save();
      ctx.scale(1.0, 1);
      ctx.beginPath();
      ctx.arc(0.5 * size, 0.5 * size, 0.2 * size, 0, 2 * Math.PI, false);
      var highlight = ctx.createRadialGradient(0.35 * size, 0.35 * size, 0, 0.35 * size, 0.35 * size, 0.205 * size);
      highlight.addColorStop(0.0, 'rgb(200, 194, 208)');
      highlight.addColorStop(1.0, 'rgba(200, 194, 208, 0)');
      ctx.fillStyle = highlight;
      ctx.fill();
      ctx.restore();
    };

    // Public methods
    this.getSize = function() {
      return size;
    };
    this.setSize = function(nSize) {
      size = nSize;
      onResize();
    };

    this.isScalable = function() { return scalable; };
    this.setScalable = function(nScalable) {
      scalable = nScalable;
      window.addEventListener("resize", onResize, false);
    };

    this.isOn = function() {
      return on;
    };
    this.setOn = function(nOn) {
      on = nOn;
      repaint();
    };

    this.isFrameVisible = function() {
      return frameVisible;
    };
    this.setFrameVisible = function(nFrameVisible) {
      frameVisible = nFrameVisible;
      repaint();
    };

    this.getColor = function() {
      return color;
    };
    this.setColor = function(nColor) {
      color = nColor;
      repaint();
    };

    // Initial paint
    onResize();

    return this;
  };

  var sevenSegment = function(parameters) {
    var doc         = document;
    var param       = parameters || {};
    var id          = param.id || 'control';
    var parentId    = param.parentId || 'body';
    var width       = param.width || 268;
    var height      = param.height || 357;
    var scalable    = param.scalable === undefined ? false : param.scalable;
    var char        = param.char === undefined ? '' : param.char;
    var dot         = param.dot === undefined ? false : param.dot;
    var color       = param.color === undefined ? '#FF0000' : param.color;
    var glow        = param.glow === undefined ? false : param.glow;
    var aspectRatio = 357 / 268;

    if (aspectRatio * width > height) {
      width  = 1 / (aspectRatio / height);
    } else if (1 / (aspectRatio / height) > width) {
      height = aspectRatio * width;
    }

    /*
     * Seven Segments
     *
     *         AAAAAAAAAAAAA
     *        F             B
     *        F             B
     *        F             B
     *        F             B
     *         GGGGGGGGGGGGG
     *        E             C
     *        E             C
     *        E             C
     *        E             C
     *         DDDDDDDDDDDDD
     *
     */

    // Bitmasks for 7 segments
    var a = 1 << 0, b = 1 << 1, c = 1 << 2,
        d = 1 << 3, e = 1 << 4, f = 1 << 5,
        g = 1 << 6;
    var mapping = {
      '0': a | b | c | d | e | f,
      '1': b | c,
      '2': a | b | d | e | g,
      '3': a | b | c | d | g,
      '4': b | c | f | g,
      '5': a | c | d | f | g,
      '6': a | c | d | e | f | g,
      '7': a | b | c,
      '8': a | b | c | d | e | f | g,
      '9': a | b | c | f | g,
      '-': g,
      'E': a | d | e | f | g,
      'a': c | d | e | g,
      'b': c | d | e | f | g,
      'c': d | e | g,
      'd': b | c | d | e | g,
      'f': a | e | f | g
    };

    if (scalable) { window.addEventListener("resize", onResize, false); }

    // Create the <canvas> element
    var canvas    = doc.createElement('canvas');
    canvas.id     = id;
    canvas.width  = width;
    canvas.height = height;
    parentId === 'body' ? doc.body.appendChild(canvas) : doc.getElementById(parentId).appendChild(canvas);

    // Get the <canvas> context and create all buffers
    var mainCtx          = doc.getElementById(id).getContext('2d');
    var backgroundBuffer = doc.createElement('canvas');

    function onResize() {
      if (scalable) {
        if (scalable) {
          width  = window.innerWidth * 0.98;
          height = width * aspectRatio; //window.innerHeight * 0.98;
        }
      }

      canvas.width  = width;
      canvas.height = height;

      backgroundBuffer.width  = width;
      backgroundBuffer.height = height;

      mainCtx.canvas.width  = canvas.width;
      mainCtx.canvas.height = canvas.height;

      drawBackground();

      repaint();
    }

    function repaint() {
      mainCtx.clearRect(0, 0, canvas.width, canvas.height);
      mainCtx.drawImage(backgroundBuffer, 0, 0);
    }

    var drawBackground = function() {
      var ctx = backgroundBuffer.getContext('2d');
      ctx.clearRect(0, 0, width, height);

      ctx.save();
      ctx.scale(1, 1);
      drawSegments(ctx, mapping[char] || []);
      ctx.restore();
    };

    var drawSegments = function(ctx, segments) {
      for (var segment = 0 ; segment < 7 ; segment++) {
        // Check for each bit in bitmask
        ctx.fillStyle = ((1 << segment & segments) != 0) ? color : deriveHexColor(color, -0.8);
        //var color = ((1 << segment & segments) != 0) ? 'on' : 'off';
        //console.log(isPowerOfTwo((1 << segment & segments)));
        // Draw segment
        ctx.save();
        if (glow && ctx.fillStyle === color) {
          var size          = width < height ? width : height;
          ctx.shadowOffsetX = 0.0 * size;
          ctx.shadowOffsetY = 0.0 * size;
          ctx.shadowColor   = color;
          ctx.shadowBlur    = 0.25 * size;
        }
        ctx.beginPath();
        switch(segment) {
          case 0: // a
            ctx.moveTo(0.11790393013100436 * width, 0.014925373134328358 * height);
            ctx.lineTo(0.11790393013100436 * width, 0.01791044776119403 * height);
            ctx.lineTo(0.1965065502183406 * width, 0.07164179104477612 * height);
            ctx.lineTo(0.8122270742358079 * width, 0.07164179104477612 * height);
            ctx.lineTo(0.8864628820960698 * width, 0.020895522388059702 * height);
            ctx.lineTo(0.8864628820960698 * width, 0.01791044776119403 * height);
            ctx.lineTo(0.8602620087336245 * width, 0.0 * height);
            ctx.lineTo(0.13973799126637554 * width, 0.0 * height);
            ctx.lineTo(0.11790393013100436 * width, 0.014925373134328358 * height);
            break;
          case 1: // b
            ctx.moveTo(0.8951965065502183 * width, 0.023880597014925373 * height);
            ctx.lineTo(0.9213973799126638 * width, 0.04477611940298507 * height);
            ctx.lineTo(0.9213973799126638 * width, 0.08358208955223881 * height);
            ctx.lineTo(0.8820960698689956 * width, 0.4626865671641791 * height);
            ctx.lineTo(0.8296943231441049 * width, 0.49850746268656715 * height);
            ctx.lineTo(0.777292576419214 * width, 0.4626865671641791 * height);
            ctx.lineTo(0.8209606986899564 * width, 0.07462686567164178 * height);
            ctx.lineTo(0.8951965065502183 * width, 0.023880597014925373 * height);
            break;
          case 2: // c
            ctx.moveTo(0.8296943231441049 * width, 0.5014925373134328 * height);
            ctx.lineTo(0.8777292576419214 * width, 0.5343283582089552 * height);
            ctx.lineTo(0.8296943231441049 * width, 0.9671641791044776 * height);
            ctx.lineTo(0.8078602620087336 * width, 0.982089552238806 * height);
            ctx.lineTo(0.7292576419213974 * width, 0.9253731343283582 * height);
            ctx.lineTo(0.7685589519650655 * width, 0.5432835820895522 * height);
            ctx.lineTo(0.8296943231441049 * width, 0.5014925373134328 * height);
            break;
          case 3: // d
            ctx.moveTo(0.7205240174672489 * width, 0.9283582089552239 * height);
            ctx.lineTo(0.1091703056768559 * width, 0.9283582089552239 * height);
            ctx.lineTo(0.039301310043668124 * width, 0.9761194029850746 * height);
            ctx.lineTo(0.039301310043668124 * width, 0.982089552238806 * height);
            ctx.lineTo(0.06550218340611354 * width, 1.0 * height);
            ctx.lineTo(0.7816593886462883 * width, 1.0 * height);
            ctx.lineTo(0.7991266375545851 * width, 0.9880597014925373 * height);
            ctx.lineTo(0.7991266375545851 * width, 0.982089552238806 * height);
            ctx.lineTo(0.7205240174672489 * width, 0.9283582089552239 * height);
            break;
          case 4: // e
            ctx.moveTo(0.03056768558951965 * width, 0.9761194029850746 * height);
            ctx.lineTo(0.0 * width, 0.9552238805970149 * height);
            ctx.lineTo(0.0 * width, 0.9164179104477612 * height);
            ctx.lineTo(0.043668122270742356 * width, 0.5373134328358209 * height);
            ctx.lineTo(0.09606986899563319 * width, 0.5014925373134328 * height);
            ctx.lineTo(0.14410480349344978 * width, 0.5373134328358209 * height);
            ctx.lineTo(0.10043668122270742 * width, 0.9253731343283582 * height);
            ctx.lineTo(0.03056768558951965 * width, 0.9761194029850746 * height);
            break;
          case 5: // f
            ctx.moveTo(0.1091703056768559 * width, 0.01791044776119403 * height);
            ctx.lineTo(0.18777292576419213 * width, 0.07462686567164178 * height);
            ctx.lineTo(0.15283842794759825 * width, 0.45671641791044776 * height);
            ctx.lineTo(0.09170305676855896 * width, 0.49850746268656715 * height);
            ctx.lineTo(0.043668122270742356 * width, 0.4626865671641791 * height);
            ctx.lineTo(0.08733624454148471 * width, 0.03283582089552239 * height);
            ctx.lineTo(0.1091703056768559 * width, 0.01791044776119403 * height);
            break;
          case 6: // g
            ctx.moveTo(0.7729257641921398 * width, 0.5373134328358209 * height);
            ctx.lineTo(0.8253275109170306 * width, 0.49850746268656715 * height);
            ctx.lineTo(0.7685589519650655 * width, 0.4626865671641791 * height);
            ctx.lineTo(0.1572052401746725 * width, 0.4626865671641791 * height);
            ctx.lineTo(0.10043668122270742 * width, 0.49850746268656715 * height);
            ctx.lineTo(0.1572052401746725 * width, 0.5373134328358209 * height);
            ctx.lineTo(0.7729257641921398 * width, 0.5373134328358209 * height);
            break;
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      ctx.fillStyle = dot ? color : deriveHexColor(color, -0.8);
      ctx.beginPath();
      ctx.arc(0.9301310043668122 * width, 0.9522388059701492 * height, 0.07423580786026202 * width, 0, 2 * Math.PI, false);
      ctx.closePath();
      ctx.fill();
    };

    var checkAspectRatio = function() {
      if (aspectRatio * width > height) {
        width  = 1 / (aspectRatio / height);
      } else if (1 / (aspectRatio / height) > width) {
        height = aspectRatio * width;
      }
    };

    // Public methods
    this.getWidth = function() { return width; };
    this.setWidth = function(nWidth) {
      width       = nWidth;
      aspectRatio = height / width;
      checkAspectRatio()
      onResize();
    };
    
    this.getHeight = function() { return height; };
    this.setHeight = function(nHeight) {
      height      = nHeight;
      aspectRatio = height / width;
      checkAspectRatio()
      onResize();
    };

    this.isScalable  = function() { return scalable; };
    this.setScalable = function(nScalable) {
      scalable = nScalable;
      window.addEventListener("resize", onResize, false);
    };

    this.getCharacter = function() { return char; };
    this.setCharacter = function(nChar) {
      char = nChar;
      drawBackground();
      repaint();
    };

    this.isDot  = function() { return dot; };
    this.setDot = function(nDot) {
      dot = nDot;
      drawBackground();
      repaint();
    };

    this.getColor = function() { return color; };
    this.setColor = function(nColor) {
      color = nColor;
      repaint();
    };

    this.isGlow  = function() { return glow; };
    this.setGlow = function(nGlow) {
      glow = nGlow;
      drawBackground();
      repaint();
    };

    // Initial paint
    onResize();

    return this;
  };

  var sixteenSegment = function(parameters) {
    var doc         = document;
    var param       = parameters || {};
    var id          = param.id || 'control';
    var parentId    = param.parentId || 'body';
    var width       = param.width || 268;
    var height      = param.height || 357;
    var scalable    = param.scalable === undefined ? false : param.scalable;
    var char        = param.char === undefined ? '' : param.char;
    var dot         = param.dot === undefined ? false : param.dot;
    var color       = param.color === undefined ? '#FF0000' : param.color;
    var glow        = param.glow === undefined ? false : param.glow;
    var aspectRatio = 357 / 268;

    if (aspectRatio * width > height) {
      width  = 1 / (aspectRatio / height);
    } else if (1 / (aspectRatio / height) > width) {
      height = aspectRatio * width;
    }

    /*
     * Sixteen Segments
     *
     *         A1A1A1 A2A2A2
     *        F G    H    I B
     *        F  G   H   I  B
     *        F   G  H  I   B
     *        F    G H I    B
     *         PPPPPP KKKKKK
     *        E    N M L    C
     *        E   N  M  L   C
     *        E  N   M   L  C
     *        E N    M    L C
     *         D1D1D1 D2D2D2
     *
     */

    // Bitmasks for 16 segments
    var a1 = 1 << 0,    a2 = 1 << 1,    b = 1 << 2,    c = 1 << 3,
        d2 = 1 << 4,    d1 = 1 << 5,    e = 1 << 6,    f = 1 << 7,
        g  = 1 << 8,    h  = 1 << 9,    i = 1 << 10,   k = 1 << 11,
        l  = 1 << 12,   m  = 1 << 13,   n = 1 << 14,   p = 1 << 15;
    var mapping = {
      // 0-9
      '0': a1 | a2 | b | c | d2 | d1 | e | f,
      '1': b | c,
      '2': a1 | a2 | b | d2 | d1 | e | p | k,
      '3': a1 | a2 | b | c | d2 | d1 | p | k,
      '4': b | c | f | p | k,
      '5': a1 | a2 | c | d2 | d1 | f | p | k,
      '6': a1 | a2 | c | d2 | d1 | e | f | p | k,
      '7': a1 | a2 | b | c,
      '8': a1 | a2 | b | c | d1 | d2 | e | f | p | k,
      '9': a1 | a2 | b | c | f | p | k,
      // * + , - . /
      '*': g | h | i | k| l | m | n | p,
      '+': h | k | m | p,
      ',': n,
      '-': p | k,
      '/': i | n,
      // A-Z
      'A': a1 | a2 | b | c | e | f | p | k,
      'B': a1 | a2 | b | c | d2 | d1 | h | m | k,
      'C': a1 | a2 | d2 | d1 | e | f,
      'D': a1 | a2 | b | c | d2 | d1 | h | m,
      'E': a1 | a2 | d2 | d1 | e | f | p | k,
      'F': a1 | a2 | e | f | p | k,
      'G': a1 | a2 | c | d2 | d1 | e | f | k,
      'H': b | c | e | f | p | k,
      'I': a1 | a2 | d2 | d1 | m | h,
      'J': b | c | d2 | d1 | e,
      'K': e | f | i | l | p,
      'L': d2 | d1 | e | f,
      'M': b | c | e | f | g | i,
      'N': b | c | e | f | g | l,
      'O': a1 | a2 | b | c | d2 | d1 | e | f,
      'P': a1 | a2 | b | e | f | p | k,
      'Q': a1 | a2 | b | c | d2 | d1 | e | f | l,
      'R': a1 | a2 | b | e | f | p | k | l,
      'S': a1 | a2 | c | d2 | d1 | g | k,
      'T': a1 | a2 | h | m,
      'U': b | c | d2 | d1 | e | f,
      'V': e | f | i | n,
      'W': b | c | e | f | l | n,
      'X': g | i | l | n,
      'Y': g | i | m,
      'Z': a1 | a2 | d2 | d1 | i | n
    };

    if (scalable) { window.addEventListener("resize", onResize, false); }

    // Create the <canvas> element
    var canvas    = doc.createElement('canvas');
    canvas.id     = id;
    canvas.width  = width;
    canvas.height = height;
    parentId === 'body' ? doc.body.appendChild(canvas) : doc.getElementById(parentId).appendChild(canvas);

    // Get the <canvas> context and create all buffers
    var mainCtx          = doc.getElementById(id).getContext('2d');
    var backgroundBuffer = doc.createElement('canvas');

    function onResize() {
      if (scalable) {
        if (scalable) {
          width  = window.innerWidth * 0.98;
          height = width * aspectRatio; //window.innerHeight * 0.98;
        }
      }

      canvas.width  = width;
      canvas.height = height;

      backgroundBuffer.width  = width;
      backgroundBuffer.height = height;

      mainCtx.canvas.width  = canvas.width;
      mainCtx.canvas.height = canvas.height;

      drawBackground();

      repaint();
    }

    function repaint() {
      mainCtx.clearRect(0, 0, canvas.width, canvas.height);
      mainCtx.drawImage(backgroundBuffer, 0, 0);
    }

    var drawBackground = function() {
      var ctx = backgroundBuffer.getContext('2d');
      ctx.clearRect(0, 0, width, height);

      ctx.save();
      ctx.scale(1, 1);
      drawSegments(ctx, mapping[char] || []);
      ctx.restore();
    };

    var drawSegments = function(ctx, segments) {
      for (var segment = 0 ; segment < 16 ; segment++) {
        // Check for each bit in bitmask
        ctx.fillStyle = ((1 << segment & segments) != 0) ? color : deriveHexColor(color, -0.8);
        //var color = ((1 << segment & segments) != 0) ? 'on' : 'off';
        //console.log(isPowerOfTwo((1 << segment & segments)));
        // Draw segment
        ctx.save();
        if (glow && ctx.fillStyle === color) {
          var size          = width < height ? width : height;
          ctx.shadowOffsetX = 0.0 * size;
          ctx.shadowOffsetY = 0.0 * size;
          ctx.shadowColor   = color;
          ctx.shadowBlur    = 0.25 * size;
        }
        ctx.beginPath();
        switch(segment) {
          case 0: // a1
            ctx.moveTo(0.11790393013100436 * width, 0.014925373134328358 * height);
            ctx.lineTo(0.13973799126637554 * width, 0.0 * height);
            ctx.lineTo(0.4497816593886463 * width, 0.0 * height);
            ctx.lineTo(0.4978165938864629 * width, 0.029850746268656716 * height);
            ctx.lineTo(0.4978165938864629 * width, 0.03582089552238806 * height);
            ctx.lineTo(0.4410480349344978 * width, 0.07164179104477612 * height);
            ctx.lineTo(0.1965065502183406 * width, 0.07164179104477612 * height);
            ctx.lineTo(0.11790393013100436 * width, 0.01791044776119403 * height);
            ctx.lineTo(0.11790393013100436 * width, 0.014925373134328358 * height);
            break;
          case 1: // a2
            ctx.moveTo(0.8864628820960698 * width, 0.01791044776119403 * height);
            ctx.lineTo(0.8602620087336245 * width, 0.0 * height);
            ctx.lineTo(0.5545851528384279 * width, 0.0 * height);
            ctx.lineTo(0.5021834061135371 * width, 0.029850746268656716 * height);
            ctx.lineTo(0.5021834061135371 * width, 0.03283582089552239 * height);
            ctx.lineTo(0.5589519650655022 * width, 0.07164179104477612 * height);
            ctx.lineTo(0.8122270742358079 * width, 0.07164179104477612 * height);
            ctx.lineTo(0.8864628820960698 * width, 0.020895522388059702 * height);
            ctx.lineTo(0.8864628820960698 * width, 0.01791044776119403 * height);
            break;
          case 2: // b
            ctx.moveTo(0.8951965065502183 * width, 0.023880597014925373 * height);
            ctx.lineTo(0.9213973799126638 * width, 0.04477611940298507 * height);
            ctx.lineTo(0.9213973799126638 * width, 0.08358208955223881 * height);
            ctx.lineTo(0.8820960698689956 * width, 0.4626865671641791 * height);
            ctx.lineTo(0.8296943231441049 * width, 0.49850746268656715 * height);
            ctx.lineTo(0.777292576419214 * width, 0.4626865671641791 * height);
            ctx.lineTo(0.8209606986899564 * width, 0.07462686567164178 * height);
            ctx.lineTo(0.8951965065502183 * width, 0.023880597014925373 * height);
            break;
          case 3: // c
            ctx.moveTo(0.8296943231441049 * width, 0.5014925373134328 * height);
            ctx.lineTo(0.8777292576419214 * width, 0.5343283582089552 * height);
            ctx.lineTo(0.8296943231441049 * width, 0.9671641791044776 * height);
            ctx.lineTo(0.8078602620087336 * width, 0.982089552238806 * height);
            ctx.lineTo(0.7292576419213974 * width, 0.9253731343283582 * height);
            ctx.lineTo(0.7685589519650655 * width, 0.5432835820895522 * height);
            ctx.lineTo(0.8296943231441049 * width, 0.5014925373134328 * height);
            break;
          case 4: // d2
            ctx.moveTo(0.7205240174672489 * width, 0.9283582089552239 * height);
            ctx.lineTo(0.7991266375545851 * width, 0.982089552238806 * height);
            ctx.lineTo(0.7991266375545851 * width, 0.9880597014925373 * height);
            ctx.lineTo(0.7816593886462883 * width, 1.0 * height);
            ctx.lineTo(0.47161572052401746 * width, 1.0 * height);
            ctx.lineTo(0.4279475982532751 * width, 0.9701492537313433 * height);
            ctx.lineTo(0.4279475982532751 * width, 0.9641791044776119 * height);
            ctx.lineTo(0.48034934497816595 * width, 0.9283582089552239 * height);
            ctx.lineTo(0.7205240174672489 * width, 0.9283582089552239 * height);
            break;
          case 5: // d1
            ctx.moveTo(0.3624454148471616 * width, 0.9283582089552239 * height);
            ctx.lineTo(0.4148471615720524 * width, 0.9641791044776119 * height);
            ctx.lineTo(0.4148471615720524 * width, 0.9701492537313433 * height);
            ctx.lineTo(0.36681222707423583 * width, 1.0 * height);
            ctx.lineTo(0.06550218340611354 * width, 1.0 * height);
            ctx.lineTo(0.039301310043668124 * width, 0.982089552238806 * height);
            ctx.lineTo(0.039301310043668124 * width, 0.9761194029850746 * height);
            ctx.lineTo(0.1091703056768559 * width, 0.9283582089552239 * height);
            ctx.lineTo(0.3624454148471616 * width, 0.9283582089552239 * height);
            break;
          case 6: // e
            ctx.moveTo(0.03056768558951965 * width, 0.9761194029850746 * height);
            ctx.lineTo(0.0 * width, 0.9552238805970149 * height);
            ctx.lineTo(0.0 * width, 0.9164179104477612 * height);
            ctx.lineTo(0.043668122270742356 * width, 0.5373134328358209 * height);
            ctx.lineTo(0.09606986899563319 * width, 0.5014925373134328 * height);
            ctx.lineTo(0.14410480349344978 * width, 0.5373134328358209 * height);
            ctx.lineTo(0.10043668122270742 * width, 0.9253731343283582 * height);
            ctx.lineTo(0.03056768558951965 * width, 0.9761194029850746 * height);
            break;
          case 7: // f
            ctx.moveTo(0.1091703056768559 * width, 0.01791044776119403 * height);
            ctx.lineTo(0.18777292576419213 * width, 0.07462686567164178 * height);
            ctx.lineTo(0.15283842794759825 * width, 0.45671641791044776 * height);
            ctx.lineTo(0.09170305676855896 * width, 0.49850746268656715 * height);
            ctx.lineTo(0.043668122270742356 * width, 0.4626865671641791 * height);
            ctx.lineTo(0.08733624454148471 * width, 0.03283582089552239 * height);
            ctx.lineTo(0.1091703056768559 * width, 0.01791044776119403 * height);
            break;
          case 8: // g
            ctx.moveTo(0.1965065502183406 * width, 0.07462686567164178 * height);
            ctx.lineTo(0.24017467248908297 * width, 0.11343283582089553 * height);
            ctx.lineTo(0.4104803493449782 * width, 0.3492537313432836 * height);
            ctx.lineTo(0.4497816593886463 * width, 0.48656716417910445 * height);
            ctx.lineTo(0.3406113537117904 * width, 0.41492537313432837 * height);
            ctx.lineTo(0.18340611353711792 * width, 0.19701492537313434 * height);
            ctx.lineTo(0.1965065502183406 * width, 0.07462686567164178 * height);
            break;
          case 9: // h
            ctx.moveTo(0.5021834061135371 * width, 0.041791044776119404 * height);
            ctx.lineTo(0.5502183406113537 * width, 0.07462686567164178 * height);
            ctx.lineTo(0.5414847161572053 * width, 0.14626865671641792 * height);
            ctx.lineTo(0.519650655021834 * width, 0.34328358208955223 * height);
            ctx.lineTo(0.4585152838427948 * width, 0.4955223880597015 * height);
            ctx.lineTo(0.4148471615720524 * width, 0.3492537313432836 * height);
            ctx.lineTo(0.44541484716157204 * width, 0.07462686567164178 * height);
            ctx.lineTo(0.5021834061135371 * width, 0.041791044776119404 * height);
            break;
          case 10: // i
            ctx.moveTo(0.8122270742358079 * width, 0.07462686567164178 * height);
            ctx.lineTo(0.8034934497816594 * width, 0.1880597014925373 * height);
            ctx.lineTo(0.5982532751091703 * width, 0.4 * height);
            ctx.lineTo(0.47161572052401746 * width, 0.48656716417910445 * height);
            ctx.lineTo(0.5327510917030568 * width, 0.33432835820895523 * height);
            ctx.lineTo(0.7379912663755459 * width, 0.12238805970149254 * height);
            ctx.lineTo(0.8122270742358079 * width, 0.07462686567164178 * height);
            break;
          case 11: // k
            ctx.moveTo(0.462882096069869 * width, 0.49850746268656715 * height);
            ctx.lineTo(0.5152838427947598 * width, 0.4626865671641791 * height);
            ctx.lineTo(0.7685589519650655 * width, 0.4626865671641791 * height);
            ctx.lineTo(0.8253275109170306 * width, 0.49850746268656715 * height);
            ctx.lineTo(0.7729257641921398 * width, 0.5373134328358209 * height);
            ctx.lineTo(0.519650655021834 * width, 0.5373134328358209 * height);
            ctx.lineTo(0.462882096069869 * width, 0.49850746268656715 * height);
            break;
          case 12: // l
            ctx.moveTo(0.7248908296943232 * width, 0.9253731343283582 * height);
            ctx.lineTo(0.7248908296943232 * width, 0.9104477611940298 * height);
            ctx.lineTo(0.7336244541484717 * width, 0.8238805970149253 * height);
            ctx.lineTo(0.7336244541484717 * width, 0.8 * height);
            ctx.lineTo(0.5764192139737991 * width, 0.5850746268656717 * height);
            ctx.lineTo(0.47161572052401746 * width, 0.5134328358208955 * height);
            ctx.lineTo(0.5065502183406113 * width, 0.6447761194029851 * height);
            ctx.lineTo(0.6855895196506551 * width, 0.8865671641791045 * height);
            ctx.lineTo(0.7248908296943232 * width, 0.9253731343283582 * height);
            break;
          case 13: // m
            ctx.moveTo(0.4192139737991266 * width, 0.9611940298507463 * height);
            ctx.lineTo(0.37117903930131 * width, 0.9283582089552239 * height);
            ctx.lineTo(0.37117903930131 * width, 0.8925373134328358 * height);
            ctx.lineTo(0.39737991266375544 * width, 0.6567164179104478 * height);
            ctx.lineTo(0.462882096069869 * width, 0.5044776119402985 * height);
            ctx.lineTo(0.5065502183406113 * width, 0.6477611940298508 * height);
            ctx.lineTo(0.4759825327510917 * width, 0.9253731343283582 * height);
            ctx.lineTo(0.4192139737991266 * width, 0.9611940298507463 * height);
            break;
          case 14: // n
            ctx.moveTo(0.1091703056768559 * width, 0.9253731343283582 * height);
            ctx.lineTo(0.11790393013100436 * width, 0.808955223880597 * height);
            ctx.lineTo(0.2314410480349345 * width, 0.6955223880597015 * height);
            ctx.lineTo(0.31877729257641924 * width, 0.6 * height);
            ctx.lineTo(0.4497816593886463 * width, 0.5134328358208955 * height);
            ctx.lineTo(0.3930131004366812 * width, 0.6507462686567164 * height);
            ctx.lineTo(0.3799126637554585 * width, 0.6716417910447762 * height);
            ctx.lineTo(0.18340611353711792 * width, 0.8776119402985074 * height);
            ctx.lineTo(0.1091703056768559 * width, 0.9253731343283582 * height);
            break;
          case 15: // p
            ctx.moveTo(0.10043668122270742 * width, 0.49850746268656715 * height);
            ctx.lineTo(0.1572052401746725 * width, 0.4626865671641791 * height);
            ctx.lineTo(0.40611353711790393 * width, 0.4626865671641791 * height);
            ctx.lineTo(0.4585152838427948 * width, 0.49850746268656715 * height);
            ctx.lineTo(0.4017467248908297 * width, 0.5373134328358209 * height);
            ctx.lineTo(0.1572052401746725 * width, 0.5373134328358209 * height);
            ctx.lineTo(0.10043668122270742 * width, 0.49850746268656715 * height);
            break;
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      ctx.fillStyle = dot ? color : deriveHexColor(color, -0.8);
      ctx.beginPath();
      ctx.arc(0.9301310043668122 * width, 0.9522388059701492 * height, 0.07423580786026202 * width, 0, 2 * Math.PI, false);
      ctx.closePath();
      ctx.fill();
    };

    var checkAspectRatio = function() {
      if (aspectRatio * width > height) {
        width  = 1 / (aspectRatio / height);
      } else if (1 / (aspectRatio / height) > width) {
        height = aspectRatio * width;
      }
    };

    // Public methods
    this.getWidth = function() { return width; };
    this.setWidth = function(nWidth) {
      width       = nWidth;
      aspectRatio = height / width;
      checkAspectRatio()
      onResize();
    };

    this.getHeight = function() { return height; };
    this.setHeight = function(nHeight) {
      height      = nHeight;
      aspectRatio = height / width;
      checkAspectRatio()
      onResize();
    };

    this.isScalable  = function() { return scalable; };
    this.setScalable = function(nScalable) {
      scalable = nScalable;
      window.addEventListener("resize", onResize, false);
    };

    this.getCharacter = function() { return char; };
    this.setCharacter = function(nChar) {
      char = nChar;
      drawBackground();
      repaint();
    };

    this.isDot  = function() { return dot; };
    this.setDot = function(nDot) {
      dot = nDot;
      drawBackground();
      repaint();
    };

    this.getColor = function() { return color; };
    this.setColor = function(nColor) {
      color = nColor;
      repaint();
    };

    this.isGlow  = function() { return glow; };
    this.setGlow = function(nGlow) {
      glow = nGlow;
      drawBackground();
      repaint();
    };

    // Initial paint
    onResize();

    return this;
  };

  // Tools
  var point = function(parameters) {
    var param  = parameters || {};
    this.start = param.x || 0;
    this.stop  = param.y || 0;
  };
  point.prototype = {
    getX       : function() { return this.x; },
    setX       : function(x) { this.x = x; },
    getY       : function() { return this.y; },
    setY       : function(y) { this.y = y; },
    distanceTo : function(point) {
      return Math.sqrt(((this.x - point.getX()) * (this.x - point.getX())) + ((this.y - point.getY()) * (this.y - point.getY())));
    }
  };

  var section = function(parameters) {
    var param  = parameters || {};
    this.start = param.start || 0;
    this.stop  = param.stop || 0;
    this.text  = param.text || '';
    this.color = param.color || 'rgb(200, 100, 0)';
    this.image = param.image || '';
  };
  section.prototype = {
    getStart : function() {
      return this.start;
    },
    setStart : function(start) {
      this.start = start;
    },
    getStop  : function() {
      return this.stop;
    },
    setStop  : function(stop) {
      this.stop = stop;
    },
    getColor : function() {
      return this.color;
    },
    setColor : function(color) {
      this.color = color;
    },
    getImage : function() {
      return this.image;
    },
    setImage : function(image) {
      this.image = image;
    },
    contains : function(value) {
      return (value >= this.start && value <= this.stop);
    }
  };

  var marker = function(parameters) {
    var param = parameters || {};
    this.value = param.value || 0;
    this.text = param.text || '';
    this.color = param.color || 'rgb(255, 0, 0)';
    this.exceeded = false;
  };
  marker.prototype = {
    getValue: function() {
      return this.value;
    },
    setValue: function(value) {
      this.value = value;
    },
    getText: function() {
      return this.text;
    },
    setText: function(text) {
      this.text = text;
    },
    getColor: function() {
      return this.color;
    },
    setColor: function(color) {
      this.color = color;
    }
  };

  var color = function(parameters) {
    var param = parameters || {};
    this.red = param.red || 0;
    this.green = param.green || 0;
    this.blue = param.blue || 0;
    this.opacity = param.opacity || 1;
  };
  color.prototype = {
    getRed: function() {
      return this.red;
    },
    setRed: function(red) {
      this.red = red;
    },
    getGreen: function() {
      return this.green;
    },
    setGreen: function(green) {
      this.green = green;
    },
    getBlue: function() {
      return this.blue;
    },
    setBlue: function(blue) {
      this.blue = blue;
    },
    getOpacity: function() {
      return this.opacity;
    },
    setOpacity: function(opacity) {
      this.opacity = opacity;
    },
    get: function() {
      return this;
    },
    getRgb: function() {
      return 'rgb(' + this.red + ',' + this.green + ',' + this.blue + ')'
    },
    getArgb: function() {
      return 'argb(' + this.opacity + ',' + this.red + ',' + this.green + ',' + this.blue + ')'
    }
  };

  var stop = function(parameters) {
    var param = parameters || {};
    this.offset = param.offset || 0;
    this.color = param.color || new enzo.Color();
  };
  stop.prototype = {
    getOffset: function() {
      return this.offset;
    },
    setOffset: function(offset) {
      this.offset = offset;
    },
    getColor: function() {
      return this.color;
    },
    setColor: function(color) {
      this.color = color;
    }
  };

  var gradientLookup = function(stops) {
    this.stops = stops;
  };
  gradientLookup.prototype = {
    getColorAt: function(positionOfColor) {
      var position = positionOfColor < 0 ? 0 : (positionOfColor > 1 ? 1 : positionOfColor);
      var color;
      if (this.stops.length === 1) {
        if (this.stops[0].stop === undefined)
          return new enzo.Color();
        color = this.stops[0].stop.getColor().get();
      } else {
        var lowerBound = this.stops[0].stop;
        var upperBound = this.stops[this.stops.length - 1].stop;
        for (var i = 0; i < this.stops.length; i++) {
          var offset = this.stops[i].stop.getOffset();
          if (offset < position) {
            lowerBound = this.stops[i].stop;
          }
          if (offset > position) {
            upperBound = this.stops[i].stop;
            break;
          }
        }
        color = this.interpolateColor(lowerBound, upperBound, position);
      }
      return color;
    },
    interpolateColor: function(lowerBound, upperBound, position) {
      var pos = (position - lowerBound.getOffset()) / (upperBound.getOffset() - lowerBound.getOffset());

      var deltaRed = (upperBound.getColor().getRed() - lowerBound.getColor().getRed()) * 0.00392 * pos;
      var deltaGreen = (upperBound.getColor().getGreen() - lowerBound.getColor().getGreen()) * 0.00392 * pos;
      var deltaBlue = (upperBound.getColor().getBlue() - lowerBound.getColor().getBlue()) * 0.00392 * pos;
      var deltaOpacity = (upperBound.getColor().getOpacity() - lowerBound.getColor().getOpacity()) * pos;

      var red = parseInt((lowerBound.getColor().getRed() * 0.00392 + deltaRed) * 255);
      var green = parseInt((lowerBound.getColor().getGreen() * 0.00392 + deltaGreen) * 255);
      var blue = parseInt((lowerBound.getColor().getBlue() * 0.00392 + deltaBlue) * 255);
      var opacity = lowerBound.getColor().getOpacity() + deltaOpacity;

      red = red < 0 ? 0 : (red > 255 ? 255 : red);
      green = green < 0 ? 0 : (green > 255 ? 255 : green);
      blue = blue < 0 ? 0 : (blue > 255 ? 255 : blue);
      opacity = opacity < 0 ? 0 : (opacity > 255 ? 255 : opacity);

      return new enzo.Color({red: red, green: green, blue: blue, opacity: opacity});
    }
  };

  function deriveColor(color, offset) {
    if (offset < 0)
      offset = 0;
    if (offset > 100)
      offset = 100;
  }

  function deriveColor(color, percent) {
    var num;
    if (color.indexOf('#') > -1) {
      num = parseInt(color.slice(1), 16);
    } else {
      num = parseInt(color, 16);
    }
    var amt = Math.round(2.55 * percent);
    var R = (num >> 16) + amt;
    var G = (num >> 8 & 0x00FF) + amt;
    var B = (num & 0x0000FF) + amt;

    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 + (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  }

  function deriveHexColor(hex, percent) {
    // validate hex string
    hex = String(hex).replace(/[^0-9a-f]/gi, '');
    if (hex.length < 6) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    percent = percent || 0;

    // convert to decimal and change luminosity
    var rgb = "#", c, i;
    for (i = 0; i < 3; i++) {
      c = parseInt(hex.substr(i * 2, 2), 16);
      c = Math.round(Math.min(Math.max(0, c + (c * percent)), 255)).toString(16);
      rgb += ("00" + c).substr(c.length);
    }
    return rgb;
  }

  function getSmoothingOffset(calculatedLineWidth) {
    var translate = (size * 0.0055 % 2) / 2;
    // To get crisp drawings do
    // ctx.translate(translate, translate);
    // before drawing lines
    // and
    // ctx.translate(-translate, -translate);
    // when finished drawing
    return translate;
  }

  Math.radians = function(degrees) { return degrees * Math.PI / 180; };
  Math.degrees = function(radians) { return radians * 180 / Math.PI; };

  // Tweening functionality
  function Delegate() {}
  Delegate.create = function(o, f) {
    var a = new Array();
    var l = arguments.length;
    for (var i = 2; i < l; i++)
      a[i - 2] = arguments[i];
    return function() {
      var aP = [ ].concat(arguments, a);
      f.apply(o, aP);
    };
  };

  var Tween = function(obj, prop, func, begin, finish, duration, suffixe) {
    this.init(obj, prop, func, begin, finish, duration, suffixe);
  };
  var t = Tween.prototype;

  t.obj = new Object();
  t.prop = '';
  t.func = function(t, b, c, d) {
    return c * t / d + b;
  };
  t.begin = 0;
  t.change = 0;
  t.prevTime = 0;
  t.prevPos = 0;
  t.looping = false;
  t._duration = 0;
  t._time = 0;
  t._pos = 0;
  t._position = 0;
  t._startTime = 0;
  t._finish = 0;
  t.name = '';
  t.suffixe = '';
  t._listeners = new Array();
  t.setTime = function(t) {
    this.prevTime = this._time;
    if (t > this.getDuration()) {
      if (this.looping) {
        this.rewind(t - this._duration);
        this.update();
        this.broadcastMessage('onMotionLooped', {target: this, type: 'onMotionLooped'});
      } else {
        this._time = this._duration;
        this.update();
        this.stop();
        this.broadcastMessage('onMotionFinished', {target: this, type: 'onMotionFinished'});
      }
    } else if (t < 0) {
      this.rewind();
      this.update();
    } else {
      this._time = t;
      this.update();
    }
  };
  t.getTime = function() {
    return this._time;
  };
  t.setDuration = function(d) {
    this._duration = (d === null || d <= 0) ? 100000 : d;
  };
  t.getDuration = function() {
    return this._duration;
  };
  t.setPosition = function(p) {
    this.prevPos = this._pos;
    var a = this.suffixe !== '' ? this.suffixe : '';
    this.obj[this.prop] = Math.round(p) + a;
    this._pos = p;
    this.broadcastMessage('onMotionChanged', {target: this, type: 'onMotionChanged'});
  };
  t.getPosition = function(t) {
    if (t === undefined)
      t = this._time;
    return this.func(t, this.begin, this.change, this._duration);
  };
  t.setFinish = function(f) {
    this.change = f - this.begin;
  };
  t.getFinish = function() {
    return this.begin + this.change;
  };
  t.init = function(obj, prop, func, begin, finish, duration, suffixe) {
    if (!arguments.length)
      return;
    this._listeners = new Array();
    this.addListener(this);
    if (suffixe)
      this.suffixe = suffixe;
    this.obj = obj;
    this.prop = prop;
    this.begin = begin;
    this._pos = begin;
    this.setDuration(duration);
    if (func !== null && func !== '') {
      this.func = func;
    }
    this.setFinish(finish);
  };
  t.start = function() {
    this.rewind();
    this.startEnterFrame();
    this.broadcastMessage('onMotionStarted', {target: this, type: 'onMotionStarted'});
    //alert('in');
  };
  t.rewind = function(t) {
    this.stop();
    this._time = (t === undefined) ? 0 : t;
    this.fixTime();
    this.update();
  };
  t.fforward = function() {
    this._time = this._duration;
    this.fixTime();
    this.update();
  };
  t.update = function() {
    this.setPosition(this.getPosition(this._time));
  };
  t.startEnterFrame = function() {
    this.stopEnterFrame();
    this.isPlaying = true;
    this.onEnterFrame();
  };
  t.onEnterFrame = function() {
    if (this.isPlaying) {
      this.nextFrame();
      // To get real smooth movement you have to set the timeout to 0 instead of 25
      setTimeout(Delegate.create(this, this.onEnterFrame), 25);
    }
  };
  t.nextFrame = function() {
    this.setTime((this.getTimer() - this._startTime) / 1000);
  };
  t.stop = function() {
    this.stopEnterFrame();
    this.broadcastMessage('onMotionStopped', {target: this, type: 'onMotionStopped'});
  };
  t.stopEnterFrame = function() {
    this.isPlaying = false;
  };

  t.playing = function() {
    return isPlaying();
  };

  t.continueTo = function(finish, duration) {
    this.begin = this._pos;
    this.setFinish(finish);
    if (this._duration !== undefined)
      this.setDuration(duration);
    this.start();
  };
  t.resume = function() {
    this.fixTime();
    this.startEnterFrame();
    this.broadcastMessage('onMotionResumed', {target: this, type: 'onMotionResumed'});
  };
  t.yoyo = function() {
    this.continueTo(this.begin, this._time);
  };

  t.addListener = function(o) {
    this.removeListener(o);
    return this._listeners.push(o);
  };
  t.removeListener = function(o) {
    var a = this._listeners;
    var i = a.length;
    while (i--) {
      if (a[i] === o) {
        a.splice(i, 1);
        return true;
      }
    }
    return false;
  };
  t.broadcastMessage = function() {
    var arr = new Array();
    for (var i = 0; i < arguments.length; i++) {
      arr.push(arguments[i]);
    }
    var e = arr.shift();
    var a = this._listeners;
    var l = a.length;
    for (var i = 0; i < l; i++) {
      if (a[i][e])
        a[i][e].apply(a[i], arr);
    }
  };
  t.fixTime = function() {
    this._startTime = this.getTimer() - this._time * 1000;
  };
  t.getTimer = function() {
    return new Date().getTime() - this._time;
  };
  Tween.backEaseIn = function(t, b, c, d, a, p) {
    if (s === undefined)
      var s = 1.70158;
    return c * (t /= d) * t * ((s + 1) * t - s) + b;
  };
  Tween.backEaseOut = function(t, b, c, d, a, p) {
    if (s === undefined)
      var s = 1.70158;
    return c * ((t = t / d - 1) * t * ((s + 1) * t + s) + 1) + b;
  };
  Tween.backEaseInOut = function(t, b, c, d, a, p) {
    if (s === undefined)
      var s = 1.70158;
    if ((t /= d / 2) < 1)
      return c / 2 * (t * t * (((s *= (1.525)) + 1) * t - s)) + b;
    return c / 2 * ((t -= 2) * t * (((s *= (1.525)) + 1) * t + s) + 2) + b;
  };
  Tween.elasticEaseIn = function(t, b, c, d, a, p) {
    if (t === 0)
      return b;
    if ((t /= d) === 1)
      return b + c;
    if (!p)
      p = d * .3;
    if (!a || a < Math.abs(c)) {
      a = c;
      var s = p / 4;
    } else
      var s = p / (2 * Math.PI) * Math.asin(c / a);

    return -(a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p)) + b;

  };
  Tween.elasticEaseOut = function(t, b, c, d, a, p) {
    if (t === 0)
      return b;
    if ((t /= d) === 1)
      return b + c;
    if (!p)
      p = d * .3;
    if (!a || a < Math.abs(c)) {
      a = c;
      var s = p / 4;
    } else
      var s = p / (2 * Math.PI) * Math.asin(c / a);
    return (a * Math.pow(2, -10 * t) * Math.sin((t * d - s) * (2 * Math.PI) / p) + c + b);
  };
  Tween.elasticEaseInOut = function(t, b, c, d, a, p) {
    if (t === 0)
      return b;
    if ((t /= d / 2) === 2)
      return b + c;
    if (!p)
      var p = d * (.3 * 1.5);
    if (!a || a < Math.abs(c)) {
      var a = c;
      var s = p / 4;
    } else
      var s = p / (2 * Math.PI) * Math.asin(c / a);
    if (t < 1)
      return -.5 * (a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p)) + b;
    return a * Math.pow(2, -10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p) * .5 + c + b;
  };

  Tween.bounceEaseOut = function(t, b, c, d) {
    if ((t /= d) < (1 / 2.75)) {
      return c * (7.5625 * t * t) + b;
    } else if (t < (2 / 2.75)) {
      return c * (7.5625 * (t -= (1.5 / 2.75)) * t + .75) + b;
    } else if (t < (2.5 / 2.75)) {
      return c * (7.5625 * (t -= (2.25 / 2.75)) * t + .9375) + b;
    } else {
      return c * (7.5625 * (t -= (2.625 / 2.75)) * t + .984375) + b;
    }
  };
  Tween.bounceEaseIn = function(t, b, c, d) {
    return c - Tween.bounceEaseOut(d - t, 0, c, d) + b;
  };
  Tween.bounceEaseInOut = function(t, b, c, d) {
    if (t < d / 2)
      return Tween.bounceEaseIn(t * 2, 0, c, d) * .5 + b;
    else
      return Tween.bounceEaseOut(t * 2 - d, 0, c, d) * .5 + c * .5 + b;
  };

  Tween.strongEaseInOut = function(t, b, c, d) {
    return c * (t /= d) * t * t * t * t + b;
  };

  Tween.regularEaseIn = function(t, b, c, d) {
    return c * (t /= d) * t + b;
  };
  Tween.regularEaseOut = function(t, b, c, d) {
    return -c * (t /= d) * (t - 2) + b;
  };

  Tween.regularEaseInOut = function(t, b, c, d) {
    if ((t /= d / 2) < 1)
      return c / 2 * t * t + b;
    return -c / 2 * ((--t) * (t - 2) - 1) + b;
  };
  Tween.strongEaseIn = function(t, b, c, d) {
    return c * (t /= d) * t * t * t * t + b;
  };
  Tween.strongEaseOut = function(t, b, c, d) {
    return c * ((t = t / d - 1) * t * t * t * t + 1) + b;
  };

  Tween.strongEaseInOut = function(t, b, c, d) {
    if ((t /= d / 2) < 1)
      return c / 2 * t * t * t * t * t + b;
    return c / 2 * ((t -= 2) * t * t * t * t + 2) + b;
  };


  return {
    // Components EXTERNAL : INTERNAL
    Gauge          : gauge,
    AvGauge        : avGauge,
    FlatGauge      : flatGauge,
    SimpleGauge    : simpleGauge,
    OneEightyGauge : oneEightyGauge,
    Lcd            : lcd,
    Led            : led,
    SevenSegment   : sevenSegment,
    SixteenSegment : sixteenSegment,
    Section        : section,
    Marker         : marker,
    Stop           : stop,
    Color          : color,
    GradientLookup : gradientLookup
  };

}());
