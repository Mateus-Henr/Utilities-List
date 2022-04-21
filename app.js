const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const fs = require("fs");
const cheerio = require("cheerio");

const ROOT_FOLDER = "/public";
const INDEX_HTML = "/index.html";
const DB_JSON = "/db.json";
const MOCKUP_IMG = "https://cdn.pixabay.com/photo/2016/04/24/22/30/monitor-1350918_960_720.png";
const ID = "#";
const DOT = ".";
const SET_OF_ITEM_POSFIX = "-cards";

const app = express();
const port = 3000;

const $ = cheerio.load(fs.readFileSync(__dirname + INDEX_HTML));

var items = getInicialData();

app.use(express.static(__dirname + ROOT_FOLDER));
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
    deleteItem(jsonData, req.body.element);
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
    section: req.body.section,
    imgURL: undefined,
    person: req.body.person,
    status: req.body.status
  }

  let idxItem = findItemIdx(jsonData, newItem);

  if (idxItem !== -1)
  {
    if (req.body.inputURL)
    {
      newItem.imgURL = req.body.inputURL;
    }
    else if (req.body.numberPic === 0)
    {
      newItem.imgURL = jsonData[idxItem].imgURL;
    }
    else
    {
      newItem.imgURL = await makeAPIRequestForImg(req.body.name, req.body.numberPic);
    }

    $(ID + getItemID(jsonData[idxItem])).replaceWith(createNewCard(newItem));
    jsonData[idxItem] = JSON.parse(JSON.stringify(newItem));
  }
  else
  {
    $(DOT + newItem.section + SET_OF_ITEM_POSFIX).append(createNewCard(newItem));
    jsonData.push(newItem);
  }
}


function deleteItem(jsonData, reqJsonElement)
{
  let idxItem = findItemIdx(jsonData, JSON.parse(reqJsonElement));

  if (idxItem === -1)
  {
    return;
  }

  $(getItemID(jsonData[idxItem])).remove();
  jsonData.splice(idxItem, 1);
}


async function makeAPIRequestForImg(itemName, numberPic)
{
  const API_URL = `https://www.flickr.com/services/rest/?method=flickr.photos.search&content_type=1&sort=relevance&safe_search=1&per_page=100&api_key=4078ad7212fee5414207d899c8bb9b74&format=json&nojsoncallback=1&text=${itemName}`;

  const {data} = await axios.get(API_URL);

  if (data.photos.total === 0 || data.photos.total <= numberPic)
  {
    return MOCKUP_IMG;
  }

  return `http://live.staticflickr.com/${data.photos.photo[numberPic].server}/${data.photos.photo[numberPic].id}_${data.photos.photo[numberPic].secret}_n.jpg`;
}


async function getInicialData()
{
  const listOfItems = JSON.parse(await fs.promises.readFile(__dirname + DB_JSON, "utf8"));

  for (let item of listOfItems)
  {
    $(DOT + item.section + SET_OF_ITEM_POSFIX).append(createNewCard(item));
  }

  return $.root().html();
}


function createNewCard(itemData)
{
  return `<div class="col-lg-2" id="${getItemID(itemData)}">
            <div class="card h-100">
              <img src="${itemData.imgURL}" class="card-img-top itemImg img-responsive" alt="urlIMG">
              <div class="card-body">
                <h5 class="card-title itemName">${itemData.name}</h5>
                <p class="card-text itemPerson">${itemData.person}</p>
                <p><button class="btn btn-danger deleteButton">Delete</button></p>
                <div class="card-footer">
                  <small class="text-muted itemSection">${itemData.section}</small><br>
                  <small class="text-muted">Status <input type="checkbox" ${itemData.status} onClick="return false;"></small>
                </div>
              </div>
            </div>
          </div>`;
}

function getItemID(item)
{
  return item.name + "-" + item.section;
}


function findItemIdx(jsonData, itemToLookFor)
{
  return jsonData.findIndex((element) =>
          {
            return  (JSON.stringify(element.name).normalize() === JSON.stringify(itemToLookFor.name).normalize()) &&
                    (JSON.stringify(element.section).normalize() === JSON.stringify(itemToLookFor.section).normalize())
          });
}


function standardizeName(itemName)
{
  spacelessName = itemName.replace(/\s+/g,' ').trim();

  return spacelessName.charAt(0).toUpperCase() + spacelessName.substr(1, itemName.length).toLowerCase();
}


app.listen(process.env.PORT || port, () => console.log(`Server is up and running on port ${port}.`));
