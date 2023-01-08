// IMPORT ///

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose")
const _ = require("lodash")
require("dotenv").config()

// SETUP ///
const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
mongoatalasUrl = "mongodb+srv://kit:"+process.env.ADMIN_KEY+"@cluster0.dc50xli.mongodb.net/todolistDB"
mongoose.set("strictQuery",false)
mongoose.connect(mongoatalasUrl, {useNewUrlParser: true})

// DataBase SETUP ///
const itemsSchema = {
  name: String,
}
const listSchema = {
  name: String,
  items:[itemsSchema]
}

const Item  = mongoose.model("item", itemsSchema)
const List = mongoose.model("list", listSchema)

//DB default setting ///
const item1 = new Item ({name: "Welcome to todolist"})
const item2 = new Item ({name: "Hit + to add item"})
const item3 = new Item ({name: "👈🏻 Hit checkbox to delete item "})
const defaultItem = [item1, item2, item3]


// GLOBAL VAR ///
const workItems = [];
const day = date.getDate();
 
app.get("/", function(req, res) {
  Item.find({}, function(err, foundItems){
    if(foundItems.length === 0) {
      Item.insertMany(defaultItem, function(err){
        if(err){
          console.log(err)
        }else{
          console.log("Item add to Database!")
        }
      })
      res.redirect("/")
    } else {
      if(err){
        console.log(err)
      }else{
        res.render("list", {listTitle: day, newListItems: foundItems})
    }}
  })
});

app.get("/:customListName", function(req, res){
  const customListName = _.capitalize(req.params.customListName)
  List.findOne({name: customListName}, function(err, foundList){
    if (!err){
      if(!foundList){
        //Not list found, create a new list
        const list = new List({
          name: customListName,
          items: defaultItem
        })
        list.save()
        res.redirect("/" + customListName)
      } else {
        //Found list, show existing list
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items})
      }
    }
  })
})

app.post("/", function(req, res){
  const itemName = req.body.newItem
  const listName = req.body.list
  const item = new Item ({name: itemName})

  if (listName === day) {
    item.save()
    res.redirect("/")
  } else {
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item)
      foundList.save()
      res.redirect("/" + listName)
    })
  }

});

app.post("/delete", function(req, res){
  const checkItemId = req.body.checkbox
  const listName = req.body.listName

  if (listName === day) {
    Item.findByIdAndRemove(checkItemId, function(err){
      if (err) {
        console.log(err)
      } else {
        console.log("Removed Checked Item!")
        res.redirect("/")
      }
    })
  } else {
   List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkItemId}}}, function(err, foundList){
    if (!err) {
      res.redirect("/" + listName)
    }
   })
  }
  
})





app.get("/about", function(req, res){
  res.render("about");
});

app.listen(process.env.PORT || 3000, function() {
  console.log("Server started on port 3000");
});
