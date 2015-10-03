//Colors
var blue = {text: "#E3F2FD", background: "#2196F3", border: "#1976D2"}; 
var green = {text: "#E8F5E9", background: "#4CAF50", border: "#388E3C"};

var elapsedInt;

Tasks = new Mongo.Collection("tasks");

Clients = new Mongo.Collection("clients");

Meteor.methods({
  removeClient: function(entry) {
    Clients.remove(entry);
  }
});

if (Meteor.isClient) {
  Meteor.setInterval(function() {
    //acquire current hours and minutes
    var currentTime = new Date();
    var hours = currentTime.getHours();
    var minutes = currentTime.getMinutes();

    //Cache line and triangle markers
    var line = document.getElementById("line-marker");
    var triangle = document.getElementById("triangle-marker");

    //also update clock notification
    var clock = document.getElementById("clock");
    clock.innerHTML = currentTime.toTimeString();

    //hide markers if not displaying today
    if(NotToday(currentTime, Session.get('currentDay'))) {
      line.style.display = "none" 
      triangle.style.display = "none";
      return;
    }

    //compute the appropriate line to draw the marker
    //line is 16px per 30min interval
    //triangle is 16px per 30min interval - 3px
    var position = Math.round( (hours * 32) + (minutes * 32 / 60) );

    //Change the location of the line
    line.style.top = position.toString()+"px";

    //Change the location of the triangle
    triangle.style.top = (position-3).toString()+"px";

    //Finally ensure that the markers are being displayed
    line.style.display = "block" 
    triangle.style.display = "block";
  }, 1000);
  
  Template.body.helpers({
    tasks: function() {
      return Tasks.find({});
    },
    dataCount: function(data){
      console.log(data.count());
    },
    test: function(){
      console.log("test");
    }
  });

  Template.taskEvent.onCreated(function() {

  });

  Template.taskEvent.helpers({
    task: function() {
      return Tasks.findOne();
    },
    tasks: function() {
      return CurrentTasks();
    },
    topPosition: function(startTime) {
      return "top: "+(Math.round( (startTime.getHours() * 32) + (startTime.getMinutes() * 32 / 60) ) ).toString() + "px;";
    },
    height: function(startTime, endTime) {
      //difference in hours is just the change in hours
      var diffHours = endTime.getHours() - startTime.getHours();
      //total event difference in minutes include the diffHours and the change in the minute units
      var diffMinutes = diffHours*60 + endTime.getMinutes() - startTime.getMinutes();
      //the ratio is 31px per 1hr
      return "height: "+ (Math.round(diffMinutes / 60 * 31)).toString() + "px;";
    },
    width: function() {
      var activeClients = Clients.find({active: true}).count();
      console.log("active clients: "+activeClients);

      if(activeClients < 1) activeClients = 1;
      var width = 100 / activeClients;
      console.log("width: "+width);

      //get today's events
      var data = CurrentTasks().count();
      console.log("Tasks: "+data);


      return "width: "+width+"%;";
    },
    left: function() {
      if(Clients.findOne({_id: this.client}).name === "Apple"){
        return "left: 0%;";
      }
      if(Clients.findOne({_id: this.client}).name === "Google") {
        return "left: 50%;";
      }
    },
    color: function() {
      if(Clients.findOne({_id: this.client}).name === "Apple"){
        return "background-color:"+blue.background+";"+
        "border: 1px solid "+blue.border+";"+
        "color: "+blue.text+";";
      }
      if(Clients.findOne({_id: this.client}).name === "Google") {
        return "background-color:"+green.background+";"+
        "border: 1px solid "+green.border+";"+
        "color: "+green.text+";";
      }
    },
    testOutput: function() {
      console.log("input");
    }
  });

  Template.taskEvent.events({
    'click': function(event) {
      var editor = document.getElementById("editor");
      var title = document.getElementById("editor-task-title");
      var description = document.getElementById("editor-task-description");
      var target = event.target;

      //Adjust the top position of the edit window
      //to zero out the window top = -46 (for event at 12am)
      editor.style.top = (parseInt(target.style.top) - 82).toString() + "px";

      //Change the text values of the Editor
      title.value = this.title;
      description.value = this.description;

      //display the edit window
      editor.style.display = "block";
    }
  });

  Template.editor.events({
    'click #exit': function() {
      // close the edit menu
      document.getElementById("editor").style.display = "none";
    }
  });

  Template.scheduleMenu.helpers({
    currentDay: function() {
      return Session.get('currentDay').toDateString();
    },
  });

  Template.scheduleMenu.onCreated(function() {
    Session.set('currentDay', new Date());
  });

  Template.scheduleMenu.events({
    'click #prev': function() {
      Session.set('currentDay', ChangeDay(Session.get('currentDay'), -1));
    },
    'click #today': function() {
      Session.set('currentDay', new Date());
    },
    'click #next': function() {
      Session.set('currentDay', ChangeDay(Session.get('currentDay'), 1));
    }
  });

  Template.controls.helpers({
    'clients': function() {
      return Clients.find({},{sort: { name: 1}});
    }
  });

  Template.controls.events({
    'click #controls-start': function() {
      //Set current client to active
      var client = document.getElementById("controls-select").value;
      Clients.update({_id: client}, {$set: {active: true}});
      updateClientState(client);

      //Create a new database entry
      var clientID = document.getElementById("controls-select").value;
      console.log("client: "+client);
      var startTime = new Date();
      console.log("start time: "+startTime.toTimeString());
      var endTime = new Date(startTime.getTime() + 30 * 60000);
      console.log("end time: "+endTime.toTimeString());
      Tasks.insert({ client: clientID, start: startTime, end: endTime, title: '', description: ''});
    },
    'click #controls-stop': function() {
      //Set current client to not active
      var client = document.getElementById("controls-select").value;
      Clients.update({_id: client}, {$set: {active: false}});
      updateClientState(client);
    },
    'change #controls-select': function() {
      var client = document.getElementById("controls-select").value;
      updateClientState(client);
    }
  });

  Template.settings.helpers({
    clients: function() {
      return Clients.find({},{sort: { name: 1}});
    }
  });

  Template.settings.events({
    'keyup #input-client-name': function() {
      var name = document.getElementById("input-client-name").value;
      if(name.length > 0){
        document.getElementById("submit-client").disabled = false;
      } else {
        document.getElementById("submit-client").disabled = true;
      }
    },
    'click #add-client': function() {
      document.getElementById("table-client").style.display = "none";
      document.getElementById("input-client").style.display = "block";
    },
    'click #cancel-client': function() {
      document.getElementById("input-client").style.display = "none";
      document.getElementById("table-client").style.display = "block";
    },
    'click #submit-client': function() {
      //Collect the new inputs
      var n = document.getElementById("input-client-name").value;
      var r = document.getElementById("input-client-rate").value;

      //Data cleaning
      n = toTitleCase(n);

      //Insert new client to the Client database
      Clients.insert({ name: n, rate: r, active: false });

      //Reset client form
      n.style = "placeholder: '';";

      //Hide the form and reveal the table
      document.getElementById("input-client").style.display = "none";
      document.getElementById("table-client").style.display = "block";
    }
  });
  
  Template.activeTasks.helpers({
    clients: function() {
      return Clients.find({active: true},{sort: { name: 1}});      
    }
  });
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}

CalculateElapsedTime = function(startTime, stopTime) {
  //calculate the difference between the dates in ms
  var difference = stopTime.getTime() - startTime.getTime();
  //create the result string
  var result = "";
  
  difference = difference / 1000;
  var seconds = Math.floor(difference % 60);
  difference = difference / 60;
  var minutes = Math.floor(difference % 60);
  difference = difference / 60;
  var hours = Math.floor(difference % 24);

  if(hours < 10) hours = "0" + hours;
  if(minutes < 10) minutes = "0" + minutes;
  if(seconds < 10) seconds = "0" + seconds;

  result = hours + ":" + minutes + ":" + seconds;

  console.log(result);

  return result;
};

ChangeDay = function(date, amount) {
  var tzOff = date.getTimezoneOffset() * 60 * 1000,
      t = date.getTime(),
      d = new Date(),
      tzOff2;

  t += (1000 * 60 * 60 * 24) * amount;
  d.setTime(t);

  tzOff2 = d.getTimezoneOffset() * 60 * 1000;
  if (tzOff != tzOff2) {
    var diff = tzOff2 - tzOff;
    t += diff;
    d.setTime(t);
  }

  return d;
};

NotToday = function(date1, date2){
  return (date1.getDate() !== date2.getDate() ||
       date1.getMonth() !== date2.getMonth() ||
       date1.getYear() !== date2.getYear());
}

toTitleCase = function(str)
{
    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}

deleteEntry = function(button) {
  var name = button.parentNode.parentNode.children[0].innerHTML;
  Meteor.call('removeClient', {name: name});
}

updateClientState = function(client) {
  var query = Clients.findOne(client);
  console.log(query.name + " is "+query.active);

  if(query.active) {
    document.getElementById("controls-start").disabled = true;
    document.getElementById("controls-stop").disabled = false;
  } else {
    document.getElementById("controls-start").disabled = false;
    document.getElementById("controls-stop").disabled = true;
  }
}

CurrentTasks = function() {
  var key = Session.get('currentDay');
  var minDate = new Date(key);
  minDate.setHours(0,0,0,0);
  var maxDate =  ChangeDay(minDate, 1);
  return Tasks.find({ start: {$gte: minDate, $lt: maxDate}});
}