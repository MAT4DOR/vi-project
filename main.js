var full_dataset;
var visualizations = {};
var countryColors = ['#f50', '#0f5'];
var attributeColors = ['#7bf', '#fd4'];
var visAttributeSelected = ['gii_value', 'gii_rank'];

var attributes = [
    {col: 'gii_value', shortname:'GII Value', fullname: 'Gender Inequality Index Value', max:1},
    {col: 'gii_rank', shortname:'GII Rank', fullname: 'Gender Inequality Index Rank', max:-1},
    {col: 'mmr', shortname:'Maternal Mortality', fullname: 'Maternal Mortality Ratio', max:-1},
    {col: 'abr', shortname:'Adolencent Births', fullname: 'Adolescent Birth Rate', max:-1},
    {col: 'ssp', shortname:'Seats Parliament', fullname: 'Share of seats in national parliament', max:100},
    {col: 'edu_female', shortname:'Education Female', fullname: 'Education Female', max:100},
    {col: 'edu_male', shortname:'Education Male', fullname: 'Gender Education Male', max:100},
    {col: 'edu_diff', shortname:'Education Difference', fullname: 'Difference Female-Male Education', max:100},
    {col: 'labour_female', shortname:'Labour Female', fullname: 'Labour Rate Female', max:100},
    {col: 'labour_male', shortname:'Labour Male', fullname: 'Labour Rate Male', max:100},
    {col: 'labour_diff', shortname:'Labour Difference', fullname: 'Difference Female-Male Labour Rate', max:100},
    {col: 'human-development', shortname:'Human Development', fullname: 'Human Development', max: undefined},
];
var availableMapCountries = ["Norway","Australia","Switzerland","Netherlands","United States of America","Germany","New Zealand","Canada","Singapore","Denmark","Ireland","Sweden","Iceland","United Kingdom","Hong Kong, China (SAR)","North Korea","Japan","Liechtenstein","Israel","France","Austria","Belgium","Luxembourg","Finland","Slovenia","Italy","Spain","Czech Republic","Greece","Brunei","Qatar","Cyprus","Estonia","Saudi Arabia","Lithuania","Poland","Andorra","Slovakia","Malta","United Arab Emirates","Chile","Portugal","Hungary","Bahrain","Cuba","Kuwait","Croatia","Latvia","Argentina","Uruguay","The Bahamas","Montenegro","Belarus","Romania","Libya","Oman","Russia","Bulgaria","Barbados","Palau","Antigua and Barbuda","Malaysia","Mauritius","Trinidad and Tobago","Lebanon","Panama","Venezuela","Costa Rica","Turkey","Kazakhstan","Mexico","Seychelles","Saint Kitts and Nevis","Sri Lanka","Iran","Azerbaijan","Jordan","Republic of Serbia","Brazil","Georgia","Grenada","Peru","Ukraine","Belize","The former Yugoslav Republic of Macedonia","Bosnia and Herzegovina","Armenia","Fiji","Thailand","Tunisia","China","Saint Vincent and the Grenadines","Algeria","Dominica","Albania","Jamaica","Saint Lucia","Colombia","Ecuador","Suriname","Tonga","Dominican Republic","Maldives","Mongolia","Turkmenistan","Samoa","Palestine, State of","Indonesia","Botswana","Egypt","Paraguay","Gabon","Bolivia (Plurinational State of)","Moldova","El Salvador","Uzbekistan","Philippines","South Africa","Syria","Iraq","Guyana","Vietnam","Cape Verde","Micronesia (Federated States of)","Guatemala","Kyrgyzstan","Namibia","East Timor","Honduras","Morocco","Vanuatu","Nicaragua","Kiribati","Tajikistan","India","Bhutan","Cambodia","Ghana","Laos","Republic of the Congo","Zambia","Bangladesh","Sao Tome and Principe","Equatorial Guinea","Nepal","Pakistan","Kenya","Swaziland","Angola","Myanmar","Rwanda","Cameroon","Nigeria","Yemen","Madagascar","Zimbabwe","Papua New Guinea","Solomon Islands","Comoros","United Republic of Tanzania","Mauritania","Lesotho","Senegal","Uganda","Benin","Sudan","Togo","Haiti","Afghanistan","Djibouti","Côte d'Ivoire","Gambia","Ethiopia","Malawi","Liberia","Mali","Guinea Bissau","Mozambique","Guinea","Burundi","Burkina Faso","Eritrea","Sierra Leone","Chad","Central African Republic","Democratic Republic of the Congo","Niger","South Korea","Marshall Islands","Monaco","Nauru","San Marino","Somalia","South Sudan","Tuvalu"];
var lastSelectedMapCountry = "AFG";
var selectionIndex = 0;
var selectedCountries = ["Afghanistan", "Afghanistan"];
var selectedCountriesId = ["AFG","AFG"];
var countryIdMap = [];

var mapBackgroundColor = "#8DCDE3";
var country0Color = "#FF5500";
var country1Color = "#00FF55";
var mapHoverColor = "rgb(255,150,0)";
var mapUnavailableColor = "rgb(50,50,50)";

var dsv = d3.dsv(';', 'text/plain');
dsv('gender_inequality.csv', function (data) {
    full_dataset = data;
    initialize();
    var map = new Datamap({
         element: document.getElementById('container'),
        geographyConfig: {
            popupOnHover: true,
            highlightOnHover: false,
            popupTemplate: function(geo, data) {
                if(availableMapCountries.indexOf(geo.properties.name) == -1){
                    return ['<div class="hoverinfo" style="color: red"><strong>',
                        geo.properties.name + ": ",
                        'Unavailable data',
                        '</strong></div>'].join('');
                }else{
                     return ['<div class="hoverinfo"><strong>',
                        geo.properties.name,
                        '</strong></div>'].join('');
                }
               
            }
        },
        element: document.getElementById('container'),
        done: function(datamap) {
            var counter = 0;
            datamap.svg.selectAll('.datamaps-subunit').each(function(geography){
                if(availableMapCountries.indexOf(geography.properties.name) == -1){
                    $(this).css("fill",mapUnavailableColor);
                }else{
                    $(this).css("fill",mapBackgroundColor);
                    countryIdMap[counter++] = [geography.properties.name, geography.id];
                }
            });
            console.log(countryIdMap);
            datamap.svg.selectAll('.datamaps-subunit').on('click', function(geography) {
                for (var i = 0; i < full_dataset.length; ++i) {
                    if(full_dataset[i]["country"] == geography.properties.name){
                        $("#country-selection-"+selectionIndex).val(i);
                        changeSelectedCountry(selectionIndex, i);
                    }
                }
            });
            datamap.svg.selectAll('.datamaps-subunit').on('mouseenter', function(geography) {
                var countryName = geography.properties.name;
                if(availableMapCountries.indexOf(countryName) != -1){
                    if(selectedCountries.indexOf(countryName) == -1){
                        $(this).css("fill",mapHoverColor);           
                    }
                }   
            });
            datamap.svg.selectAll('.datamaps-subunit').on('mouseleave', function(geography) {
                var countryName = geography.properties.name;
                if(availableMapCountries.indexOf(countryName) != -1){
                    if(selectedCountries.indexOf(countryName) == -1){
                        $(this).css("fill",mapBackgroundColor);       
                    }
                }   
            });
        }
    });
});

function changeSelectedCountryInMap(countryCount){
    var countryName = full_dataset[countryCount]["country"];
    var lastSelectedId = selectedCountriesId[selectionIndex];
    $("path.datamaps-subunit."+lastSelectedId).css("fill",mapBackgroundColor);
    if(availableMapCountries.indexOf(countryName) != -1){
        var countryId = getCountryId(countryName);
        if(countryId != "NULL"){
            selectedCountries[selectionIndex] = countryName;
            selectedCountriesId[selectionIndex] = countryId;
            if(selectionIndex == 0){
                $("path.datamaps-subunit."+countryId).css("fill",country0Color);
            }
            else{
                $("path.datamaps-subunit."+countryId).css("fill",country1Color);  
            }
        }
    }
}

function getCountryId(countryName){
    for(i = 0; i < countryIdMap.length; ++i){
        if(countryIdMap[i][0] == countryName)
            return countryIdMap[i][1];
    }
    return "NULL";
}

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

    var attributesSVG = d3.select('#attribute-selection').append('svg');
    var width = 180;
    attributesSVG.attr('width', width).attr('height', attributes.length * 17 - 1).attr('id', 'attribute-selector');
    var enterSelection = attributesSVG.selectAll('g').data(attributes).enter();
    var group = enterSelection.append('g');

    for (var n = 0; n < attributeColors.length; ++n) {
        group.append('rect')
            .attr('x', n * (width / attributeColors.length))
            .attr('y', function(d, i) { return i*17; })
            .attr('width', width / attributeColors.length)
            .attr('height', 16)
            .attr('fill', attributeColors[n])
            .attr('opacity', '0.5')
            .attr('class', 'selection-mark')
            .attr('data-attrcol', n)
            .attr('data-attr', function(d, i) { return d['col']; })
            .attr('display', function(d) { return visAttributeSelected[n] == d['col'] ? 'inline' : 'none'});
    }

    group.append('text')
        .attr('x', width/2)
        .attr('y', function(d, i) { return (i+1)*17 - 5; })
        .attr('class', 'axistext')
        .attr('fill', 'black').attr('text-anchor', 'middle').text(function(d, i) { return d['fullname']; });
    for (var n = 0; n < attributeColors.length; ++n) {
        group.append('rect')
            .attr('x', n * (width / attributeColors.length))
            .attr('y', function(d, i) { return i*17; })
            .attr('width', width / attributeColors.length)
            .attr('height', 16)
            .attr('fill', attributeColors[n])
            .attr('opacity', '0.14')
            .attr('data-attrcol', n)
            .attr('data-attr', function(d, i) { return d['col']; })
            .attr('style', 'cursor: pointer')
            .on('click', function() {
                var thisEl = $(this);
                changeAttribute(thisEl.attr('data-attrcol'), thisEl.attr('data-attr'));
            });
    }
}

function initializeVisualizations() {
    
    initTask1();
    initTask2();
    initHorizontalDivergentBar();
    initTask5();
    initTask3();
}

function initTask2() {
    var options = {
        width: 700,
        height: 300,
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
                changeAttribute(0, $(this).attr('attr'));
            });
    }

    svg.selectAll('circle.to-remove').remove();
    visualizations.task2 = { options: options, attributes: attributes, svg: svg, scaleY: scaleY, scaleX: scaleX };
    
    for (var countrySelectorNumber = 0; countrySelectorNumber < countryColors.length; ++countrySelectorNumber) {
        var group = svg.append('g').attr('class', 'selector-' + countrySelectorNumber);
        for (var attrIndex = 0; attrIndex < attributes.length; ++attrIndex) {
            var attr = attributes[attrIndex].col;
            var maxRank = attributes[attrIndex].maxRank;
            
            var tip = d3.tip()
                .attr('class', 'd3-tip')
                .offset([-10, 0])
                .html(function(d) {
                    return "<strong>Rank:</strong> <span>" + d['rank_' + attr] + '/' + maxRank + "</span>";
                });
            svg.call(tip);
            
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
                .attr('attr', attr)
                .on('mouseover', tip.show)
                .on('mouseout', tip.hide);

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

    for (var attrNum = 0; attrNum < attributeColors.length; ++attrNum) {
        updateAttributeTask2(attrNum, visAttributeSelected[attrNum]);
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
    changeSelectedCountryInMap(selectedCountry);
    updateTask2(countrySelectorNumber, selectedCountry);
    updateTask1(countrySelectorNumber, selectedCountry);
    updateTask3(countrySelectorNumber, selectedCountry);
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
    var h = 350 - margin.top - margin.bottom;

    var selectedAttr = visAttributeSelected[0];

    var svg = d3.select("#task4");
    svg = svg.append("svg")
            .attr("width",w)
            .attr("height",h);

    visualizations.task4 = {svg: svg};

    var shortenedDataset = [0, 1, 2, 3, 4, 5]; // 6 dummy objects to init the svg
    svg.selectAll("rect")
        .data(shortenedDataset)
        .enter().append("rect")
        .attr("fill","white")
        .on('click', function() {
          var country = $(this).attr('data-country');
          for (var i = 0; i < full_dataset.length; ++i) {
              if(full_dataset[i]["country"] == country){
                  $("#country-selection-"+selectionIndex).val(i);
                  changeSelectedCountry(selectionIndex, i);
                  break;
              }
          }
        });


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
    var h = 350 - margin.top - margin.bottom;

    var selectedAttr = visAttributeSelected[0];

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
        .style("visibility", function(d) { return "visible"; })
        .attr('data-country', function(d) { return d.country; })
        .transition()   
        .duration(1000) 
        .attr("width",function(d) { return Math.abs(x(parseValue(d[selectedAttr], 4)) - x(0)); })
        .attr("height",20)
        .attr("fill","purple")
        .attr("x",function(d) { return x(Math.min(parseValue(d[selectedAttr], 4), 0)); })
        .attr("y",function(d, i) { return i>=3 ? i*(21 + 16) + 42 : i*(21 + 16); })
        .attr("fill",function(d, i) { return i==0 ? "green" : i==shortenedDataset.length-1 ? "red" : "blue" });

    svg.selectAll("text.t4Values")
        .data(shortenedDataset)
        .style("visibility", function(d) {
                return "visible";
              })
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

function initTask3() {
    var margin = {top: 20, right: 20, bottom: 30, left: 20};
    var w = 650 - margin.left - margin.right;
    var h = 350 - margin.top - margin.bottom;

    var svg = d3.select("#task3");
    svg = svg.append("svg")
            .attr("width",w)
            .attr("height",h);

    visualizations.task3 = {svg: svg};

    svg.selectAll("rect")
        .data(full_dataset)
        .enter().append("rect")
        .attr("fill","white");

    for (var n = 0; n < 2; ++n) {
        updateTask3(n, $('#country-selection-' + n).find('option:selected').attr('value'));
    }
}

function updateTask3(countrySelectorNumber, selectedCountry) {
    var margin = {top: 20, right: 20, bottom: 30, left: 20};
    var w = 650 - margin.left - margin.right;
    var h = 350 - margin.top - margin.bottom;

    var selectedAttr = visAttributeSelected[0];
    var attr = findAttributeByCol(selectedAttr);

    var svg = visualizations.task3.svg;

    var min = selectedAttr.endsWith('_diff') ? -attr.max : 0;
    var y = d3.scale.linear().domain([attr.max, min]).range([50, h-50]);

    svg.selectAll("rect")
        .data(full_dataset)
        .transition()   
        .duration(1000) 
        .attr("width",2)
        .attr("height",function(d) { return Math.abs(y(parseValue(d[selectedAttr], 4)) - y(0)); })
        .attr("x", function(d, i) { return i*3; })
        .attr("y", function(d, i) { return y(Math.max(parseValue(d[selectedAttr], 4), 0)); })
        .attr("fill",function(d, i) { return (isMissingValue(d, selectedAttr) ? 'white' : (i == selectedCountry ? countryColors[countrySelectorNumber] : 'red'));  }); //different color for selected countries
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
      .attr("fill",country0Color).append('title').text('');

     svg.append("rect")
      .attr("class", "bar")
      .attr("id", "barCountry1")
      .attr("x", 40)
      .attr("width", 30)
      .attr("fill",country1Color).append('title').text('');

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
        .attr('stroke-width', 1).attr('stroke', 'black')
        .attr('y1', centerY).attr('y2', centerY);

    for (var n = 0; n < 2; ++n) {
        updateTask1(n, $('#country-selection-' + n).find('option:selected').attr('value'));
    }
}

function updateTask1(countrySelectorNumber, selectedCountry) {
    var svg = visualizations.task1.svg;
    var width = visualizations.task1._width;
    var height = visualizations.task1._height;
    var barMaxHeight = visualizations.task1.barMaxHeight;
    var centerY = visualizations.task1.centerY;

    var selectedAttr = visAttributeSelected[0];
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
}

function initTask5() {
    var options = {
        width: 700,
        height: 220,
        paddingLeft: 10,
        paddingTop: 40,
        paddingBottom: 5,
        paddingRight: 10
    }

    var svg = d3.select('#task5').append('svg');
    svg.attr('width', options.width).attr('height', options.height);

    var x = d3.scale.linear().domain([1, full_dataset.length]).range([options.paddingLeft, options.width-options.paddingRight]);

    for(var i = 0; i < attributeColors.length; ++i) {
        svg.append('path').attr('id', 'task5_a' + i).attr('stroke', attributeColors[i]).attr('class', 'line chart').attr('opacity', 0.8);
        svg.append('g').attr('id', 'task5_g' + i)
            .selectAll('circle')
            .data(full_dataset)
            .enter()
            .append('circle')
            .attr('fill', attributeColors[i])
            .attr('r', 1.5)
            .attr('cx', function(d, index) { return x(index + 1); })
            .attr('cy', options.height + 5);
    }
    var x1 = x(full_dataset.length - 8)+1.5;
    svg.append('line')
        .attr('x1', x1)
        .attr('x2', x1)
        .attr('y1', options.height-options.paddingBottom)
        .attr('y2', options.paddingTop)
        .attr('stroke-dasharray', '10, 10');

    svg.append('line')
        .attr('x1', options.paddingLeft)
        .attr('x2', options.width-options.paddingRight)
        .attr('y1', options.height-options.paddingBottom)
        .attr('y2', options.height-options.paddingBottom);

    var controlsGroup = svg.append('g').attr('class', 'svg-button');
    var sparkLen = 5;
    var sparkX = d3.scale.linear().domain([0, sparkLen-1]).range([10, 40]);
    var sparkY = d3.scale.linear().domain([1, 20]).range([10, 20]);
    var vals = [1,15,5,12,6];
    var line = d3.svg.line()
        .x(function(d, i) { return sparkX(i); })
        .y(function(d) { return sparkY(d); });
    controlsGroup.append('path')
        .datum(vals)
        .attr("stroke", '#f00')
        .attr('class', 'line')
        .attr('d', line);

    controlsGroup.append('g')
        .selectAll('circle')
        .data(vals)
        .enter()
        .append('circle')
        .attr('fill', '#f00')
        .attr('r', 1.5)
        .attr('cx', function(d, i) { return sparkX(i); })
        .attr('cy', function(d) { return sparkY(d); });
        
    controlsGroup.append('g')
        .selectAll('circle')
        .data(vals)
        .enter()
        .append('circle')
        .attr('fill', '#f00')
        .attr('r', 1.5)
        .attr('cx', function(d, i) { return sparkX(i) + 35; })
        .attr('cy', function(d) { return sparkY(d); });
        
    controlsGroup.append('rect')
        .attr('x', 8)
        .attr('y', 8)
        .attr('width', 34)
        .attr('height', 14)
        .attr('opacity', 0.3)
        .on('click', function() {
            controlsGroup.selectAll('rect').attr('opacity', 0.1);
            $(this).attr('opacity', 0.3);
            $(this).parent().parent().children('path.chart').attr('class', function(index, classNames) {
                if (classNames.indexOf('hide') != -1)
                    return classNames.replace('hide', '');
                return classNames;
            });
        });
        
    controlsGroup.append('rect')
        .attr('x', 8+35)
        .attr('y', 8)
        .attr('width', 34)
        .attr('height', 14)
        .attr('opacity', 0.1)
        .on('click', function() {
            controlsGroup.selectAll('rect').attr('opacity', 0.1);
            $(this).attr('opacity', 0.3);
            $(this).parent().parent().children('path.chart').attr('class', function(index, classNames) {
                if (classNames.indexOf('hide') != -1)
                    return classNames;
                return classNames + ' hide';
            });
        });
    
    var methods = [
        'linear',
        'basis',
        'bundle',
        'cardinal',
        'monotone'
    ];

    var startX = 100;
    var group = svg.append('g').attr('class', 'svg-button interpolate-method');
    for (var i = 0; i < methods.length; ++i) {
      group.append('text')
          .attr('x', 51 * i + 25 + startX)
          .attr('y', 18)
          .attr('text-anchor', 'middle')
          .attr('class', i == 0 ? 'selected' : '')
          .attr('data-mid', i)
          .text(methods[i]);
      group.append('rect')
          .attr('x', 51 * i + startX)
          .attr('y', 8)
          .attr('width', 50)
          .attr('height', 14)
          .attr('class', i == 0 ? 'selected' : '')
          .attr('opacity', i == 0 ? 0.3 : 0.1)
          .attr('data-mid', i)
          .on('click', function() {
              // deselect all
              group.selectAll('rect').attr('opacity', 0.1).attr('class', '');
              group.selectAll('text').attr('class', '');
              // select the correct one
              group.select('text[data-mid="' + $(this).attr('data-mid') + '"]').attr('class', 'selected');
              $(this).attr('opacity', 0.3).attr('class', 'selected');
              
              for (var i = 0; i < attributeColors.length; ++i) {
                  var attr = visAttributeSelected[i];
                  updateAttributeTask5(i, attr, true);
              }
          });
    }
    visualizations.task5 = {svg: svg, options: options};

    for (var i = 0; i < attributeColors.length; ++i) {
        var attr = visAttributeSelected[i];
        updateAttributeTask5(i, attr, true);
    }

}

function updateAttributeTask5(attributeNum, selectedAttribute, dontTransition) {
    var options = visualizations.task5.options;
    var svg = visualizations.task5.svg;

    var attribute = findAttributeByCol(selectedAttribute);

    var x = d3.scale.linear().domain([1, full_dataset.length]).range([options.paddingLeft, options.width-options.paddingRight]);
    var y = d3.scale.linear().domain([selectedAttribute.endsWith('_diff') ? -1 : 0, 1]).range([options.height-options.paddingBottom, options.paddingTop]);

    var line = d3.svg.line()
        .interpolate(svg.select('.interpolate-method text.selected').text())
        .x(function(d, i) { return x(i+1); })
        .y(function(d) { return y(parseValue(d[selectedAttribute], 4) / attribute.max); })
        .defined(function(d) { return !isMissingValue(d, selectedAttribute); });

    var circles = svg.selectAll('#task5_g' + attributeNum + ' circle').data(full_dataset);
    var path =  svg.select('#task5_a' + attributeNum).datum(full_dataset.slice(0, full_dataset.length-8));
    if (dontTransition != true) {
        circles = circles.transition().duration(1000);
        path = path.transition().duration(1000);
    }

    circles.attr('cy', function(d) { return isMissingValue(d, selectedAttribute) ? options.height + 5 : y(parseValue(d[selectedAttribute], 4) / attribute.max); });
    path.attr('d', line);
}

function isMissingValue(d, attr) {
    if (d[attr] == '-1')
        return true;
    if (attr.endsWith('_diff')) {
        var attrParent = attr.substr(0, attr.indexOf('_diff'));
        if (d[attrParent + '_male'] == '-1' || d[attrParent + '_female'] == '-1')
            return true;
    }
    return false;
}

function initialize() {
    initializeData();
    initializeInterface();
    initializeVisualizations();
}

function changeAttribute(attributeNum, selectedAttribute) {
    var allSelectionMarks = '.selection-mark[data-attrcol="' + attributeNum + '"]';
    $('#attribute-selector').find(allSelectionMarks).attr('display', 'none');
    var selectionMark = allSelectionMarks + '[data-attr="' + selectedAttribute + '"]';
    $('#attribute-selector').find(selectionMark).attr('display', 'inline');
    updateAttribute(attributeNum, selectedAttribute);
}

function updateAttribute(attributeNum, selectedAttribute) {
    visAttributeSelected[attributeNum] = selectedAttribute;

    if (attributeNum == 0) {
        for (var n = 0; n < 2; ++n) {
            var country = $('#country-selection-' + n).find('option:selected').attr('value');
            updateTask1(n, country);
            updateTask3(n, country);
        }

        if(selectedAttribute != "human-development"){
            updateHorizontalDivergentBar();
        } else
            hideHorizontalDivergentBar();
    }
    updateAttributeTask2(attributeNum, selectedAttribute);
    updateAttributeTask5(attributeNum, selectedAttribute);
}
