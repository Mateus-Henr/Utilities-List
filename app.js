const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const fs = require("fs");
const cheerio = require("cheerio");

const INDEX_HTML = "/index.html";
const DB_JSON = "/db.json";

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

async function getInicialData()
{
  const listOfItems = JSON.parse(await fs.promises.readFile(__dirname + DB_JSON, "utf8"));

  for (let item of listOfItems)
  {
    $("tbody").append(createNewRow(item));
  }

  return $.root().html();
}


app.post("/", async (req, res) =>
{
  if (!items)
  {
    await items;
  }

  if (req.body.action)
  {
    const jsonData = JSON.parse(await fs.promises.readFile(__dirname + DB_JSON, "utf8"));
    let i;

    for (i = 0; i < jsonData.length; i++)
    {
      if (JSON.stringify(jsonData[i]) === req.body.element)
      {
        jsonData.splice(i, 1);
        break;
      }
    }

    $($($("tbody")).children()[i]).remove();

    await fs.promises.writeFile(__dirname + DB_JSON, JSON.stringify(jsonData));
  }
  else
  {
    const newItem =
    {
      name: req.body.name,
      imgURL: await makeAPIRequestForImg(req.body.name),
      person: req.body.person,
      status: req.body.status
    }

    $("tbody").append(createNewRow(newItem));

    const jsonData = JSON.parse(await fs.promises.readFile(__dirname + DB_JSON, "utf8"));
    jsonData.push(newItem);
    await fs.promises.writeFile(__dirname + DB_JSON, JSON.stringify(jsonData));
  }

  res.send($.root().html());
});


async function makeAPIRequestForImg(itemName)
{
  const IMG_URL = `https://pixabay.com/api/?key=26716436-4977a45d463ec155d02d2729e&safesearch=true&image_type=photo&per_page=3&q=${itemName}`;

  const {data} = await axios.get(IMG_URL);

  if (data.total == 0)
  {
    return "https://icon-library.com/images/not-found-icon/not-found-icon-18.jpg";
  }

  return await data.hits[0].previewURL;
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
