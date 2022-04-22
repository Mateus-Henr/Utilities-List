const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const fs = require("fs");
const cheerio = require("cheerio");
const {MongoClient} = require('mongodb');

const ROOT_FOLDER = "/public";
const INDEX_HTML = "/index.html";
const DB_JSON = "/db.json";
const MOCKUP_IMG = "https://cdn.pixabay.com/photo/2016/04/24/22/30/monitor-1350918_960_720.png";
const ID = "#";
const DOT = ".";
const SET_OF_ITEM_POSFIX = "-cards";
const URI = process.env.MONGODB_URI;

const client = new MongoClient(URI);
const app = express();
const port = 3000;

app.use(express.static(__dirname + ROOT_FOLDER));
app.use(bodyParser.urlencoded({extended: true}));

app.get("/", async (req, res) =>
{
  res.send(await getData());
});


app.post("/", async (req, res) =>
{
  if (req.body.action)
  {
    await deleteItem(req.body.element);
  }
  else
  {
    await addItem(req);
  }

  res.send(await getData());
});


async function addItem(req)
{
  try
  {
    await client.connect();

    const database = client.db("listOfUtilities");
    const utilities = database.collection("utilities");

    const query = {name: req.body.name, section: req.body.section};

    const foundItem = await utilities.findOne(query);

    if (foundItem)
    {
      const editedItem =
      {
        $set:
        {
          imgURL: undefined,
          person: req.body.person,
          status: req.body.status
        }
      }

      if (req.body.inputURL)
      {
        editedItem.imgURL = req.body.inputURL;
      }
      else if (req.body.numberPic === 0)
      {
        editedItem.imgURL = foundItem.imgURL;
      }
      else
      {
        editedItem.imgURL = await makeAPIRequestForImg(req.body.name, req.body.numberPic);
      }

      await utilities.updateOne(query, editedItem);
    }
    else
    {
      const newItem =
      {
        name: standardizeName(req.body.name),
        section: req.body.section,
        imgURL: undefined,
        person: req.body.person,
        status: req.body.status
      }

      if (req.body.inputURL)
      {
        newItem.imgURL = req.body.inputURL;
      }
      else
      {
        newItem.imgURL = await makeAPIRequestForImg(req.body.name, req.body.numberPic);
      }

      await utilities.insertOne(newItem);
    }
  }
  finally
  {
    await client.close();
  }
}


async function deleteItem(reqJsonElement)
{
  const itemToBeRemoved = JSON.parse(reqJsonElement);

  try
  {
    await client.connect();

    const database = client.db("listOfUtilities");
    const utilities = database.collection("utilities");

    const query = {name: itemToBeRemoved.name, section: itemToBeRemoved.section};

    await utilities.deleteOne(query);
  }
  finally
  {
    await client.close();
  }
}


async function makeAPIRequestForImg(itemName, numberPic)
{
  const API_URL = "https://www.flickr.com/services/rest/?" +
                  "method=flickr.photos.search&" +
                  "content_type=1&" +
                  "sort=relevance&" +
                  "safe_search=1&" +
                  "per_page=100&" +
                  "api_key=4078ad7212fee5414207d899c8bb9b74&" +
                  "format=json&" +
                  "nojsoncallback=1" +
                  "&text=" + itemName;

  const {data} = await axios.get(API_URL);

  if (data.photos.total === 0 || data.photos.total <= numberPic)
  {
    return MOCKUP_IMG;
  }

  return "http://live.staticflickr.com/" +
         data.photos.photo[numberPic].server + "/" +
         data.photos.photo[numberPic].id + "_" + data.photos.photo[numberPic].secret + "_n.jpg";
}


async function getData()
{
  const $ = await cheerio.load(fs.readFileSync(__dirname + INDEX_HTML));

  try
  {
    await client.connect();
    const database = client.db("listOfUtilities");
    const utilities = database.collection("utilities");

    const listOfItems = await utilities.find();

    await listOfItems.forEach((item) => $(DOT + item.section + SET_OF_ITEM_POSFIX).append(createNewCard(item)));
  }
  finally
  {
    await client.close();
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


function standardizeName(itemName)
{
  spacelessName = itemName.replace(/\s+/g,' ').trim();

  return spacelessName.charAt(0).toUpperCase() + spacelessName.substr(1, itemName.length).toLowerCase();
}


app.listen(process.env.PORT || port, () => console.log(`Server is up and running on port ${port}.`));
