var full_dataset;
var visualizations = {};
var countryColors = ['#f50', '#0f5'];
var attributeColors = ['#7bf', '#fd4'];
var attributes = [
    {col: 'gii_value', shortname:'GII Value', max:1},
    {col: 'mmr', shortname:'Maternal Mortality', max:-1},
    {col: 'abr', shortname:'Adolencent Births', max:-1},
    {col: 'ssp', shortname:'Seats Parliament', max:100},
    {col: 'edu_female', shortname:'Education Female', max:100},
    {col: 'edu_male', shortname:'Education Male', max:100},
    {col: 'edu_diff', shortname:'Education Difference', max:100},
    {col: 'labour_female', shortname:'Labour Female', max:100},
    {col: 'labour_male', shortname:'Labour Male', max:100},
    {col: 'labour_diff', shortname:'Labour Difference', max:100},
];

var dsv = d3.dsv(';', 'text/plain');
dsv('gender_inequality.csv', function (data) {
    full_dataset = data;
    initialize();
});

var task1Initialized = false;
var task4Initialized = false;

function initializeData() {
    for (var attrIndex = 0; attrIndex < attributes.length; ++attrIndex) {
        var attr = attributes[attrIndex].col;
        var max = attributes[attrIndex].max;
        if (max == -1) {
            for (var i = 0; i < full_dataset.length; ++i) {
                var v = parseValue(full_dataset[i][attr]);
                if (Math.abs(v) > max)
                    max = Math.abs(v);
            }
        }
        attributes[attrIndex].max = max;
    }
}

function initializeInterface() {
    var countries = [];
    for(var i = 0; i < full_dataset.length; ++i) {
        countries.push({country: full_dataset[i].country, id: i});
    }

    countries.sort(function(a, b) {
        return a.country.localeCompare(b.country);
    });

    var countrySelection = $('#country-selection');
    for (var n = 0; n < countryColors.length; ++n) {
        countrySelection.append('<select id="country-selection-' + n + '" name="country"></select> ');
    }

    for (var n = 0; n < countryColors.length; ++n) {
        var countrySelector = $('#country-selection-' + n);
        for (var i = 0; i < countries.length; ++i) {
            countrySelector.append('<option value="' + countries[i].id + '">' + countries[i].country + '</option>');
        }
        countrySelector.css('background-color', countryColors[n]);
        (function (n) {
            countrySelector.change(function () {
                changeSelectedCountry(n, $(this).find('option:selected').attr('value'));
            });
        })(n);
    }
}

function initializeVisualizations() {
    initTask2();
}

function initTask2() {
    var options = {
        width: 800,
        height: 400,
        paddingTop: 30,
        padding: 60,
        paddingH: 40
    }
    var svg = d3.select('#task2').append('svg');
    svg.attr('width', options.width).attr('height', options.height);

    var enterSelection = svg.selectAll('circle').data(full_dataset).enter();

    var scaleX = d3.scale.ordinal().rangeRoundBands([options.paddingH, options.width - options.paddingH]);
    scaleX.domain(attributes.map(function(d) { return d.shortname; }));
    for (var attrNum = 0; attrNum < attributeColors.length; ++attrNum) {
        svg.append('rect')
            .attr('x', -1000)
            .attr('y', 2)
            .attr('width', scaleX.rangeBand())
            .attr('height', options.height-4)
            .attr('fill', attributeColors[attrNum])
            .attr('opacity', 0.80)
            .attr('attr-num', (attrNum+1));
    }

    var xAxis = d3.svg.axis().scale(scaleX).orient('bottom');
    var xAxisText = svg.append('g')
        .attr('class', 'axis task2')
        .attr('transform', 'translate(-' + scaleX.rangeBand()/2 + ',' + (options.height-options.padding+20) + ')')
        .call(xAxis)
        .selectAll('.tick text');
    xAxisText.on('click', function() {
        var text = $(this).text();
        console.log(text);
        var attr = undefined;
        for (var attrIndex = 0; attrIndex < attributes.length; ++attrIndex) {
            if (attributes[attrIndex].shortname.replace(/ /g, '') == text.replace(/ /g, ''))
                attr = attributes[attrIndex].col;
        }
        if (attr != undefined) {
            $('#attribute-selection-1 li[data-id="' + attr + '"]').trigger('click');
        }
    });
    xAxisText.call(wrap, scaleX.rangeBand());

    var scaleY = {};
    for (var attrIndex = 0; attrIndex < attributes.length; ++attrIndex) {
        var attr = attributes[attrIndex].col;
        var max = attributes[attrIndex].max;
        var min = attr.endsWith('_diff') ? -max : 0;
        scaleY[attr] = d3.scale.linear().domain([max, min]).range([options.paddingTop,options.height-options.padding]);

        var axisGroup = svg.append('g').attr('class', 'axis-' + attr);
        var x0 = scaleX(attributes[attrIndex].shortname);

        var scaleYAxis = d3.scale.linear().domain([max, min]).range([options.paddingTop-10,options.height-options.padding+10]);
        var yAxis = d3.svg.axis().scale(scaleYAxis).orient("left").ticks(0, "f").tickValues(attr.endsWith('_diff') ? [min, 0, max] : [min, max]);
        var axis = axisGroup.append("g")
            .attr('transform','translate(' + x0 + ', -0.5)')
            .attr('class', 'axis task2')
            .call(yAxis);
        axis.selectAll('line').remove();
        axis.selectAll('text').attr('x', 0).attr('style', 'text-anchor: middle');

        enterSelection.append('circle').attr('class', 'to-remove').filter(function (d) { return d[attr] != -1; })
            .attr('fill', '#555')
            .attr('r', 5)
            .attr('cx', x0)
            .attr('cy', function(d, i) { return scaleY[attr](parseValue(d[attr], 4)); })
            .attr('attr', attr)
            .attr('country', function(d, i) { return i; })
            .attr('opacity', 0.12)
            .attr('class', '');
    }

    svg.selectAll('circle.to-remove').remove();
    visualizations.task2 = { options: options, attributes: attributes, svg: svg, scaleY: scaleY, scaleX: scaleX };
    for (var countrySelectorNumber = 0; countrySelectorNumber < countryColors.length; ++countrySelectorNumber) {
        var group = svg.append('g').attr('class', 'selector-' + countrySelectorNumber);
        for (var attrIndex = 0; attrIndex < attributes.length; ++attrIndex) {
            var attr = attributes[attrIndex].col;
            var x0 = scaleX(attributes[attrIndex].shortname);
            group.append('circle')
                .attr('fill', countryColors[countrySelectorNumber])
                .attr('r', 5)
                .attr('cx', x0)
                .attr('cy', -10000)
                .attr('opacity', 0.6)
                .attr('attr', attr);

            group.append('line')
                .attr('x1', x0 + (countrySelectorNumber % 2 == 0 ? -2 : 2)).attr('x2', x0 + (countrySelectorNumber % 2 == 0 ? -8 : 8))
                .attr('y1', -10000).attr('y2', -10000)
                .attr('stroke-width', 1).attr('stroke', 'black').attr('attr', attr);
            group.append('text').attr('x', x0 + (countrySelectorNumber % 2 == 0 ? -10 : 10) - 0.5).attr('y', -10000)
                .attr('class', 'axistext').attr('dy', '.32em')
                .attr('fill', 'black').attr('text-anchor', countrySelectorNumber % 2 == 0 ? 'end' : 'start').text('').attr('attr', attr);
        }
        updateTask2(countrySelectorNumber, $('#country-selection-' + countrySelectorNumber + ' option:selected').attr('value'))
    }
}

function updateTask2(countrySelectorNumber, selectedCountry) {
    var options = visualizations.task2.options;
    var attributes = visualizations.task2.attributes;
    var svg = visualizations.task2.svg;
    var scaleY = visualizations.task2.scaleY;
    var selection = svg.selectAll('g.selector-' + countrySelectorNumber).data([full_dataset[selectedCountry]]);
    for (var attrIndex = 0; attrIndex < attributes.length; ++attrIndex) {
        var attr = attributes[attrIndex].col;
        var centerY = function (d, i) {
            if (d[attr] == '-1')
                return -100000;
            if (attr.endsWith('_diff')) {
                var attrParent = attr.substr(0, attr.indexOf('_diff'));
                if (d[attrParent + '_male'] == '-1' || d[attrParent + '_female'] == '-1')
                    return -100000;
            }
            return scaleY[attr](parseValue(d[attr], 4));
        };
        selection.select('circle[attr="' + attr + '"]').attr('cy', centerY);
        selection.select('text[attr="' + attr + '"]').attr('y',  centerY).text(function(d) { return parseValue(d[attr], attr == 'gii_value' ? 3 : 1); });
        var y = function (d, i) {
            if (d[attr] == '-1')
                return -100000;
            if (attr.endsWith('_diff')) {
                var attrParent = attr.substr(0, attr.indexOf('_diff'));
                if (d[attrParent + '_male'] == '-1' || d[attrParent + '_female'] == '-1')
                    return -100000;
            }
            return parseInt(scaleY[attr](parseValue(d[attr], 4))) + 0.5;
        };
        selection.select('line[attr="' + attr + '"]').attr('y1', y).attr('y2',  y);
    }
}

function findShortname(attr) {
    for(var i = 0; i < attributes.length; ++i) {
        if (attributes[i].col == attr)
            return attributes[i].shortname;
    }
    return undefined;
}

function updateAttributeTask2(attributeNum, selectedAttribute) {
    var svg = visualizations.task2.svg;
    var scaleX = visualizations.task2.scaleX;
    var shortname = findShortname(selectedAttribute);
    svg.select('rect[attr-num="' + attributeNum + '"]')
        .attr('x', shortname != undefined ? scaleX(shortname) - scaleX.rangeBand() / 2 : -10000);
}

function changeSelectedCountry(countrySelectorNumber, selectedCountry) {
    updateTask2(countrySelectorNumber, selectedCountry);
    updateTask1(countrySelectorNumber, selectedCountry);
}

function changeVisualizations() {
    var value = $('.selected').attr("data-id");
    if(!task1Initialized){
        initTask1();
        task1Initialized = true;

    }
    for (var n = 0; n < 2; ++n) {
        updateTask1(n, $('#country-selection-' + n).find('option:selected').attr('value'));
    }
    if(value == "labour_diff" || value == "edu_diff"){
    	if(!task4Initialized){
    		initHorizontalDivergentBar();
        	task4Initialized = true;
        }else
        	updateHorizontalDivergentBar();
    }
    else{
    	hideHorizontalDivergentBar();
    	//hide vis
    }
}

function parseValue(val, decimals) {
  var exp = (decimals == undefined ? 10 : Math.pow(10, decimals));
  return Math.round(parseFloat(val.replace(/,/g, '.'))*exp)/exp;
}

// from: http://bl.ocks.org/mbostock/7555321
function wrap(text, width) {
    text.each(function() {
        var text = d3.select(this),
            words = text.text().split(/\s+/).reverse(),
            word,
            line = [],
            lineNumber = 0,
            lineHeight = 1.1, // ems
            y = text.attr("y"),
            dy = parseValue(text.attr("dy")),
            tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
        while (word = words.pop()) {
            line.push(word);
            tspan.text(line.join(" "));
            if (tspan.node().getComputedTextLength() > width) {
                line.pop();
                tspan.text(line.join(" "));
                line = [word];
                tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
            }
        }
    });
}

function initHorizontalDivergentBar() {
	var margin = {top: 20, right: 20, bottom: 30, left: 200};
    var w = 960 - margin.left - margin.right;
    var h = 500 - margin.top - margin.bottom;

	var selectedAttr = $('.selected').attr("data-id");

    var svg = d3.select("#task4");
    svg = svg.append("svg")
            .attr("width",w)
            .attr("height",h);

    visualizations.task4 = {svg: svg};

    var comparingFunction = function compareNumbers(a, b) {
        return parseInt(b[selectedAttr]) - parseInt(a[selectedAttr]);
        };

    var orderedDataset = full_dataset;
    orderedDataset = orderedDataset.sort(comparingFunction);

//este shortenedDataset pode ser calculado no inicio para ambos os casos (edu e labour diff) e dps reutilziava esses
    var shortenedDataset = [];
    shortenedDataset[0] = orderedDataset[0];
    shortenedDataset[1] = orderedDataset[1];
    shortenedDataset[2] = orderedDataset[2];
    shortenedDataset[3] = orderedDataset[orderedDataset.length-3];
    shortenedDataset[4] = orderedDataset[orderedDataset.length-2];
    shortenedDataset[5] = orderedDataset[orderedDataset.length-1];

    svg.selectAll("rect")
        .data(shortenedDataset)
        .enter().append("rect")
        .attr("width",function(d) {
                    return Math.abs(parseInt(d[selectedAttr]));
            })
        .attr("height",20)
        .attr("fill","purple")
        .attr("x",function(d) {
            return Math.sign(parseInt(d[selectedAttr]))==1 ? w/2 : w/2+parseInt(d[selectedAttr]);
            })
        .attr("y",function(d, i) {
            return i>=3 ? i*21 + 42 : i*21;
            })
        .attr("fill",function(d, i) {
            return i==0 ? "green" : i==shortenedDataset.length-1 ? "red" : "blue"
            });


	         // Add text numbers in bar
	svg.selectAll("text")
		.data(shortenedDataset)
		.enter()
		.append("text")
	    .attr("x", function(d) {  
	    	return Math.sign(parseInt(d[selectedAttr]))==1 ? w/2 +parseInt(d[selectedAttr]) : w/2+parseInt(d[selectedAttr]) - 35;
	     })
	    .attr("y", function(d, i) {
            return i>=3 ? i*21 + 42 + 14 : i*21+14;
            })
	    .text(function(d) { return parseValue(d[selectedAttr], 4); });

                // Add text label in bar
                
	svg.append("text")
	    .data(shortenedDataset)
		.enter()
		.append("text")
	    .attr("x", function(d) {  
	    	return Math.sign(parseInt(d[selectedAttr]))==1 ? w/2 : w/2+parseInt(d[selectedAttr]);
	     })
	    .attr("y", function(d, i) {
            return i>=3 ? i*21 + 42 : i*21;
            })
	    .text(function(d) { return d.country; });
	    
	   
}

function updateHorizontalDivergentBar() {
	var margin = {top: 20, right: 20, bottom: 30, left: 200};
    var w = 960 - margin.left - margin.right;
    var h = 500 - margin.top - margin.bottom;

	var selectedAttr = $('.selected').attr("data-id");

    var svg = visualizations.task4.svg;

    var comparingFunction = function compareNumbers(a, b) {
        return parseInt(b[selectedAttr]) - parseInt(a[selectedAttr]);
        };

//este shortenedDataset pode ser calculado no inicio para ambos os casos (edu e labour diff) e dps reutilziava esses
    var orderedDataset = full_dataset;
    orderedDataset = orderedDataset.sort(comparingFunction);

    var shortenedDataset = [];
    shortenedDataset[0] = orderedDataset[0];
    shortenedDataset[1] = orderedDataset[1];
    shortenedDataset[2] = orderedDataset[2];
    shortenedDataset[3] = orderedDataset[orderedDataset.length-3];
    shortenedDataset[4] = orderedDataset[orderedDataset.length-2];
    shortenedDataset[5] = orderedDataset[orderedDataset.length-1];

    svg.selectAll("rect")
        .data(shortenedDataset)
        .style("visibility", function(d) {
                return "visible";
              })
        .transition()	
        .duration(1000)	
        .attr("width",function(d) {
                    return Math.abs(parseInt(d[selectedAttr]));
            })
        .attr("height",20)
        .attr("fill","purple")
        .attr("x",function(d) {
            return Math.sign(parseInt(d[selectedAttr]))==1 ? w/2 : w/2+parseInt(d[selectedAttr]);
            })
        .attr("y",function(d, i) {
            return i>=3 ? i*21 + 42 : i*21;
            })
        .attr("fill",function(d, i) {
            return i==0 ? "green" : i==shortenedDataset.length-1 ? "red" : "blue"
            });

      	svg.selectAll("text")
		.data(shortenedDataset)
		.style("visibility", function(d) {
                return "visible";
              })
		.transition()	
        .duration(1000)	
	    .attr("x", function(d) {  
	    	return Math.sign(parseInt(d[selectedAttr]))==1 ? w/2 +parseInt(d[selectedAttr]) : w/2+parseInt(d[selectedAttr]) - 35;
	     })
	    .attr("y", function(d, i) {
            return i>=3 ? i*21 + 42 + 14 : i*21+14;
            })
	    .text(function(d) {return d[selectedAttr]; });

                // Add text label in bar
                
	svg.append("text")
	    .data(shortenedDataset)
		.style("visibility", function(d) {
                return "visible";
              })
		.transition()	
        .duration(1000)	
	    .attr("x", function(d) {  
	    	return Math.sign(parseInt(d[selectedAttr]))==1 ? w/2 : w/2+parseInt(d[selectedAttr]);
	     })
	    .attr("y", function(d, i) {
            return i>=3 ? i*21 + 42 : i*21;
            })
	    .text(function(d) { return d.country; });
}

function hideHorizontalDivergentBar() {
	var svg = visualizations.task4.svg;

	svg.selectAll("rect")
              .style("visibility", function(d) {
                return "hidden";
              })

    svg.selectAll("text")
              .style("visibility", function(d) {
                return "hidden";
              })
}

function initTask1(){
    var margin = {top: 50, right: 20, bottom: 180, left: 150},
    width = 350 - margin.left - margin.right,
    height = 220 - margin.top - margin.bottom;
    var barMaxHeight = 120;
    var centerY = height + barMaxHeight/2.0;
    var svg = d3.select("#task1").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    visualizations.task1 = {svg: svg, _width: width, _height: height, barMaxHeight: barMaxHeight, centerY: centerY};

    svg.append("text")
        .attr("id", "country0NameText")
        .attr("x", -5)
        .attr("y", centerY)
        .attr("text-anchor","end")
        .text("");

    svg.append("text")
        .attr("id", "country1NameText")
        .attr("x", 75)
        .attr("y", centerY)
        .attr("text-anchor","start")
        .text("");

    svg.append("rect")
      .attr("class", "bar")
      .attr("id", "barCountry0")
      .attr("x", 0)
      .attr("width", 30)
      .attr("fill","#FF5500");

     svg.append("rect")
      .attr("class", "bar")
      .attr("id", "barCountry1")
      .attr("x", 40)
      .attr("width", 30)
      .attr("fill","#00FF55");

    svg.append("text")
        .attr("id","task1label0")
        .attr("x", 5)
        .text("");

    svg.append("text")
        .attr("id","task1label1")
        .attr("x", 45)
        .text("");

    svg.append('line')
        .attr('id', 'task1line')
        .attr('x1', 0 - 2).attr('x2', 72)
        .attr('stroke-width', 1).attr('stroke', 'black');
}

function updateTask1(countrySelectorNumber, selectedCountry) {
    var svg = visualizations.task1.svg;
    var width = visualizations.task1._width;
    var height = visualizations.task1._height;
    var barMaxHeight = visualizations.task1.barMaxHeight;
    var centerY = visualizations.task1.centerY;

    var selectedAttr = $('.selected').attr("data-id");
    var selectedRow = full_dataset[selectedCountry];
    var attrValue = parseValue(selectedRow[selectedAttr]);

    svg.select("#country"+countrySelectorNumber+"NameText").text(selectedRow["country"]);
    var isUnavailable = false;
    if(selectedAttr.endsWith("_diff")){
        var attrParent = selectedAttr.substr(0, selectedAttr.indexOf('_diff'));
        if (selectedRow[attrParent + '_male'] == '-1' || selectedRow[attrParent + '_female'] == '-1'){
            isUnavailable = true;
        }
    }else if(selectedRow[selectedAttr] == -1){
        isUnavailable = true;
    }
    if(isUnavailable){
        var bar = svg.select("#barCountry"+countrySelectorNumber);
                bar.transition()   
                    .duration(1000)
                    .attr("height", 0)
                    .attr("y", centerY);

        var label = svg.select("#task1label"+countrySelectorNumber);
            label.attr("y", centerY)
                .text("N.A.");
        return;
    }

    var maxValue = 0;
    var minValue = 0;
    for(var i = 0; i < full_dataset.length; ++i) {
        var parsedVal = parseValue(full_dataset[i][selectedAttr]); 
        maxValue = Math.max(parsedVal, maxValue);
        minValue = Math.min(parsedVal, minValue);
    }
    
    var highestExtreme = Math.max(Math.abs(minValue), Math.abs(maxValue));
    var barMaxHeight = 120;
    var centerY = height + barMaxHeight/2.0;
    var valuesScale = (barMaxHeight/2)/highestExtreme;

    var bar = svg.select("#barCountry"+countrySelectorNumber);
        bar.transition()   
           .duration(1000)
          .attr("height", Math.abs(attrValue*valuesScale))
          .attr("y", Math.min(centerY, centerY - attrValue*valuesScale));

    var label = svg.select("#task1label"+countrySelectorNumber);
    label.text(attrValue)
            .transition()   
            .duration(1000)
            .attr("y", attrValue>=0 ? (centerY - attrValue*valuesScale - 10) : (centerY - attrValue*valuesScale + 20));

    var line = svg.select("#task1line");
    line.attr('y1', centerY).attr('y2', centerY);
}

function initialize() {
    initializeData();
    initializeInterface();
    initializeVisualizations();
}

$('#attribute-selection li').click(function() {
    var self = $(this);
    self.parent().children('.selected').removeClass('selected');
    self.addClass('selected');

    updateAttributeTask2(self.parent().attr('data-id'), self.attr('data-id'));
    changeVisualizations();
});

function getSelectedText(elementId) {
    var elt = document.getElementById(elementId);

    if (elt.selectedIndex == -1)
        return null;

    return elt.options[elt.selectedIndex].text;
}