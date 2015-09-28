var elapsedInt;
var currentDay = new Date();

Tasks = new Mongo.Collection("tasks");

if (Meteor.isClient) {
  Meteor.setInterval(function() {
    //acquire current hours and minutes
    var currentTime = new Date();
    var hours = currentTime.getHours();
    var minutes = currentTime.getMinutes();

    //Cache line and tirangle markers
    var line = document.getElementById("line-marker");
    var triangle = document.getElementById("triangle-marker");

    //hide markers if not displaying today
    if(NotToday(currentTime, Session.get('currentDay'))) {
      line.style.display = "none" 
      triangle.style.display = "none";
      console.log("don't display time marker.");
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

  Template.timer.helpers({
    startTime: function () {
      return Session.get('startTime');
    },
    stopTime: function () {
      return Session.get('stopTime');
    },
    elapsedTime: function () {
      return Session.get('elapsedTime');
    }
  });



  Template.timer.events({
    'click #start': function () {
      // initialize new startTime and clear stop time
      Session.set('startTime', new Date());
      Session.set('stopTime', "");
      Session.set('elapsedTime', "00:00:00");

      //start elapsedTime update interval
      elapsedInt = Meteor.setInterval(function() {
        Session.set('elapsedTime', CalculateElapsedTime(Session.get('startTime'), new Date()) );
      }, 1000);
    },
    'click #stop': function () {
      // initialize new startTime
      Session.set('stopTime', new Date());
      Meteor.clearInterval(elapsedInt);
      Session.set('elapsedTime', CalculateElapsedTime(Session.get('startTime'), Session.get('stopTime')) );
    }
  });

  Template.taskEvent.onCreated(function() {
    console.log(this);
    console.log(Tasks.find({}));
  });

  Template.taskEvent.helpers({
    task: function() {
      return Tasks.findOne();
    },
    tasks: function() {
      var key = Session.get('currentDay');
      var minDate = new Date(key);
      minDate.setHours(0,0,0,0);
      var maxDate =  ChangeDay(minDate, 1);
      console.log("Min Date: "+minDate+"\n Max Date: "+maxDate);
      return Tasks.find({ startTime: {$gte: minDate, $lt: maxDate}});
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
      editor.style.top = (parseInt(target.style.top) - 46).toString() + "px";

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