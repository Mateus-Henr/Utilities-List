$(".deleteButton").click(deleteElement);


function deleteElement(evt)
{
  const xhr = new XMLHttpRequest();
  const htmlCode = $(this).parent().parent().parent().parent().html();

  xhr.onreadystatechange = () =>
  {
    if (xhr.readyState == 4 && xhr.status == 200)
    {
      setTimeout(() => window.location.href = window.location.href, 1000);
    }
  };
  xhr.open("POST", window.location.href, false);
  xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
  xhr.send(`action=delete&element=${transformToFormat(htmlCode)}`);
}


function transformToFormat(htmlCode)
{
  const $code = $(htmlCode);

  const item =
  {
    name: $code.find(".itemName").text(),
    imgURL: $code.find(".itemImg").prop("src"),
    person: $code.find(".itemPerson").text(),
    status: $code.find(".itemStatus").text()
  }

  return JSON.stringify(item);
}
