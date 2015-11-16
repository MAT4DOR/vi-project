function highlight(e) {
    if (selected[0]) selected[0].className = '';
    e.target.parentNode.className = 'selected';
    
}

var table = document.getElementById('table'),
    selected = table.getElementsByClassName('selected');
table.onclick = highlight;

function fnselect(){
var $row=$(this).parent().find('td');
    var clickeedID=$row.eq(0).text();
   // alert(clickeedID);
}

$("#tst").click(function(){
    var value =$(".selected td:first").html();
    value = value || "No row Selected";
    alert(value);
});