var full_dataset;
var visualizations = {};
var countryColors = {1: '#f50', 2:'#0f5'};
var attributeColors = {1: '#44f', 2:'#8f4'};

var dsv = d3.dsv(';', 'text/plain');
dsv('gender_inequality.csv', function (data) {
    full_dataset = data;
    console.log(data);
    initialize();
});

function initializeInterface() {
    var countries = [];
    for(var i = 0; i < full_dataset.length; ++i) {
        countries.push({country: full_dataset[i].country, id: i});
    }

    countries.sort(function(a, b) {
        return a.country.localeCompare(b.country);
    });

    var countrySelectionOne = $('#country-selection-one');
    var countrySelectionTwo = $('#country-selection-two');
    for(var i = 0; i < countries.length; ++i) {
        countrySelectionOne.append('<option value="' + countries[i].id + '">' + countries[i].country + '</option>');
        countrySelectionTwo.append('<option value="' + countries[i].id + '">' + countries[i].country + '</option>');
    }
    countrySelectionOne.css('background-color', countryColors[1]);
    countrySelectionTwo.css('background-color', countryColors[2]);
}

function initializeVisualizations() {
    initTask2();
}

function initTask2() {
    var options = {
        width: 1000,
        height: 400,
        padding: 20
    }
    var svg = d3.select('#task2').append('svg');
    svg.attr('width', options.width).attr('height', options.height);

    var attributes = [
        {name: 'gii_value', max:1},
        {name: 'mmr', max:-1},
        {name: 'abr', max:-1},
        {name: 'ssp', max:100},
        {name: 'edu_female', max:100},
        {name: 'edu_male', max:100},
        {name: 'edu_diff', max:100},
        {name: 'labour_female', max:100},
        {name: 'labour_male', max:100},
        {name: 'labour_diff', max:100},
    ];
    var enterSelection = svg.selectAll('circle').data(full_dataset).enter();

    var scale = {};
    for (var attrIndex = 0; attrIndex < attributes.length; ++attrIndex) {
        var attr = attributes[attrIndex].name;
        var max = attributes[attrIndex].max;
        if (max == -1) {
            for (var i = 0; i < full_dataset.length; ++i) {
                if (Math.abs(full_dataset[i][attr]) > max)
                    max = Math.abs(full_dataset[i][attr]);
            }
        }
        attributes[attrIndex].max = max;
        scale[attr] = d3.scale.linear().domain([max, attr.endsWith('_diff') ? -max : 0]).range([options.padding,options.height-options.padding]);

        enterSelection.append('circle').attr('class', 'to-remove').filter(function (d) { return d[attr] != -1; })
            .attr('fill', '#555')
            .attr('r', 5)
            .attr('cx', 40 * attrIndex + options.padding)
            .attr('cy', function(d, i) { return scale[attr](parseFloat(d[attr].replace(/,/g, '.'))); })
            .attr('attr', attr)
            .attr('country', function(d, i) { return i; })
            .attr('opacity', 0.12)
            .attr('class', '');
    }
    svg.selectAll('circle.to-remove').remove();
    visualizations.task2 = { options: options, attributes: attributes, svg: svg, scale: scale };
    initSelectorMarksTask2(1);
    initSelectorMarksTask2(2);
    updateTask2(1, $('#country-selection-one option:selected').attr('value'))
    updateTask2(2, $('#country-selection-two option:selected').attr('value'))
}

function initSelectorMarksTask2(countrySelectorNumber) {
    var options = visualizations.task2.options;
    var attributes = visualizations.task2.attributes;
    var svg = visualizations.task2.svg;

    var group = svg.append('g').attr('class', 'selector-' + countrySelectorNumber);
    for (var attrIndex = 0; attrIndex < attributes.length; ++attrIndex) {
        var attr = attributes[attrIndex].name;
        group.insert('circle')
            .attr('fill', countryColors[countrySelectorNumber])
            .attr('r', 5)
            .attr('cx', 40 * attrIndex + options.padding)
            .attr('cy', -10000)
            .attr('opacity', 0.2)
            .attr('attr', attr);
    }
}

function updateTask2(countrySelectorNumber, selectedCountry) {
    var options = visualizations.task2.options;
    var attributes = visualizations.task2.attributes;
    var svg = visualizations.task2.svg;
    var scale = visualizations.task2.scale;
    var selection = svg.selectAll('g.selector-' + countrySelectorNumber).data([full_dataset[selectedCountry]]);
    for (var attrIndex = 0; attrIndex < attributes.length; ++attrIndex) {
        var attr = attributes[attrIndex].name;
        selection.select('circle[attr="' + attr + '"]')
            .attr('fill', countryColors[countrySelectorNumber])
            .attr('r', 5)
            .attr('cx', 40 * attrIndex + options.padding)
            .attr('cy', function (d, i) {
                if (d[attr] == '-1')
                    return -100000;
                if (attr.endsWith('_diff')) {
                    var attrParent = attr.substr(0, attr.indexOf('_diff'));
                    if (d[attrParent + '_male'] == '-1' || d[attr + '_female'] == '-1')
                        return -100000;
                }
                return scale[attr](parseFloat(d[attr].replace(/,/g, '.')));
            })
            .attr('opacity', 0.6);
    }
}

function changeSelectedCountry(countrySelectorNumber, selectedCountry) {
    updateTask2(countrySelectorNumber, selectedCountry);
}

$('#country-selection-one').change(function() {
    changeSelectedCountry(1, $(this).find('option:selected').attr('value'));
});

$('#country-selection-two').change(function() {
    changeSelectedCountry(2, $(this).find('option:selected').attr('value'));
});

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

    var country1 = getSelectedText("country-selection-one");
    var country2 = getSelectedText("country-selection-two");
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