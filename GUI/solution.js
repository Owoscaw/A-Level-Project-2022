
let map;
let currentMarkers = {};
let addedNodes = {};
const possibleIcons = ["markerIcon1.jpg", "markerIcon2.jpg", "markerIcon3.jpg"];

//initialising map 
function initMap() {
  const map = new google.maps.Map(document.getElementById("map"), {
    center: {lat: 52.4, lng: 0},
    zoom: 15,
  });

  //listening for a click, this will add the node
  google.maps.event.addListener(map, "click", (event) => {

    //call addMarker to add the node to the map
    addNode(event.latLng);

  });

  //class used to add a node to the map
  class NodeOverlay extends google.maps.OverlayView {
    point;
    name;
    div;
    marker;
    isMouseOver;
    isNodeActive;

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

          this.setMap(null);
          this.marker.setMap(null);
          delete currentMarkers[this.name];

          //removing from addedNodes
          delete addedNodes[this.name];
        } else {

          getNode(this.name, this.point);

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

        this.draw();
      });

      this.div.addEventListener("mouseleave", () => {
        this.isMouseOver = false;

        //grace period to get mouse back onto the overlay before removing it
        setTimeout(() => {
          if(!this.isMouseOver && !this.isNodeActive){
            this.setMap(null);
          }
        }, 1500); //delay of 1.5s
        this.draw();
      });

      google.maps.OverlayView.preventMapHitsFrom(this.div)

      this.getPanes().overlayMouseTarget.appendChild(this.div);
    }

    draw(){
      const overlayProjection = this.getProjection();
      const centre = overlayProjection.fromLatLngToDivPixel(this.point);

      if(this.isNodeActive && !this.isMouseOver){
        this.div.style.left = (centre.x - 39.5).toString() + "px";
        this.div.style.bottom = (55 - centre.y).toString() + "px";
      } else {
        this.div.style.left = (centre.x - 52).toString() + "px";
        this.div.style.bottom = (55 - centre.y).toString() + "px";
      }
    }

    onRemove(){
      if (this.div) {
        this.div.parentNode.removeChild(this.div);
        delete this.div;
      }
    }
  }

  //adds a new node to the map
  function addNode(location){

    //add the marker, random image
    let newMarker = new google.maps.Marker({
      position: location,
      map: map,
      icon: {
        url: possibleIcons[Math.floor(Math.random() * 3)],
        scaledSize: new google.maps.Size(50, 50)
      }
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
    });

    newMarker.addListener("mouseout", function(){
      //grace period before removing the overlay set to 1.5s
      setTimeout(function(){
        if(!newNode.isMouseOver && !newNode.isNodeActive){
          newNode.setMap(null);
        }
      }, 1500);
    });

    //deleting the marker when right clicked and removing it from the current markers object
    newMarker.addListener("rightclick", function(){
      newMarker.setMap(null);
      newNode.setMap(null);
      delete currentMarkers["Node " + nodeIndex.toString()];
    });

    console.log(newNode);

  }

  //gets lat and lng values to parse to the TSP solver TODO: make this add the node to a list or smth on the right, make it create a list of data to parse to the TSP
  function getNode(name, location){
    console.log(name);
    console.log(location.lat);
    console.log(location.lng);
  }

  console.log(currentMarkers);
  console.log(addedNodes);
}

window.initMap = initMap;