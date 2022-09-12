const express = require ("express");
const bodyParser = require ("body-parser");
const mongoose = require ("mongoose");
const _ = require("lodash");

// Setup app
const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));

// Setup mongoose
const dbAddress = "mongodb://localhost:27017/";
const dbName = "todolistDB";
mongoose.connect(dbAddress+dbName);

// Create Schema and Model
const itemSchema = {
    name:{
        type: String,
        required: true
    }
};
const Item = mongoose.model("Item", itemSchema);

// Starting items for first-time user
const item1 = new Item({name: "Welcome to your To-Do List!"});
const item2 = new Item({name: "Hit the (+) to add a new item"});
const item3 = new Item({name: "<= Check this to delete an item"});
const defaultItems = [item1, item2, item3];


// List Schema and Object
const listSchema = {
    name:{
        type:String,
        required:true
    },
    items: [itemSchema]
};

const List = mongoose.model("List", listSchema);


app.get("/", (req, res) => {
    let items = [];
    Item.find({}, (err, foundItems) => {
        if (err) console.log(err);
        else {
            if (foundItems.length === 0){
                Item.insertMany(defaultItems, err=> { 
                    if (err) console.log(err);
                    else console.log("Successfully inserted items"); 
                });
                res.redirect("/");
            }

            else {
                res.render("list", {title: "Today", items: foundItems});
            }      
        }
    });    
});

app.post("/", (req, res) => {
    const itemName = req.body.newItem;
    const listName = req.body.list;
    
    const newItem = new Item({name: itemName});

    if (listName === "Today"){
        newItem.save();
        res.redirect("/");
    } else {
        List.findOne({name: listName}, (err, foundList) => {
            if (!err) {
                foundList.items.push(newItem);
                foundList.save();
                res.redirect("/" + listName);
            }
        });
    }


    
});

app.post("/delete", (req, res) => {
    const itemID = req.body.checkbox;
    const listName = req.body.listName;

    if (listName === "Today"){
        Item.findByIdAndDelete(itemID, err => {
            if (err) console.log(err);
            else {
                res.redirect("/");
            }
        });
    } else {
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: itemID}}}, (err, foundList) => {
            if (!err){
                res.redirect("/" + listName);
            }
        });
    }     
});

app.get("/:customListName", (req, res) => {
    const customListName = _.capitalize(req.params.customListName);

    List.findOne({name: customListName}, (err, foundList) => {
        if (!err){
            if (!foundList){
                 const list = new List({
                    name: customListName,
                    items: defaultItems
                });
                list.save()
                res.redirect("/" + customListName);
            } else {
                res.render("list", {title: foundList.name, items: foundList.items});
            }
        }
    });
});
  
app.get("/about", (req, res) => {
    res.render("about");
});

app.listen(3000, () => {
    console.log("Listening port 3000");
});
