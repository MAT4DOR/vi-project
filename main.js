var full_dataset;
var visualizations = {};
var countryColors = ['#f50', '#0f5'];
var attributeColors = ['#7bf', '#fd4'];
var attributes = [
    {col: 'gii_value', shortname:'GII Value', max:1},
    {col: 'gii_rank', shortname:'GII Rank', max:-1},
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
        var orderedDataset = full_dataset.slice();
        orderedDataset = orderedDataset.sort(function (a, b) {
            if(attr.endsWith('_diff'))
                return Math.abs(parseValue(a[attr], 4)) - Math.abs(parseValue(b[attr], 4));
            else if (attr == 'ssp')
                return Math.abs(50 - parseValue(a[attr], 4)) - Math.abs(50 - parseValue(b[attr], 4));
            else if (['edu_female', 'edu_male', 'labour_female', 'labour_male'].indexOf(attr) != -1) // ordered more to less
                return parseValue(b[attr], 4) - parseValue(a[attr], 4);
            else
                return parseValue(a[attr], 4) - parseValue(b[attr], 4);
        });

        var validSeen = 0;
        var rank = 0;
        var lastValueRank = undefined;
        for (var i = 0; i < orderedDataset.length; ++i) {
            var d = orderedDataset[i];
            if (d[attr] == '-1')
                continue;
            if (attr.endsWith('_diff')) {
                var attrParent = attr.substr(0, attr.indexOf('_diff'));
                if (d[attrParent + '_male'] == '-1' || d[attrParent + '_female'] == '-1')
                    continue;
            }
            validSeen++;
            var dVal = parseValue(d[attr], 4);
            if (dVal != lastValueRank) {
                lastValueRank = dVal;
                rank = validSeen;
            }
            d['rank_' + attr] = rank;
        }
        attributes[attrIndex].maxRank = validSeen;
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
    initTask5();
}

function initTask2() {
    var options = {
        width: 700,
        height: 400,
        paddingTop: 30,
        padding: 60,
        paddingLeft: 40,
        paddingRight: 10,
        notInteresting: ['gii_rank', 'human-development']
    }
    var svg = d3.select('#task2').append('svg');
    svg.attr('width', options.width).attr('height', options.height);

    var enterSelection = svg.selectAll('circle').data(full_dataset).enter();

    var scaleX = d3.scale.ordinal().rangeRoundBands([options.paddingLeft, options.width - options.paddingRight]);
    scaleX.domain(attributes.map(function(d) {
        if (options.notInteresting.indexOf(d.col) != -1)
            return undefined;
        return d.shortname;
    }).filter(function(n){ return n != undefined }));

    for (var attrNum = 0; attrNum < attributeColors.length; ++attrNum) {
        svg.append('rect')
            .attr('x', -scaleX.rangeBand())
            .attr('y', 2)
            .attr('width', scaleX.rangeBand())
            .attr('height', options.height-4)
            .attr('fill', attributeColors[attrNum])
            .attr('opacity', 0.80)
            .attr('attr-num', attrNum);
    }

    var xAxis = d3.svg.axis().scale(scaleX).orient('bottom');
    var xAxisText = svg.append('g')
        .attr('class', 'axis task2')
        .attr('transform', 'translate(-' + scaleX.rangeBand()/2 + ',' + (options.height-options.padding+20) + ')')
        .call(xAxis)
        .selectAll('.tick text')
        .call(wrap, scaleX.rangeBand());

    for (var attrNum = 0; attrNum < attributeColors.length; ++attrNum) {
        svg.select('rect[attr-num="' + attrNum + '"]').attr('x', -scaleX.rangeBand());
    }

    var scaleY = {};
    for (var attrIndex = 0; attrIndex < attributes.length; ++attrIndex) {
        var attr = attributes[attrIndex].col;
        var max = attributes[attrIndex].max;
        if (options.notInteresting.indexOf(attr) != -1)
            continue;
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

        enterSelection.append('circle').attr('class', 'to-remove').filter(function (d) {
                if (d[attr] == '-1')
                    return false;
                if (attr.endsWith('_diff')) {
                    var attrParent = attr.substr(0, attr.indexOf('_diff'));
                    if (d[attrParent + '_male'] == '-1' || d[attrParent + '_female'] == '-1')
                        return false;
                }
                return true;
            })
            .attr('fill', '#555')
            .attr('r', 5)
            .attr('cx', x0)
            .attr('cy', function(d, i) { return scaleY[attr](parseValue(d[attr], 4)); })
            .attr('attr', attr)
            .attr('country', function(d, i) { return i; })
            .attr('opacity', 0.12)
            .attr('class', '');
        
        var shortname = attributes[attrIndex].shortname;
        svg.append('rect')
            .attr('x', scaleX(shortname)-scaleX.rangeBand()/2)
            .attr('y', 2)
            .attr('width', scaleX.rangeBand())
            .attr('height', options.height - 4)
            .attr('fill', 'red')
            .attr('opacity', 0.0)
            .attr('attr', attr).on('click', function() {
            $('#attribute-selection-1 li[data-id="' + $(this).attr('attr') + '"]').trigger('click');
        });
    }

    svg.selectAll('circle.to-remove').remove();
    visualizations.task2 = { options: options, attributes: attributes, svg: svg, scaleY: scaleY, scaleX: scaleX };
    for (var countrySelectorNumber = 0; countrySelectorNumber < countryColors.length; ++countrySelectorNumber) {
        var group = svg.append('g').attr('class', 'selector-' + countrySelectorNumber);
        for (var attrIndex = 0; attrIndex < attributes.length; ++attrIndex) {
            var attr = attributes[attrIndex].col;
            if (options.notInteresting.indexOf(attr) != -1)
                continue;
            var x0 = scaleX(attributes[attrIndex].shortname);
            var farValue = scaleY[attr](0);
            group.append('circle')
                .attr('fill', countryColors[countrySelectorNumber])
                .attr('r', 5)
                .attr('cx', x0)
                .attr('cy', farValue)
                .attr('opacity', 0.6)
                .attr('attr', attr).append('title').text('');

            group.append('line')
                .attr('x1', x0 + (countrySelectorNumber % 2 == 0 ? -2 : 2)).attr('x2', x0 + (countrySelectorNumber % 2 == 0 ? -8 : 8))
                .attr('y1', farValue).attr('y2', farValue)
                .attr('stroke-width', 1).attr('stroke', 'black').attr('attr', attr);
            group.append('text').attr('x', x0 + (countrySelectorNumber % 2 == 0 ? -10 : 10) - 0.5).attr('y', farValue)
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
        if (options.notInteresting.indexOf(attr) != -1)
            continue;
        var centerY = function (d, i) {
            if (d[attr] == '-1')
                return -2000;
            if (attr.endsWith('_diff')) {
                var attrParent = attr.substr(0, attr.indexOf('_diff'));
                if (d[attrParent + '_male'] == '-1' || d[attrParent + '_female'] == '-1')
                    return -2000;
            }
            return scaleY[attr](parseValue(d[attr], 4));
        };
        selection.select('circle[attr="' + attr + '"]').transition().duration(1000).attr('cy', centerY);
        selection.select('circle[attr="' + attr + '"] title').text(function(d) { return 'Rank: ' + d['rank_' + attr] + '/' + attributes[attrIndex].maxRank; });
        selection.select('text[attr="' + attr + '"]').text(function(d) { return parseValue(d[attr], attr == 'gii_value' ? 3 : 1); }).transition().duration(1000).attr('y',  centerY);
        var y = function (d, i) {
            if (d[attr] == '-1')
                return -2000;
            if (attr.endsWith('_diff')) {
                var attrParent = attr.substr(0, attr.indexOf('_diff'));
                if (d[attrParent + '_male'] == '-1' || d[attrParent + '_female'] == '-1')
                    return -2000;
            }
            return parseInt(scaleY[attr](parseValue(d[attr], 4))) + 0.5;
        };
        selection.select('line[attr="' + attr + '"]').transition().duration(1000).attr('y1', y).attr('y2',  y);
    }
}

function findAttributeByCol(attr) {
    for(var i = 0; i < attributes.length; ++i) {
        if (attributes[i].col == attr)
            return attributes[i];
    }
    return undefined;
}

function updateAttributeTask2(attributeNum, selectedAttribute) {
    var svg = visualizations.task2.svg;
    var scaleX = visualizations.task2.scaleX;
    var options = visualizations.task2.options;
    var attribute = findAttributeByCol(selectedAttribute);
    if (options.notInteresting.indexOf(attribute.col) != -1) {
        svg.select('rect[attr-num="' + attributeNum + '"]').transition().duration(500).attr('x', -scaleX.rangeBand());
        return;
    }
    var shortname = attribute.shortname;
    svg.select('rect[attr-num="' + attributeNum + '"]').transition().duration(500)
        .attr('x', shortname != undefined ? scaleX(shortname) - scaleX.rangeBand() / 2 : -scaleX.rangeBand());
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
    if(value != "human-development"){
        if(!task4Initialized){
            initHorizontalDivergentBar();
            task4Initialized = true;
        }else
            updateHorizontalDivergentBar();
    }else
        hideHorizontalDivergentBar();
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
    var margin = {top: 20, right: 20, bottom: 30, left: 20};
    var w = 400 - margin.left - margin.right;
    var h = 500 - margin.top - margin.bottom;

    var selectedAttr = $('.selected').attr("data-id");

    var svg = d3.select("#task4");
    svg = svg.append("svg")
            .attr("width",w)
            .attr("height",h);

    visualizations.task4 = {svg: svg};

    var shortenedDataset = [0, 1, 2, 3, 4, 5]; // 6 dummy objects to init the svg
    svg.selectAll("rect")
        .data(shortenedDataset)
        .enter().append("rect")
        .attr("fill","white");


    // Add text numbers in bar
    svg.selectAll("text.t4Values")
        .data(shortenedDataset)
        .enter()
        .append("text")
        .attr("class", "t4Values");

    // Add text label in bar
    svg.selectAll("text.t4Names")
        .data(shortenedDataset)
        .enter()
        .append("text")
        .attr("class", "t4Names");

    updateHorizontalDivergentBar();
}

function updateHorizontalDivergentBar() {
    var margin = {top: 20, right: 20, bottom: 30, left: 20};
    var w = 400 - margin.left - margin.right;
    var h = 500 - margin.top - margin.bottom;

    var selectedAttr = $('.selected').attr("data-id");

    var svg = visualizations.task4.svg;

    var comparingFunction = function compareNumbers(a, b) {
        if(selectedAttr == 'labour_diff' || selectedAttr == 'edu_diff')
            return Math.abs(parseValue(a[selectedAttr],4)) - Math.abs(parseValue(b[selectedAttr],4));
        else if (['gii_rank', 'gii_value', 'mmr', 'abr'].indexOf(selectedAttr) >= 0)
            return parseValue(a[selectedAttr],4) - parseValue(b[selectedAttr],4) ;
        else
            return parseValue(b[selectedAttr],4) - parseValue(a[selectedAttr],4);
    };

//este shortenedDataset pode ser calculado no inicio para ambos os casos (edu e labour diff) e dps reutilziava esses
    var orderedDataset = full_dataset.slice();

    orderedDataset = orderedDataset.sort(comparingFunction);

    var shortenedDataset = [];

    var startOfSmaller = orderedDataset.length-1;
    for(var i = 0; i < orderedDataset.length; i++){
        var d = orderedDataset[i];
        if (d[selectedAttr] == '-1')
            continue;
        if (selectedAttr.endsWith('_diff')) {
            var attrParent = selectedAttr.substr(0, selectedAttr.indexOf('_diff'));
            if (d[attrParent + '_male'] == '-1' || d[attrParent + '_female'] == '-1')
                continue;
        }
        startOfSmaller = i;
        break;
    }

    shortenedDataset[0] = orderedDataset[startOfSmaller];
    shortenedDataset[1] = orderedDataset[startOfSmaller+1];
    shortenedDataset[2] = orderedDataset[startOfSmaller+2];

    var startOfSmaller = orderedDataset.length-1;
    for(var i = orderedDataset.length-1; i >= 0; i--){
        var d = orderedDataset[i];
        if (d[selectedAttr] == '-1')
            continue;
        if (selectedAttr.endsWith('_diff')) {
            var attrParent = selectedAttr.substr(0, selectedAttr.indexOf('_diff'));
            if (d[attrParent + '_male'] == '-1' || d[attrParent + '_female'] == '-1')
                continue;
        }
        startOfSmaller = i;
        break;
    }

    shortenedDataset[3] = orderedDataset[startOfSmaller-2];
    shortenedDataset[4] = orderedDataset[startOfSmaller-1];
    shortenedDataset[5] = orderedDataset[startOfSmaller];

    var max = Math.max(Math.abs(parseValue(shortenedDataset[0][selectedAttr], 4)), Math.abs(parseValue(shortenedDataset[5][selectedAttr], 4)));
    var x = d3.scale.linear()
                .domain([-max, max])
                .range([100, w-100]).nice();
    svg.selectAll("rect")
        .data(shortenedDataset)
        .transition()   
        .duration(1000) 
        .attr("width",function(d) {
                    return Math.abs(x(parseValue(d[selectedAttr], 4)) - x(0));
            })
        .attr("height",20)
        .attr("fill","purple")
        .attr("x",function(d) {
            return x(Math.min(parseValue(d[selectedAttr], 4), 0));
            })
        .attr("y",function(d, i) {
            return i>=3 ? i*(21 + 16) + 42 : i*(21 + 16);
            })
        .attr("fill",function(d, i) {
            return i==0 ? "green" : i==shortenedDataset.length-1 ? "red" : "blue"
            });

    svg.selectAll("text.t4Values")
        .data(shortenedDataset)
        .transition()   
        .duration(1000) 
        .attr("x", function(d) {  
            return x(parseValue(d[selectedAttr], 4)) + Math.sign(parseValue(d[selectedAttr], 4)) * 10;
         })
        .attr('text-anchor', function(d) { return Math.sign(parseValue(d[selectedAttr], 4)) > 0 ? 'start' : 'end'})
        .attr("y", function(d, i) {
            return i>=3 ? i*(21 + 16) + 42 + 14 : i*(21 + 16)+14;
            })
        .text(function(d) { return parseValue(d[selectedAttr], 3); });

                // Add text label in bar
             
    svg.selectAll("text.t4Names")
        .data(shortenedDataset)
        .style("visibility", function(d) {
                return "visible";
              })
        .transition()   
        .duration(1000)
        .attr("x", function(d) {
            return x(0);
         })
        .attr('text-anchor', function(d) { return Math.sign(parseValue(d[selectedAttr], 4)) > 0 ? 'start' : 'end'})
        .attr("y", function(d, i) {
            return i>=3 ? i*(21 + 16) + 42 + 14 + 16: i*(21 + 16)+14+ 16;
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
      .attr("fill","#FF5500").append('title').text('');

     svg.append("rect")
      .attr("class", "bar")
      .attr("id", "barCountry1")
      .attr("x", 40)
      .attr("width", 30)
      .attr("fill","#00FF55").append('title').text('');

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
        bar.select('title').text('');

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
    bar.select('title').text('Rank: ' + selectedRow['rank_' + selectedAttr] + '/' + findAttributeByCol(selectedAttr).maxRank);

    var label = svg.select("#task1label"+countrySelectorNumber);
    label.text(attrValue)
            .transition()   
            .duration(1000)
            .attr("y", attrValue>=0 ? (centerY - attrValue*valuesScale - 10) : (centerY - attrValue*valuesScale + 20));

    var line = svg.select("#task1line");
    line.attr('y1', centerY).attr('y2', centerY);
}

function initTask5() {
    var options = {
        width: 700,
        height: 200,
        paddingLeft: 20,
        paddingTop: 20,
        paddingBottom: 20,
        paddingRight: 20
    }

    var svg = d3.select('#task5').append('svg');
    svg.attr('width', options.width).attr('height', options.height);

    for(var i = 0; i < attributeColors.length; ++i)
        svg.append("path").attr('id', 'task5_a' + i).attr("stroke", attributeColors[i]).attr("class", "line").attr('opacity', 0.8);

    visualizations.task5 = {svg: svg, options: options};
}

function updateAttributeTask5(attributeNum, selectedAttribute) {
    var options = visualizations.task5.options;

    var attribute = findAttributeByCol(selectedAttribute);

    var x = d3.scale.linear().domain([1, full_dataset.length]).range([options.paddingLeft, options.width-options.paddingRight]);
    var y = d3.scale.linear().domain([selectedAttribute.endsWith('_diff') ? -1 : 0, 1]).range([options.height-options.paddingBottom, options.paddingTop]);

    var line = d3.svg.line()
        .x(function(d, i) { return x(i+1); })
        .y(function(d) { return y(parseValue(d[selectedAttribute], 4) / attribute.max); })
        .defined(function(d) { return d[selectedAttribute] != -1; });

    visualizations.task5.svg.select('#task5_a' + attributeNum).datum(full_dataset).transition().duration(1000).attr("d", line);
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

    updateAttribute(self.parent().attr('data-id') - 1, self.attr('data-id'));
    changeVisualizations();
});

function updateAttribute(attributeNum, selectedAttribute) {
    updateAttributeTask2(attributeNum, selectedAttribute);
    updateAttributeTask5(attributeNum, selectedAttribute);
}

function getSelectedText(elementId) {
    var elt = document.getElementById(elementId);

    if (elt.selectedIndex == -1)
        return null;

    return elt.options[elt.selectedIndex].text;
}