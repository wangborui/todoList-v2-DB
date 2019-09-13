//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require('mongoose');
const _ = require('lodash');

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
mongoose.connect('mongodb://localhost:27017/todoListDB', {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false});

const itemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  }
});

const customListSchema = {
  name: String,
  items: [itemSchema]
};

const Item = mongoose.model('Item', itemSchema);
const CustomList = mongoose.model('CustomList', customListSchema);

const defaultItems = [new Item({name: 'Meet Florin'}), new Item({name: 'Finish Project'}), new Item({name: 'Think Independently'})];
const day = date.getDate();

app.get("/", function(req, res) {

  Item.find({}, (err, foundItems) => {
    if(err) {
      console.log(err);
    } else {
      if(foundItems.length === 0) {
        Item.insertMany(defaultItems, (err) => {
          if(err) {
            console.log(err);
          } else {
            console.log("Inserted 3 items correctly");
          }
        });
        res.redirect("/");
      } else {
        res.render("list", {listTitle: day, newListItems: foundItems});
      }
     }
  });

});

app.post("/", function(req, res){

  const item = req.body.newItem;
  const listName = req.body.list;

  const newItem = new Item({name: item});

  if(listName === day) {
    newItem.save();
    res.redirect("/");
  } else {
    CustomList.findOne({name: listName}, (err, foundList) => {
      foundList.items.push(newItem);
      foundList.save();
      res.redirect("/" + listName);
    })
  }

});

app.post("/delete", function(req, res){
  let itemId = req.body.checkbox;
  let listName = req.body.listName;

  if(listName === day) {
    Item.findByIdAndRemove(itemId, (err) => {
      if(err) {
        console.log(err);
      } else {
        console.log("Successfully deleted checked item");
        res.redirect("/");
      }
    });
  } else {
    CustomList.update( {name: listName}, { $pull: {items: {_id: itemId} } }, (err, deletedItem) =>{
      if(err) {
        console.log(err);
      } else {
        res.redirect("/" + listName);
      }
    });
  }

});

app.get("/:customListName", function(req,res){
  const customListName = _.capitalize(req.params.customListName);

  CustomList.findOne({name: customListName}, (err, foundList) => {
    if(err) {
      console.log(err);
    } else {
      if(!foundList) {
        //Create a new list
        const customList = new CustomList({
          name: customListName,
          items: defaultItems
        });

        customList.save();
        res.redirect("/" + customListName);
      } else {
        //Show existing list
        res.render("list", {listTitle: customListName, newListItems: foundList.items});
      }
    }
  });
});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
