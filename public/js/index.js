const SERVER_URL = "http://localhost:3000/";

$(".deleteButton").click(deleteElement);

function deleteElement(evt)
{
  var xhr = new XMLHttpRequest();
  const htmlCode = $(this).parent().parent().html();

  xhr.open("POST", SERVER_URL, true);
  xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
  xhr.send(`action=delete&element=${transformToFormat(htmlCode)}`);
}

function transformToFormat(htmlCode)
{
  const code = $.parseHTML(htmlCode);

  const item =
  {
    name: $(code).filter(".itemName").text(),
    imgURL: $($($(code).filter("th")[0]).html()).prop("src"),
    person: $(code).filter(".itemPerson").text(),
    status: $(code).filter(".itemStatus").text()
  }

  return JSON.stringify(item);
}
