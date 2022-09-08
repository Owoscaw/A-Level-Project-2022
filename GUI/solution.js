
let map;
let startNode;
let currentMarkers = {};
let addedNodes = {};
const possibleIcons = ["markerIcon1.jpg", "markerIcon2.jpg", "markerIcon3.jpg"];
const googleColours = ["66, 133, 244", "234, 67, 53", "251, 188, 5", "52, 168, 83"];


//on load, initialise the map
window.onload = initMap;




//used to keep track of nodes and arcs for a given calculate button press
class Network {
  #canvas;
  #table;
  #allNodes;
  #allArcs;
  weight;

  constructor(){
    this.canvas = document.createElement("canvas");
    this.allNodes = [];
    this.allArcs = [];
    this.table = {};
    this.weight = 0;
  }

  addNode(node){

    this.table[node.name] = {};
    this.allNodes.push(node);

    this.populateTable;
  }

  addArc(weight, node1, node2){

    if(node1.name === node2.name){
      return;
    }

    this.table[node1.name][node2.name] = weight;
    this.table[node2.name][node1.name] = weight;

    this.allArcs.push({node1: node1.name, node2: node2.name, weight: weight});

    this.weight += weight;
  }

  removeNode(node){

    //removing node
    let nodeIndex = this.allNodes.indexOf(node);
    if(nodeIndex === -1){
      return;
    }
    this.allNodes.splice(nodeIndex, 1);
    delete this.table[node.name];

    //removing all reference to node
    for(let i = 0; i < this.allArcs.length; i++){
      let currentArc = this.allArcs[i];

      if(currentArc.node1 === node.name){
        this.removeArc(currentArc);
      } else if(currentArc.node2 === node.name){
        this.removeArc(currentArc);
      }
    }
  }

  removeArc(arc){
    
    if((typeof this.table[arc.node1.name][arc.node2.name] === "undefined") || (typeof this.table[arc.node2.name][arc.node2.name] === "undefined")){
      return;
    }

    let arcIndex = this.allArcs.indexOf(arc);
    delete this.allArcs[arcIndex]

    delete this.table[arc.node1][arc.node2];
    delete this.table[arc.node2][arc.node1];

    weight -= arc.weight;
  }

  //draws a nice graphic to represent the network
  drawTo(div, title){

    this.canvas.id = "networkCanvas";
    this.canvas.width = 850 * window.devicePixelRatio;
    this.canvas.height = 425 * window.devicePixelRatio;

    let networkContext = this.canvas.getContext("2d");
    networkContext.scale(window.devicePixelRatio, window.devicePixelRatio);
    
    div.appendChild(this.canvas);

    //checking if the cancel button has been pressed
    if(!document.getElementById("calculateButton").disabled){
      return;
    }

    let networkTitle = document.createElement("div");
    networkTitle.id = "networkTitle";
    networkTitle.innerHTML = title;
    div.appendChild(networkTitle);

    //clearing the canvas
    networkContext.clearRect(0, 0, networkCanvas.width, networkCanvas.height);

    var networkStage = new createjs.Stage(this.canvas);
    let transparentLayer = networkCanvas.cloneNode();
    let transparentContext = transparentLayer.getContext("2d");

    //generating regular polygon to place each node at, and drawing them
    let thetaIncrement = Math.PI*2/this.allNodes.length;
    let radius = (this.canvas.height - 125)/2;
    let centre = {x: this.canvas.width/2, y: this.canvas.height/2};

    let nodeXY = {};
    for(var i = 0; i < this.allNodes.length; i++){

      let currentTheta = i*thetaIncrement;
      let currentX = radius*Math.cos(currentTheta) + centre.x;
      let currentY = radius*Math.sin(currentTheta) + centre.y;    

      let nodeColour = googleColours[Math.floor(Math.random()*4)];
      transparentContext.fillStyle = "rgb(" + nodeColour + ")";
      transparentContext.beginPath();
      transparentContext.arc(currentX, currentY, 15, 0, 2*Math.PI);
      transparentContext.fill();

      let nodeText = new createjs.Text(this.allNodes[i].name, "28px Google Sans", "#000000");
      nodeText.textAlign = "center";
      nodeText.textBaseline = "top";
      nodeText.lineWidth = 125;
      nodeText.maxWidth = 125;
      let textHeight = nodeText.getMeasuredHeight();
      nodeText.x = currentX;
      nodeText.y = currentY - textHeight/2;
      networkStage.addChild(nodeText);

      nodeXY[this.allNodes[i].name] = {x: currentX, y: currentY, colour: nodeColour};
    }
    networkStage.update();


    //adding the arcs to the canvas
    transparentContext.lineWidth = 5;
    for(var k = 0; k < this.allArcs.length; k++){

      //getting the points to connect
      let node1X = nodeXY[this.allArcs[k].node1].x;
      let node1Y = nodeXY[this.allArcs[k].node1].y;
      let node1Colour = "rgb(" + nodeXY[this.allArcs[k].node1].colour + ")";

      let node2X = nodeXY[this.allArcs[k].node2].x;
      let node2Y = nodeXY[this.allArcs[k].node2].y;
      let node2Colour = "rgb(" + nodeXY[this.allArcs[k].node2].colour + ")";

      //drawing line with gradient
      let gradient = transparentContext.createLinearGradient(node1X, node1Y, node2X, node2Y);
      gradient.addColorStop(0.3, node1Colour);
      gradient.addColorStop(0.7, node2Colour);

      transparentContext.strokeStyle = gradient;
      transparentContext.beginPath();
      transparentContext.moveTo(node1X, node1Y);
      transparentContext.lineTo(node2X, node2Y);
      transparentContext.stroke();
    }

    networkContext.globalAlpha = 0.4;
    networkContext.globalCompositeOperation = "destination-over";
    networkContext.drawImage(transparentLayer, 0 , 0);
  }


  //filling the table with 0 as default value
  #populateTable(){

    for(let i = 0; i < this.allNodes.length; i++){

      let iName = this.allNodes[i].name;
      for(let j = 0; j < this.allNodes.length; j++){

        let jName = this.allNodes[j].name;
        if((typeof this.table[iName][jName] === "undefined") && (iName != jName)){
          this.table[iName][jName] = 0;
        }
      }
    }
  }
}


//initialising map 
function initMap() {

  const map = new google.maps.Map(document.getElementById("map"), {
    center: {lat: 52.4, lng: 0},
    zoom: 15,
  });

  //listening for zoom change, so page will change accordingly
  google.maps.event.addListener(map, "zoom_changed", (event) => {
    
  });

  //listening for a click, this will add the node
  google.maps.event.addListener(map, "click", (event) => {
    
    if(Object.keys(addedNodes).length < 10){
      //call addMarker to add the node to the map
      addNode(event.latLng);
    } else {
      document.getElementById("statusContent").innerHTML = "Too many nodes!";
    }
  });


  //class used to add a node to the map
  class NodeOverlay extends google.maps.OverlayView {
    point;
    name;
    div;
    marker;
    isMouseOver;
    isNodeActive;
    timeout;

    constructor(point, name, marker){
      super();

      this.point = {lat: point.lat(0), lng: point.lng(0)};
      this.name = name;
      this.isMouseOver = false;
      this.isNodeActive = false;
      this.marker = marker;
    }

    onAdd(){
      this.div = document.createElement("div");
      this.div.className = "Node";
      this.div.innerHTML = "<b>" + this.name + "</b><br>Click to add";

      //upon clicking the overlay, add the node, funcionality for removing if node is active
      this.div.addEventListener("click", () => {

        if(this.isNodeActive){

          //standard node deletion
          deleteNode(this.name, this, this.marker);

        } else {

          activateNode(this.name, this, this.marker);

          //clicking the node changes it to an active node, different styling
          this.div.className = "ClickedNode";
          this.isNodeActive = true;
          this.div.innerHTML = "<b>" + this.name + "</b><br>";

          //adding it to the list of added nodes
          addedNodes[this.name] = this;
          updateStatus();

          //redraw it
          this.draw();
        }
      });


      //both of these listeners help to determine where the mouse is
      this.div.addEventListener("mouseenter", () => {
        this.isMouseOver = true;
        clearTimeout(this.timeout);

        this.draw();
      });

      this.div.addEventListener("mouseleave", () => {
        this.isMouseOver = false;

        //grace period to get mouse back onto the overlay before removing it
        this.timeout = setTimeout(() => {
          if(!this.isNodeActive){
            deleteNode(this.name, this, this.marker);
          }
        }, 2000); //delay of 2s
        this.draw();
      });

      google.maps.OverlayView.preventMapHitsFrom(this.div)

      this.getPanes().overlayMouseTarget.appendChild(this.div);
    }

    draw(){
      const overlayProjection = this.getProjection();
      const centre = overlayProjection.fromLatLngToDivPixel(this.point);

      this.div.style.left = (centre.x - ((this.div.clientWidth + 5) / 2)).toString() + "px";
      this.div.style.bottom = (55 - centre.y).toString() + "px";
    }

    onRemove(){
      if (this.div) {
        this.div.parentNode.removeChild(this.div);
        delete this.div;
      }
    }

    setTimeout(timeout){
      this.timeout = timeout;
    }

    getTimeout(){
      return this.timeout;
    }
  }


  //adds a new node to the map
  function addNode(location){

    //getting the random image
    let markerImage = {
      url: possibleIcons[Math.floor(Math.random() * 3)],
      scaledSize: new google.maps.Size(50, 50),
      origin: new google.maps.Point(0, 0)
    }

    //add the marker, random image
    let newMarker = new google.maps.Marker({
      position: location,
      map: map,
      icon: markerImage,
    });


    //numbering nodes
    let nodeIndex = 1;
    while(true){
      if(("Node " + nodeIndex.toString()) in currentMarkers){
        nodeIndex ++;
      } else {
        break;
      }
    }


    let newNode = new NodeOverlay(location, "Node " + nodeIndex.toString(), newMarker);
    currentMarkers["Node " + nodeIndex.toString()] = newMarker;


    newMarker.addListener("mouseover", function(){
      if(!newNode.isNodeActive){
        newNode.setMap(map);
      }
      clearTimeout(newNode.timeout);
    });

    newMarker.addListener("mouseout", function(){
      //grace period before removing node set to 2s
      newNode.timeout = setTimeout(function(){
        if(!newNode.isNodeActive){
          deleteNode(newNode.name, newNode, newMarker);
        }
      }, 2000);
    });

    google.maps.event.trigger(newMarker, "mouseover");
    google.maps.event.trigger(newMarker, "mouseout");

    //deleting the marker when right clicked and removing it from the current markers object
    newMarker.addListener("rightclick", function(){
      //standard node deletion
      deleteNode(newNode.name, newNode, newMarker);
    });
  }


  //manipulates page to add a new node
  function activateNode(name, node, marker){

    let parentList = document.getElementById("listOfNodes");

    //creating a new entry, id of the nodes name
    let newEntry = document.createElement("li");
    newEntry.id = name;

    let newContent = document.createElement("div");
    newContent.className = "NodeInList";

    let nameDiv = document.createElement("div");
    nameDiv.className = "NameDiv";
    nameDiv.innerHTML = name;


    let removalButton = document.createElement("button");
    removalButton.addEventListener("click", () => {
      deleteNode(node.name, node, marker);
    });


    removalButton.innerHTML = "Remove Node";
    removalButton.id = name + " removalButton";
    removalButton.disabled = true;

    let latLngDiv = document.createElement("div");
    latLngDiv.className = "LatLngDiv";
    latLngDiv.innerHTML = node.point.lat.toFixed(8).toString() + ", " + node.point.lng.toFixed(8).toString();

    let renameButtonDiv = document.createElement("div");
    renameButtonDiv.className = "RenameButtonDiv";

    let renameButton = document.createElement("input");
    renameButton.className = "TextBox";
    renameButton.type = "text";
    renameButton.id = name + " renameButton";
    renameButton.setAttribute("maxLength", 30);
    renameButton.disabled = true;
    renameButtonDiv.appendChild(renameButton);

    let renameDiv = document.createElement("div");
    renameDiv.className = "ButtonTextDiv";
    renameDiv.innerHTML = "Rename Node";

    renameButtonDiv.appendChild(renameButton);
    renameButtonDiv.appendChild(renameDiv);


    //rename the node when "enter" is clicked
    renameButton.addEventListener("keydown", (event) => {

      if((event.key === "Enter") && (renameButton.value.length > 0)){

        let newName = renameButton.value;

        delete currentMarkers[name];
        delete addedNodes[name];

        newEntry.id = newName;
        renameButton.id = newName + " renameButton";
        removalButton.id = newName + " removalButton";
        startNodeButton.id = newName + " startNodeButton";
        nameDiv.innerHTML = newName;

        //only change this if we are renaming startnode
        if(typeof startNode != "undefined"){
          if(startNode.name === name){
            document.getElementById("startNodeName").innerHTML = newName;
          }
        }

        //replaces oldname with newname within the div used to house text in the node
        node.div.innerHTML = node.div.innerHTML.replace(name, newName);
        node.name = newName;
        name = newName;

        currentMarkers[newName] = marker;
        addedNodes[newName] = node;

        renameButton.value = "";
        renameButton.blur();

        node.draw();
      }
    });

    renameButton.addEventListener("focus", () => {
      renameDiv.className = "TextButtonDiv";
    });

    renameButton.addEventListener("blur", () => {
      renameButton.value = "";
      renameDiv.className = "ButtonTextDiv";
    });


    let startNodeDiv = document.createElement("div");
    startNodeDiv.className = "StartNodeDiv";

    let startNodeButton = document.createElement("input");
    startNodeButton.className = "StartNodeButton";
    startNodeButton.id = name + " startNodeButton";
    startNodeButton.type = "button";
    startNodeButton.value = "S";
    startNodeButton.disabled = true;
    startNodeDiv.appendChild(startNodeButton);

    startNodeButton.addEventListener("click", () => {

      if(typeof startNode != "undefined"){
        if(startNode.name != name){

          //resetting the css of the old startNode if it exists
          document.getElementById(startNode.name + " startNodeButton").className = "StartNodeButton";
          startNode.div.style.backgroundColor = "rgba(251, 188, 5, 0.5)";

        } else{

          //we have clicked the button again, making it not startnode anymore
          startNode = undefined;
          document.getElementById("startNodeName").innerHTML = "None";
          node.div.style.backgroundColor = "rgba(251, 188, 5, 0.5)";
          startNodeButton.className = "StartNodeButton";

          updateStatus();
          return;
        } 
      }

      //setting the node that was clicked to the new startnode, altering css
      startNode = node;
      startNodeButton.className = "ActiveStartNode";
      updateStatus();

      //setting the startnode at the bottom of the page
      document.getElementById("startNodeName").innerHTML = name;

      //altering the css of the node on map
      node.div.style.backgroundColor = "rgba(234, 67, 53, 0.5)";
    });


    //appending node to the list
    newContent.appendChild(startNodeDiv);
    newContent.appendChild(removalButton);
    newContent.appendChild(latLngDiv);
    newContent.appendChild(renameButtonDiv);
    newContent.appendChild(nameDiv);

    newEntry.appendChild(newContent);
    parentList.appendChild(newEntry);

    newContent.addEventListener("animationend", () => {
      removalButton.disabled = false;
      renameButton.disabled = false;
      startNodeButton.disabled = false;
    });
  }


  //removes a node from the map, list of active markers, list of active nodes, and from the list of nodes
  function deleteNode(name, node, marker){

    //removing node from map
    node.setMap(null);
    marker.setMap(null);

    //removing node from list of nodes 
    delete currentMarkers[name];

    if(node.isNodeActive){

      //removing it from the list of nodes
      let parentList = document.getElementById("listOfNodes");
      let deletedNode = document.getElementById(name);
      let childDiv = deletedNode.children[0];

      //if it is the start node, do some extra stuff because its in the menu
      if(typeof startNode != "undefined"){
        if(startNode.name === name){
          startNode = undefined;
          document.getElementById("startNodeName").innerHTML = "None";
        }
      }

      //disabling buttons
      document.getElementById(name + " removalButton").disabled = true;
      document.getElementById(name + " renameButton").disabled = true;
      document.getElementById(name + " startNodeButton").disabled = true;


      //updating list of nodes and status
      delete addedNodes[name];
      updateStatus();

      //animating the removal of the div
      childDiv.classList.add("RemoveNode");
      childDiv.addEventListener("animationend", () => {

        deletedNode.classList.add("RemoveListedNode");
        deletedNode.removeChild(childDiv);

        deletedNode.addEventListener("animationend", (event) => {
          if(event.animationName === "removeListAnimation"){
            parentList.removeChild(deletedNode);
          }
        });
      });
    }
  }



  //calculate button functionality
  let calcButton = document.getElementById("calculateButton");
  calcButton.addEventListener("click", () => {

    //prevent spam clicking the button
    calcButton.disabled = true;

    //formatting distance matrix service request
    let network = new Network;
    let nodeArray = [];
    let toBeArced = [];

    //getting nodes into an array
    for(var node in addedNodes){
      if(addedNodes.hasOwnProperty(node)){
        nodeArray.push(addedNodes[node]);
      }
    }

    //populating an adjacency table with default arc weights
    for(var i = 0; i < nodeArray.length; i++){
    
      let currentNode = nodeArray[i];

      network.addNode(currentNode);
      toBeArced[i] = currentNode.point;
    }


    //returns a promise that resolves when matrix is fully loaded
    let matrixPromise = getMatrix(toBeArced, nodeArray, network);

    displayLoadingMenu();

    matrixPromise.then(function(resolve){
      console.log(resolve);

      //this adjTable will contain the fully loaded information from the getMatrix function
      network.drawTo(document.getElementById("canvasDiv"), "Initial Network");
    }, function(reject){
      console.log(reject);
    });


  });
}


//updates the status of the page
function updateStatus(){

  //detecting if a starting node has been selected
  let startNodeSelected = false;
  if(typeof startNode != "undefined"){
    startNodeSelected = true;
  }

  //detecting if there are enough nodes for a viable solution
  let enoughNodes = false;
  if(Object.keys(addedNodes).length > 2){
    enoughNodes = true;
  }

  //getting status box where the status will be updated
  let statusBox = document.getElementById("statusContent");

  if(!enoughNodes){
    statusBox.innerHTML = "Add more than two nodes"
  } else if(!startNodeSelected){
    statusBox.innerHTML = "Select starting node";
  } else {
    statusBox.innerHTML = "Ready to solve";
  }
}


//function that gets distances between nodes
function getMatrix(toBeArced, nodeArray, network){

  let matrixStatus = "matrix successfully loaded";

  //asynchronos loop so all matricies can be loaded before continuing
  let matrixLoop = async _ => {
      
    //optimal way of getting every node, adding it to the adjTable
    for(var j = 0; j < toBeArced.length - 1; j++){

      //this promise resolves when the matrix for this iteration is loaded into the adjTable
      let currentMatrixPromise = new Promise(function(resolve, reject){

        let currentOrigin = toBeArced[j];
        let currentDestinations = toBeArced.slice(j + 1);

        //getting the names of all the destination nodes
        let fromNode = nodeArray[j];
        let toNodes = nodeArray.slice(j + 1);

        // var matrix = new google.maps.DistanceMatrixService();
        // matrix.getDistanceMatrix({
        //   origins: [currentOrigin],
        //   destinations: currentDestinations,
        //   travelMode: "DRIVING"
        // }, function(response, status){

        //   //allows me to tell if matrix failed outside of this function
        //   if(status === "OK"){

        //     //successful request, inputting response into adjTable class
        //     for(var sink = 0; sink < response.rows[0].elements.length; sink++){

        //       //getting the arc's connection
        //       let toNode = toNodes[sink];

        //       //adding the arc to the adjacency table
        //       network.addArc(response.rows[0].elements[sink].distance.value, fromNode, toNode);
        //     }

        //     resolve("matrix successfully loaded");
        //   } else {
        //     reject("matrix failed to load");
        //   }
        // });

        network.addArc(1, fromNode, toNodes[0]);
        resolve("matrix successfully loaded");
      });

      //waiting for the resolution or rejection of the current matrix promise
      let matrixResult = await currentMatrixPromise;

      if(matrixResult != "matrix successfully loaded"){
        matrixStatus = matrixResult;
      }
    }

    //returning the status as a resolution to a promise
    return matrixStatus;
  }

  console.log(network);

  //returning the aformentioned promise
  return matrixLoop();
}


//dims the page and display the graph as it is being worked on
function displayLoadingMenu(){

  let upperPage = document.getElementById("UpperPage");
  let lowerPage = document.getElementById("LowerPage");
  upperPage.style.pointerEvents = "none";
  lowerPage.style.pointerEvents = "none";

  let cover = document.createElement("div");
  cover.id = "cover";

  let cancelButton = document.createElement("input");
  cancelButton.id = "cancelButton";
  cancelButton.type = "button";
  cancelButton.value = "×";

  let canvasDiv = document.createElement("div");
  canvasDiv.id = "canvasDiv";

  //cancel functionality
  cancelButton.addEventListener("click", () => {
    document.getElementById("coverDiv").removeChild(cover);
    upperPage.style.pointerEvents = "auto";
    lowerPage.style.pointerEvents = "auto";
    document.getElementById("calculateButton").disabled = false;
  });


  //adding all elements
  canvasDiv.appendChild(cancelButton);
  cover.appendChild(canvasDiv);
  document.getElementById("coverDiv").appendChild(cover);
}



window.initMap = initMap;