$(".deleteButton").click(deleteElement);


async function deleteElement(evt)
{
  var xhr = new XMLHttpRequest();
  const htmlCode = $(this).parent().parent().html();

  xhr.onreadystatechange = () =>
  {
    if (xhr.readyState == 4 && xhr.status == 200)
    {
      setTimeout(() => window.location.href = window.location.href, 500);
    }
  };
  xhr.open("POST", window.location.href, false);
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
