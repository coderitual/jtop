define(function(require, exports, module) {

    var core = require('./core');

    function autoEllipseText(element, text, width) {
        element.textContent = text;
        var textLength = element.getComputedTextLength();
        if(textLength > width) {
            var i = 1;
            element.textContent = '';
            while(element.getComputedTextLength() < (width) && i < text.length) {
                element.textContent = text.substr(0, i) + '...';
                i++; 
            } 
            return element.textContent;
        }
        element.textContent = text;
        return text;
    };

    function textFlow(myText, textToAppend, maxWidth, x, ddy, justified, maxLines, ellipsis) {
            //extract and add line breaks for start
            textToAppend.textContent = '';
            var dashArray = [];
            var dashFound = true;
            var indexPos = 0;
            var cumulY = 0;
            while (dashFound == true) {
                    var result = myText.indexOf("-",indexPos);
                    if (result == -1) {
                            //could not find a dash
                            dashFound = false;
                    }
                    else {
                            dashArray.push(result);
                            indexPos = result + 1;
                    }
            }
            //split the text at all spaces and dashes
            var words = myText.split(/[\s-]/);
            var line = "";
            var dy = 0;
            var lines = 0;
            var curNumChars = 0;
            var computedTextLength = 0;
            var myTextNode;
            var tspanEl;
            var lastLineBreak = 0;

            for (i=0;i<words.length;i++) {
                    var word = words[i];
                    curNumChars += word.length + 1;
                    if (computedTextLength > maxWidth || i == 0) {

                        if (computedTextLength > maxWidth) {
                             var tempText = tspanEl.firstChild.nodeValue;
                             tempText = tempText.slice(0,(tempText.length - words[i-1].length - 2)); //the -2 is because we also strip off white space
                             tspanEl.firstChild.nodeValue = tempText;
                             if (justified) {
                               //determine the number of words in this line
                               var nrWords = tempText.split(/\s/).length;
                               computedTextLength = tspanEl.getComputedTextLength();
                               var additionalWordSpacing = (maxWidth - computedTextLength) / (nrWords - 1);
                               tspanEl.setAttributeNS(null,"word-spacing",additionalWordSpacing);
                               //alternatively one could use textLength and lengthAdjust, however, currently this is not too well supported in SVG UA's
                             }
                        }
                        lines++;
                        tspanEl = core.createSVGElement("tspan");
                        tspanEl.setAttributeNS(null,"x",x);
                        tspanEl.setAttributeNS(null,"dy",dy);
                        myTextNode = document.createTextNode(line);
                        tspanEl.appendChild(myTextNode);
                        textToAppend.appendChild(tspanEl);
                        
                        if(checkDashPosition(dashArray,curNumChars-1)) {
                           line = word + "-";
                        }
                        else {
                           line = word + " ";
                        }
                        if (i != 0) {
                           line = words[i-1] + " " + line;
                        }
                        dy = ddy;
                        cumulY += dy;

                    } else {
                        if(checkDashPosition(dashArray,curNumChars-1)) {
                                line += word + "-";
                        }
                        else {
                                line += word + " ";
                        }
                    }

                    tspanEl.firstChild.nodeValue = line;

                    if(maxLines && lines >= maxLines) {
                        if (ellipsis === true) {

                            line = line.slice(0, -1);
                            if(i < words.length - 1) line += ' ' + word;
                            autoEllipseText(tspanEl, line, maxWidth);       // 3 dots place
                        }
                        return;
                    }

                    computedTextLength = tspanEl.getComputedTextLength();
                    if (i == words.length - 1) {
                      if (computedTextLength > maxWidth) {
                        var tempText = tspanEl.firstChild.nodeValue;
                        tspanEl.firstChild.nodeValue = tempText.slice(0,(tempText.length - words[i].length - 1));
                        tspanEl = core.createSVGElement("tspan");
                        tspanEl.setAttributeNS(null,"x",x);
                        tspanEl.setAttributeNS(null,"dy",dy);
                        myTextNode = document.createTextNode(words[i]);
                        tspanEl.appendChild(myTextNode);
                        textToAppend.appendChild(tspanEl);
                      }
                    
                    }
            }
            return cumulY;
    };

    //this function checks if there should be a dash at the given position, instead of a blank
    function checkDashPosition(dashArray,pos) {
            var result = false;
            for (var i=0;i<dashArray.length;i++) {
                    if (dashArray[i] == pos) {
                            result = true;
                    }
            }
            return result;
    }

    module.exports = {
        addTextFlow: textFlow,
        addEllipseText: autoEllipseText
    }
});