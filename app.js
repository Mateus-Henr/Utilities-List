const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const fs = require("fs");
const cheerio = require("cheerio");

const INDEX_HTML = "/index.html";
const DB_JSON = "/db.json";
const MOCKUP_IMG = "https://icon-library.com/images/not-found-icon/not-found-icon-18.jpg";

const app = express();
const port = 3000;

const $ = cheerio.load(fs.readFileSync(__dirname + INDEX_HTML));

var items = getInicialData();

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));


app.get("/", async (req, res) =>
{
  res.send(await items);
});


app.post("/", async (req, res) =>
{
  if (!items)
  {
    await items;
  }

  const jsonData = JSON.parse(await fs.promises.readFile(__dirname + DB_JSON, "utf8"));

  if (req.body.action)
  {
    await deleteItem(jsonData, req.body.element);
  }
  else
  {
    await addItem(jsonData, req);
  }

  res.send($.root().html());

  fs.writeFile(__dirname + DB_JSON, JSON.stringify(jsonData), () => {});
});


async function addItem(jsonData, req)
{
  const newItem =
  {
    name: req.body.name,
    imgURL: await makeAPIRequestForImg(req.body.name),
    person: req.body.person,
    status: req.body.status
  }

  $("tbody").append(createNewRow(newItem));
  await jsonData.push(newItem);
}


async function deleteItem(jsonData, reqJsonElement)
{
  let idxItem = jsonData.findIndex((element) => JSON.stringify(element).normalize() === JSON.stringify(JSON.parse(reqJsonElement)).normalize());

  if (idxItem === -1)
  {
    return;
  }

  // Removing item from array and virtual DOM.
  jsonData.splice(idxItem, 1);
  await $($($("tbody")).children()[idxItem]).remove();
}


async function makeAPIRequestForImg(itemName)
{
  const IMG_URL = `https://pixabay.com/api/?key=26716436-4977a45d463ec155d02d2729e&safesearch=true&image_type=photo&per_page=3&q=${itemName}`;

  const {data} = await axios.get(IMG_URL);

  if (data.total == 0)
  {
    return MOCKUP_IMG;
  }

  return await data.hits[0].previewURL;
}


async function getInicialData()
{
  const listOfItems = JSON.parse(await fs.promises.readFile(__dirname + DB_JSON, "utf8"));

  for (let item of listOfItems)
  {
    $("tbody").append(createNewRow(item));
  }

  return $.root().html();
}


function createNewRow(itemData)
{
  return `<tr>
            <th scope="row"><img class="utility-img" src="${itemData.imgURL}"></th>
            <td class="itemName">${itemData.name}</td>
            <td class="itemPerson">${itemData.person}</td>
            <td class="itemStatus"><input type="checkbox" ${itemData.status}></td>
            <td><button class="deleteButton">Delete</button></td>
          </tr>`;
}


app.listen(process.env.PORT || port, () => console.log(`Server is up and running on port ${port}.`));
