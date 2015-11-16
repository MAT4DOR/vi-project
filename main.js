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
    // TODO: create svgs and put them on screen
}

function changeVisualizations() {
    var value = $('.selected').attr("data-id");
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
