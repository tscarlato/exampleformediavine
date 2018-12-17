const axios = require('axios');

const SERVER_ID = "http://localhost:54780/";
//var Gpio = require('onoff').Gpio;;
//var LED = new Gpio(14, 'out'); // this sets the logic pin for output
var rasPiId = null; //this comes from the server
var timeUnlocked = 2000;
var fs = require('fs');
var timestamp = new Date().toLocaleString();

//This is where the log is updated
function appendLog(door)
{
fs.appendFile("./logs/doorlogs.txt", `\r\n  ${new Date().toLocaleString()}: ${door.name} - opened on pin ${door.pin}!` , function(err) {
    if(err) {
        return console.log(err);
    }

    console.log("The file was saved!");
return(door);
}); 
}

// This gets  checks the doors passed through for the correct rasPiID
// Then it sends the correct doors to the open door function
async function app(door) {
    if(!rasPiId){
        console.log("not registered!");
        return;
    }
    var doors = await getQueue();
    console.log(doors);
    doors.forEach(function(door){
         openDoor(door);
	//appendLog(door);
     });
}

// This actually unlocks the door by  turning on the logic pin
// which then closed the relay which send power to the door
// which unlocks the door
/*function unlock()
{
	if (LED.readSync() ===0)
	{
		LED.writeSync(1);
	}
	else
	{
		LED.writeSync(0);
	}
}
*/

// This ends the unlock by turning off the pi logic pin
// Which should  open the relay and remove power  from the door
// which makes the door no longer unlocked
function endUnlock()
{
	LED.writeSync(0);
}


// calls the unlock function  waits for timeUnlocked
// then ends the unlock function
// then tells the server to remove  the doors are removed
function openDoor(door) {
    //unlock();
    //setTimeout(endUnlock, timeUnlocked);
    console.log(`${door.name} - open on pin ${door.pin}!`);
   
    console.log(`${door.id} will be listed as opened`);
    var success = true; //add status calc
    if(success){
       axios.post(`${SERVER_ID}PiApi/SetDoorComplete/${door.id}`)
            .then(res => {
                if(res.status == 200){
                    console.log("removed!")
                }
            });
    }
}

// this registers the raspberry pi 
// then sets the interval for pinging the queue
async function startup(){
    var piSerial = "4321";
    console.log("registering device!");
    await axios.get(`${SERVER_ID}PiApi/Register/${piSerial}`)
        .then(res => {
            rasPiId = res.data.status;
            console.log(rasPiId);
            if(res.status == 200)
                setInterval(app, 1000);

            else
                console.log("could not access server")
        });
}

// this gets the doors from the server 
// it returns every door for this pi
async function getQueue(){
    return await axios.get(`${SERVER_ID}PiApi/Status/${rasPiId}`)
        .then(async res => {
            var doorId = res.data.status;
            console.log(doorId)
            return await axios.get(`${SERVER_ID}PiApi/GetDoorQueue/${rasPiId}`)
                .then(async res => {
			console.log(res.data.queue);
		        return res.data.queue;
                });
        });
}

//  this actually starts the program
startup();
