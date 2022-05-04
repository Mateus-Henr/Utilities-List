# Utilities list

A simple list that allows the user to add items and remove items. Notice that every operation that is performed on an item affects the database where the item is stored as well. This app has been deployed using Heroku, and as the database, MongoDB is used. In order to improve performance, a virtual DOM is used in the backend instead of retrieving data every time that there's a modification in the data.

## Functionalities
- **Add items** - It allows you to add items by typing the item's information in the input boxes.
- **Remove items** - Each item has a delete button which by clicking on it deletes the item from the database, consequently, the list as well.
- **Edit items** - To edit items, the same input box used to add items is used. In order to perform this operation it's necessary to type the item's name again (the name must be the same as the item that you want to modify), then in the other input boxes, you can type the new information as you will.

## How to use
To use this app there are two options at your disposal:
1. Use the online version that has been deployed using Heroku by accessing the link: "https://list-of-utilities.herokuapp.com/".
2. Download the project, download node JS, and run the commands in the "Install" and "Usage" sections. **OBS:** Notice that every operations performed also affects the database, even though the project is locally.

### Install
```
npm init
npm i express body-parser axios cheerio
```

### Usage
```
node app.js
```

## License
MIT © something...
