var elapsedInt;

Tasks = new Mongo.Collection("tasks");

if (Meteor.isClient) {
  Meteor.setInterval(function() {
    //acquire current hours and minutes
    var currentTime = new Date();
    var hours = currentTime.getHours();
    var minutes = currentTime.getMinutes();

    console.log(hours+": "+minutes);

    //compute the appropriate line to draw the marker
    //line is 16px per 30min interval
    //triangle is 16px per 30min interval - 3px
    var position = Math.round( (hours * 32) + (minutes * 32 / 60) );

    //Change the location of the line
    document.getElementById("line-marker").style.top = position.toString()+"px";

    //Change the location of the triangle
    document.getElementById("triangle-marker").style.top = (position-3).toString()+"px";
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
      return Tasks.find({});
    },
    topPosition: function(startTime) {
      return "top: "+(Math.round( (startTime.getHours() * 32) + (startTime.getMinutes() * 32 / 60) ) ).toString() + "px;";
    },
    height: function(startTime, endTime) {
      //difference in hours is just the change in hours
      var diffHours = endTime.getHours() - startTime.getHours();
      //total event difference in minutes include the diffHours and the change in the minute units
      var diffMinutes = diffHours*60 + endTime.getMinutes() - startTime.getMinutes();
      console.log(diffMinutes);
      //the ratio is 31px per 1hr
      return "height: "+ (Math.round(diffMinutes / 60 * 31)).toString() + "px;";
    },
    testOutput: function() {
      console.log("input");
    }
  });

  Template.taskEvent.events({
    'click': function() {
      document.getElementById("editor").style.display = "block";
    }
  });

  Template.editor.events({
    'click #exit': function() {
      // close the edit menu
      document.getElementById("editor").style.display = "none";
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
}