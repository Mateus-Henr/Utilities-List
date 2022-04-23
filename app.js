const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const fs = require("fs");
const cheerio = require("cheerio");
const {MongoClient} = require('mongodb');

const ROOT_FOLDER = "/public";
const INDEX_HTML = "/index.html";
const BACKUP_JSON = "/backup.json";
const MOCKUP_IMG = "https://live.staticflickr.com/509/32122229311_1f43119009_n.jpg";
const SET_OF_SECTION_POSFIX = "-cards";
const CHECKED_STATUS = "checked";
const URI = process.env.MONGODB_URI || "mongodb+srv://myuser:gWtVuLTyXENzxCOs@cluster0.czgi4.mongodb.net/Cluster0?retryWrites=true&w=majority";
const PORT = 3000;

const $ = cheerio.load(fs.readFileSync(__dirname + INDEX_HTML));
const client = new MongoClient(URI);
const app = express();

app.use(express.static(__dirname + ROOT_FOLDER));
app.use(bodyParser.urlencoded({extended: true}));


app.get("/", async (req, res) =>
{
  res.send($.root().html());
});


app.post("/", async (req, res) =>
{
  if (req.body.action)
  {
    await deleteItem(req.body.element);
  }
  else
  {
    await addItem(req.body);
  }

  res.send($.root().html());
});


async function addItem(reqData)
{
  try
  {
    await client.connect();

    const database = client.db("listOfUtilities").collection("utilities");
    const query = {name: standardizeName(reqData.name), section: reqData.section};
    const foundItem = await database.findOne(query);

    if (foundItem)
    {
      const editedItem =
      {
        $set:
        {
          imgURL: undefined,
          person: reqData.person,
          status: reqData.status
        }
      }

      if (reqData.inputURL)
      {
        editedItem.$set.imgURL = reqData.inputURL;
      }
      else if (reqData.numberPic == 0)
      {
        editedItem.$set.imgURL = foundItem.imgURL;
      }
      else
      {
        editedItem.$set.imgURL = await makeAPIRequestForImg(reqData.name, reqData.numberPic);
      }


      await database.updateOne(query, editedItem);

      foundItem.imgURL = editedItem.$set.imgURL;
      foundItem.person = editedItem.$set.person;
      foundItem.status = editedItem.$set.status;

      $(`#${getItemIDName(foundItem)}`).replaceWith(createNewCard(foundItem));
    }
    else
    {
      const newItem =
      {
        name: standardizeName(reqData.name),
        section: reqData.section,
        imgURL: undefined,
        person: reqData.person,
        status: reqData.status
      }

      if (reqData.inputURL)
      {
        newItem.imgURL = reqData.inputURL;
      }
      else
      {
        newItem.imgURL = await makeAPIRequestForImg(reqData.name, reqData.numberPic);
      }

      await database.insertOne(newItem);
      $(`.${newItem.section}${SET_OF_SECTION_POSFIX}`).append(createNewCard(newItem));
    }
  }
  finally
  {
    await client.close();
  }
}


async function deleteItem(itemObject)
{
  const itemToBeRemoved = JSON.parse(itemObject);

  try
  {
    await client.connect();
    const database = client.db("listOfUtilities").collection("utilities");
    const query = {name: itemToBeRemoved.name, section: itemToBeRemoved.section};

    await database.deleteOne(query);
  }
  finally
  {
    await client.close();
  }

  $(`#${getItemIDName(itemToBeRemoved)}`).remove();
}


async function makeAPIRequestForImg(itemName, numberPic)
{
  const API_URL = `https://www.flickr.com/services/rest/?\
                   method=flickr.photos.search&\
                   content_type=1&\
                   sort=relevance&\
                   safe_search=1&\
                   per_page=100&\
                   api_key=4078ad7212fee5414207d899c8bb9b74&\
                   format=json&\
                   nojsoncallback=1&\
                   text=${itemName}`;

  const {data} = await axios.get(API_URL);

  // If no images are retrieved or if the image position doesn't exist.
  if (data.photos.total === 0 || data.photos.total <= numberPic)
  {
    return MOCKUP_IMG;
  }

  return `http://live.staticflickr.com/${data.photos.photo[numberPic].server}/${data.photos.photo[numberPic].id}_${data.photos.photo[numberPic].secret}_n.jpg`;
}


function getItemIDName(item)
{
  return `${item.name}-${item.section}`;
}


async function getInitialData()
{
  const unorganizedListOfItems = await getAllItems();
  const organizedListOfItems = [
                                ...unorganizedListOfItems.filter(({status}) => status === CHECKED_STATUS),
                                ...unorganizedListOfItems.filter(({status}) => status !== CHECKED_STATUS)
                               ];

  // Sorting list by person's name.
  organizedListOfItems.sort((a, b) => a.person.localeCompare(b.person));

  // Adding items to the virtual DOM.
  await organizedListOfItems.forEach((item) => $(`.${item.section}${SET_OF_SECTION_POSFIX}`).append(createNewCard(item)));
}

async function getAllItems()
{
  let allItems = null;

  try
  {
    await client.connect();
    const database = client.db("listOfUtilities").collection("utilities");
    allItems = await database.find().toArray();
  }
  finally
  {
    await client.close();
  }

  return allItems;
}


function createNewCard(item)
{
  return `<div class="col-lg-2 col-md-4 col-sm-6" id=${getItemIDName(item)}>
            <div class="card h-100">
              <img src="${item.imgURL}" class="card-img-top img-fluid item-img" alt="urlIMG">
              <div class="card-body">
                <h5 class="card-title item-name">${item.name}</h5>
                <p class="card-text item-person">${item.person}</p>
              </div>
              <ul class="list-group list-group-flush">
                <li class="text-muted list-group-item">Status<br><input type="checkbox" ${item.status} onclick="return false;"></li>
                <li class="text-muted item-section">${item.section}</li>
              </ul>
              <div class="card-footer">
                <small><button class="btn btn-danger deleteButton">Delete</button></small>
              </div>
            </div>
          </div>`;
}


function standardizeName(itemName)
{
  const nameWithoutRedundantSpaces = itemName.replace(/\s+/g,' ').trim();

  return nameWithoutRedundantSpaces.charAt(0).toUpperCase() + nameWithoutRedundantSpaces.substr(1, itemName.length).toLowerCase();
}


app.listen(process.env.PORT || PORT, () => console.log(`Server is up and running on port ${PORT}.`));

(async () => await getInitialData())();
