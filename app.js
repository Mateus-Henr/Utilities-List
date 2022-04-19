const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const fs = require("fs");
const cheerio = require("cheerio");

const INDEX_HTML = "/index.html";
const DB_JSON = "/db.json";
const MOCKUP_IMG = "https://cdn.pixabay.com/photo/2016/04/24/22/30/monitor-1350918_960_720.png";
const SET_OF_ITEMS = ".cards";

const app = express();
const port = 3000;

const $ = cheerio.load(fs.readFileSync(__dirname + INDEX_HTML));

var items = getInicialData();

app.use(express.static(__dirname + "/public"));
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

  console.log(req.body);

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
    name: standardizeName(req.body.name),
    imgURL: await makeAPIRequestForImg(req.body.name),
    person: req.body.person,
    status: req.body.status
  }

  let idxItem = jsonData.findIndex((element) => element.name.normalize() === newItem.name.normalize());

  if (idxItem !== -1)
  {
    jsonData[idxItem].status = newItem.status;
  }
  else
  {
    $(SET_OF_ITEMS).append(createNewRow(newItem));
    await jsonData.push(newItem);
  }
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
  await $($($(SET_OF_ITEMS)).children()[idxItem]).remove();
}


async function makeAPIRequestForImg(itemName)
{
  const IMG_URL = `https://pixabay.com/api/?key=26716436-4977a45d463ec155d02d2729e&safesearch=true&image_type=photo&per_page=3&q=${itemName}`;

  const {data} = await axios.get(IMG_URL);

  if (data.total === 0)
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
    $(SET_OF_ITEMS).append(createNewRow(item));
  }

  return $.root().html();
}


function createNewRow(itemData)
{
  return `<div class="col">
            <div class="card h-100">
              <img src="${itemData.imgURL}" class="card-img-top itemImg img-responsive" alt="urlIMG">
              <div class="card-body">
                <h5 class="card-title itemName">${itemData.name}</h5>
                <p class="card-text itemPerson">${itemData.person}</p>
                <p><button class="btn btn-primary deleteButton">Delete</button></p>
                <div class="card-footer">
                  <small class="text-muted">Status <input type="checkbox" ${itemData.status} onClick="return false;"></small>
                </div>
              </div>
            </div>
          </div>`;
  // return `<tr>
  //           <th scope="row"><img class="utility-img" src="${itemData.imgURL}"></th>
  //           <td class="itemName">${itemData.name}</td>
  //           <td class="itemPerson">${itemData.person}</td>
  //           <td class="itemStatus"><input type="checkbox" ${itemData.status}></td>
  //           <td><button class="deleteButton">Delete</button></td>
  //         </tr>`;
}


function standardizeName(itemName)
{
  return itemName.charAt(0).toUpperCase() + itemName.substr(1, itemName.length).toLowerCase();
}


app.listen(process.env.PORT || port, () => console.log(`Server is up and running on port ${port}.`));
