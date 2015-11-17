var full_dataset;

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
}

function initializeVisualizations() {

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
    var svg = d3.select("#charts");
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

$('#tst').click(function(){
    var value = $('.selected').text();
    value = value || 'No row Selected';
    alert(value);
});

function getSelectedText(elementId) {
    var elt = document.getElementById(elementId);

    if (elt.selectedIndex == -1)
        return null;

    return elt.options[elt.selectedIndex].text;
}