$(".deleteButton").click(deleteElement);


function deleteElement(evt)
{
  const xhr = new XMLHttpRequest();
  const htmlCode = $(this).parent().parent().parent().parent().html();

  xhr.onreadystatechange = () =>
  {
    if (xhr.readyState == 4 && xhr.status == 200)
    {
      window.location.href = window.location.href;
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
    name: $code.find(".item-name").text(),
    section: $code.find(".item-section").text(),
    imgURL: $code.find(".item-img").prop("src"),
    person: $code.find(".item-person").text(),
    status: $code.find(".item-status").text()
  }

  return JSON.stringify(item);
}
