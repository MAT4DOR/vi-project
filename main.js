var full_dataset;
var visualizations = {};
var countryColors = ['#f50', '#0f5'];
var attributeColors = {1: '#44f', 2:'#8f4'};
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
    console.log(data);
    initialize();
});

function initializeData() {
    for (var attrIndex = 0; attrIndex < attributes.length; ++attrIndex) {
        var attr = attributes[attrIndex].col;
        var max = attributes[attrIndex].max;
        if (max == -1) {
            for (var i = 0; i < full_dataset.length; ++i) {
                var v = parseFloat(full_dataset[i][attr].replace(/,/g, '.'));
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
        padding: 60,
        paddingH: 40
    }
    var svg = d3.select('#task2').append('svg');
    svg.attr('width', options.width).attr('height', options.height);

    var enterSelection = svg.selectAll('circle').data(full_dataset).enter();

    var scaleX = d3.scale.ordinal().rangeRoundBands([options.paddingH, options.width - options.paddingH]);
    scaleX.domain(attributes.map(function(d) { return d.shortname; }));
    var xAxis = d3.svg.axis().scale(scaleX).orient('bottom');
    svg.append('g')
        .attr('class', 'axis task2')
        .attr('transform', 'translate(-' + scaleX.rangeBand()/2 + ',' + (options.height-options.padding+10) + ')')
        .call(xAxis)
        .selectAll('.tick text')
        .call(wrap, scaleX.rangeBand());

    var scaleY = {};
    for (var attrIndex = 0; attrIndex < attributes.length; ++attrIndex) {
        var attr = attributes[attrIndex].col;
        var max = attributes[attrIndex].max;
        var min = attr.endsWith('_diff') ? -max : 0;
        scaleY[attr] = d3.scale.linear().domain([max, min]).range([options.padding,options.height-options.padding]);

        var axisGroup = svg.append('g').attr('class', 'axis-' + attr);
        var x0 = scaleX(attributes[attrIndex].shortname);
        var yAxis = d3.svg.axis().scale(scaleY[attr]).orient("left").ticks(0, "f").tickValues([min, max]);
        axisGroup.append("g")
            .attr('transform','translate(' + (x0-8-0.5) + ', -0.5)')
            .attr('class', 'axis task2')
            .call(yAxis);

        enterSelection.append('circle').attr('class', 'to-remove').filter(function (d) { return d[attr] != -1; })
            .attr('fill', '#555')
            .attr('r', 5)
            .attr('cx', x0)
            .attr('cy', function(d, i) { return scaleY[attr](parseFloat(d[attr].replace(/,/g, '.'))); })
            .attr('attr', attr)
            .attr('country', function(d, i) { return i; })
            .attr('opacity', 0.12)
            .attr('class', '');
    }

    svg.selectAll('circle.to-remove').remove();
    visualizations.task2 = { options: options, attributes: attributes, svg: svg, scaleY: scaleY };
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
                .attr('x1', x0 - 2).attr('x2', x0 - 8)
                .attr('y1', -10000).attr('y2', -10000)
                .attr('stroke-width', 1).attr('stroke', 'black').attr('attr', attr);
            group.append('text').attr('x', x0 - 10 - 0.5).attr('y', -10000)
                .attr('class', 'axistext').attr('dy', '.32em')
                .attr('fill', 'black').attr('text-anchor', 'end').text('').attr('attr', attr);
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
                if (d[attrParent + '_male'] == '-1' || d[attr + '_female'] == '-1')
                    return -100000;
            }
            return scaleY[attr](parseFloat(d[attr].replace(/,/g, '.')));
        };
        selection.select('circle[attr="' + attr + '"]').attr('cy', centerY);
        selection.select('text[attr="' + attr + '"]').attr('y',  centerY).text(function(d) { return Math.round(parseFloat(d[attr].replace(/,/g, '.'))*10)/10; });
        var y = function (d, i) {
            if (d[attr] == '-1')
                return -100000;
            if (attr.endsWith('_diff')) {
                var attrParent = attr.substr(0, attr.indexOf('_diff'));
                if (d[attrParent + '_male'] == '-1' || d[attr + '_female'] == '-1')
                    return -100000;
            }
            return parseInt(scaleY[attr](parseFloat(d[attr].replace(/,/g, '.')))) + 0.5;
        };
        selection.select('line[attr="' + attr + '"]').attr('y1', y).attr('y2',  y);
    }
}

function changeSelectedCountry(countrySelectorNumber, selectedCountry) {
    updateTask2(countrySelectorNumber, selectedCountry);
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
            dy = parseFloat(text.attr("dy")),
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

function changeVisualizations() {
    var value = $('.selected').attr("data-id");
    task1();
    if(value == "labour_diff"){
        sideWaysDivergentBar();
    }
}

function sideWaysDivergentBar() {
    var w = 800;
    var h = 5000;
    var svg = d3.select("#task4");
    svg = svg.append("svg")
            .attr("width",w)
            .attr("height",h);

    var comparingFunction = function compareNumbers(a, b) {
        return parseInt(b.labour_diff) - parseInt(a.labour_diff);
        };

    var orderedDataset = full_dataset;
    orderedDataset = orderedDataset.sort(comparingFunction);


    svg.selectAll("rect")
        .data(orderedDataset)
        .enter().append("rect")
        .attr("width",function(d) {
                    return Math.abs(parseInt(d.labour_diff));
            })
        .attr("height",20)
        .attr("fill","purple")
        .attr("x",function(d) {
            return Math.sign(parseInt(d.labour_diff))==1 ? w/2 : w/2+parseInt(d.labour_diff);
            })
        .attr("y",function(d, i) {
            return i*21;
            })
        .attr("fill",function(d, i) {
            return i==0 ? "green" : i==orderedDataset.length-1 ? "red" : "blue"
            });

}

function task1() {
    var w = 800;
    var h = 400;
    var svg = d3.select("#task1");

    var country1 = getSelectedText("country-selection-0");
    var country2 = getSelectedText("country-selection-1");
    var data1;
    var data2;
    var selectedAttr = $('.selected').attr("data-id");
    for(var i = 0; i < full_dataset.length; ++i) {
        if(full_dataset[i].country == country1){
            data1 = full_dataset[i][selectedAttr];
        }
        if(full_dataset[i].country == country2){
            data2 = full_dataset[i][selectedAttr];
        }
    }

    svg = svg.append("svg");
    svg = svg.attr("width",w);
    svg = svg.attr("height",h);
    svg.append("rect")
        .attr("width",80)
        .attr("height", parseFloat(data1))
        .attr("fill","purple")
        .attr("y",h-parseFloat(data1))
        .attr("x",0);
    svg.append("rect")
        .attr("width",80)
        .attr("height", parseFloat(data2))
        .attr("fill","green")
        .attr("y",h-parseFloat(data2))
        .attr("x",100);
}

function initialize() {
    initializeData();
    initializeInterface();
    initializeVisualizations();
}

$('#attribute-selection-one li').click(function() {
    var self = $(this);
    self.parent().children('.selected').removeClass('selected');
    self.addClass('selected');
    changeVisualizations();
});

function getSelectedText(elementId) {
    var elt = document.getElementById(elementId);

    if (elt.selectedIndex == -1)
        return null;

    return elt.options[elt.selectedIndex].text;
}
