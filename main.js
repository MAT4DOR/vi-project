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

function initialize() {
    initializeInterface();
    initializeVisualizations();
}

$('#attribute-selection-one li').click(function() {
    var self = $(this);
    self.parent().children('.selected').removeClass('selected');
    self.addClass('selected');

});

$('#tst').click(function(){
    var value = $('.selected').text();
    value = value || 'No row Selected';
    alert(value);
});
