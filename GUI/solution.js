
let map;
let startNode;
let currentMarkers = {};
let addedNodes = {};
const possibleIcons = ["markerIcon1.jpg", "markerIcon2.jpg", "markerIcon3.jpg"];


//used to keep track of arcs 
class AdjTable {
  allNodes;
  allArcs;
  table;

  constructor(){

    this.allNodes = [];
    this.allArcs = [];
    this.table = {};
  }

  //adds a node to allNodes, and gives it a field in table
  addNode(node){

    this.table[node.name] = {}
    this.allNodes.push(node);

    this.populateTable();
  }

  //defines a non-zero arc between two nodes
  addArc(weight, node1, node2){

    if(node1.name === node2.name){
      return;
    }

    this.table[node1.name][node2.name] = weight;
    this.table[node2.name][node1.name] = weight;

    this.allArcs.push({node1: node1.name, node2: node2.name, weight: weight});
  }

  //populates the table with default arcs with weight 0
  populateTable(){
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
    renameButton.setAttribute("maxLength", 200);
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
    let mapAdjTable = new AdjTable;
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

      mapAdjTable.addNode(currentNode);
      toBeArced[i] = currentNode.point;
    }


    getMatrix(toBeArced, nodeArray, mapAdjTable);

    displayLoadingMenu();

    updateLoadingMenu(mapAdjTable, "Initial Network");
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


//function that gets distances between nodes, needs to be here bc asyncronous work??
function getMatrix(toBeArced, nodeArray, adjTable){

  //optimal way of getting every node, adding it to the adjTable
  for(var j = 0; j < toBeArced.length - 1; j++){

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
    //       adjTable.addArc(response.rows[0].elements[sink].distance.value, fromNode, toNode);
    //     }
    //   }
    // });

    adjTable.addArc(1, fromNode, toNodes[0]);
  }

  console.log(adjTable);
}



//dims the page and display the graph as it is being worked on
function displayLoadingMenu(){

  let upperPage = document.getElementById("UpperPage");
  let lowerPage = document.getElementById("LowerPage");
  upperPage.style.pointerEvents = "none";
  lowerPage.style.pointerEvents = "none";

  let cover = document.createElement("div");
  cover.id = "cover";

  let canvasDiv = document.createElement("div");
  canvasDiv.id = "canvasDiv";

  let cancelButton = document.createElement("input");
  cancelButton.id = "cancelButton";
  cancelButton.type = "button";
  cancelButton.value = "×";

  //cancel functionality
  cancelButton.addEventListener("click", () => {
    document.getElementById("coverDiv").removeChild(cover);
    upperPage.style.pointerEvents = "auto";
    lowerPage.style.pointerEvents = "auto";
    document.getElementById("calculateButton").disabled = false;
  });

  let networkCanvas = document.createElement("canvas");
  networkCanvas.id = "networkCanvas";

  //adding all elements
  canvasDiv.appendChild(cancelButton);
  canvasDiv.appendChild(networkCanvas);
  cover.appendChild(canvasDiv);
  document.getElementById("coverDiv").appendChild(cover);
}



function updateLoadingMenu(adjTable, title){

  //checking if the cancel button has been pressed
  if(!document.getElementById("calculateButton").disabled){
    return;
  }

  let networkTitle = document.createElement("div");
  networkTitle.id = "networkTitle";
  networkTitle.innerHTML = title;
  document.getElementById("canvasDiv").appendChild(networkTitle);

  let networkCanvas = document.getElementById("networkCanvas");
  networkCanvas.width = 850;
  networkCanvas.height = 425;

  //clearing the canvas
  let networkContext = networkCanvas.getContext("2d");
  networkContext.clearRect(0, 0, networkCanvas.width, networkCanvas.height);

  //defining font and font size for nodes on canvas
  networkContext.font = "20px Google Sans";
  networkContext.fillStyle = "black";
  networkContext.textAlign = "center";
  networkContext.direction = "ltr";

  //generating x and y coordinates to place each node at, and drawing them
  let nodeXY = {};
  for(var i = 0; i < adjTable.allNodes.length; i++){

    let tooClose = true;

    let currentX = 50 + Math.random()*(networkCanvas.width - 100);
    let currentY = 25 + Math.random()*(networkCanvas.height - 50);

    //avoiding placing nodes too close to each other
    while(tooClose){

      //coordinates can be within 50px of the canvas X wise, 25px Y wise
      currentX = 50 + Math.random()*(networkCanvas.width - 100);
      currentY = 25 + Math.random()*(networkCanvas.height - 50);
      tooClose = false;

      //checking if these coordinates are too close to others
      for(var j in nodeXY){
        if(nodeXY.hasOwnProperty(j)){
          let nearX = nodeXY[j].x;
          let nearY = nodeXY[j].y;

          let xDifference = Math.abs(nearX - currentX);
          let yDifference = Math.abs(nearY - currentY);

          //using pythagors theorom, who said we'd never use it?
          let proximity = Math.sqrt(xDifference**2 + yDifference**2);

          //constant fine tuned
          if(proximity < 75){
            tooClose = true;
          }
        }
      }
    }

    networkContext.fillText(adjTable.allNodes[i].name, currentX, currentY);
    nodeXY[adjTable.allNodes[i].name] = {x: currentX, y: currentY};
  }

  //adding the arcs to the canvas
  for(var k = 0; k < adjTable.allArcs.length; k++){

    console.log("test");

    //getting the points to connect
    let node1X = nodeXY[adjTable.allArcs[k].node1].x;
    let node1Y = nodeXY[adjTable.allArcs[k].node1].y;

    let node2X = nodeXY[adjTable.allArcs[k].node2].x;
    let node2Y = nodeXY[adjTable.allArcs[k].node2].y;

    //drawing the line
    networkContext.beginPath();
    networkContext.moveTo(node1X, node1Y);
    networkContext.lineTo(node2X, node2Y);
    networkContext.stroke();
  }

}

window.initMap = initMap;