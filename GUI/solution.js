
let map;
let startNode;
let currentMarkers = {};
let addedNodes = {};
const possibleIcons = ["markerIcon1.jpg", "markerIcon2.jpg", "markerIcon3.jpg"];




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

    console.log(newNode);

  }

  //gets lat and lng values to parse to the TSP solver, and adds the node to the page
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

          return;
        } 
      }

      //setting the node that was clicked to the new startnode, altering css
      startNode = node;
      startNodeButton.className = "ActiveStartNode";

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

      //animating the removal of the div
      childDiv.classList.add("RemoveNode");
      childDiv.addEventListener("animationend", () => {

        deletedNode.classList.add("RemoveListedNode");
        deletedNode.removeChild(childDiv);

        deletedNode.addEventListener("animationend", (event) => {
          if(event.animationName === "removeListAnimation"){
            parentList.removeChild(deletedNode);
            
            delete addedNodes[name];
          }
        });
      });
    }
  }

  console.log(currentMarkers);
  console.log(addedNodes);
}

window.initMap = initMap;