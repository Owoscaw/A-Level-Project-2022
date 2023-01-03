import React, { useEffect, useState, useMemo, Component, useRef } from "react";
import { GoogleMap, useLoadScript, Marker, DirectionsRenderer, OverlayView } from "@react-google-maps/api";

import { ReactComponent as EditIcon } from "../styles/icons8-edit.svg";
import { ReactComponent as TrashIcon } from "../styles/icons8-trash.svg";
import { ReactComponent as RouteIcon } from "../styles/route-fill-svgrepo-com.svg";
import "../styles/prevSol.css";

function PrevSol({data, ...props}){

    const [ solution, setSolution ] = useState(null);
    const [ directionsRoute, setRoute ] = useState();
    const [ prevData, setData ] = useState([]);
    const [ mapCenter, setCenter ] = useState({lat: 0, lng: 0});
    const [ mapZoom, setZoom ] = useState(3);
    const mapOptions = useMemo(() => ({
        disableDefaultUI: true,
        clickableIcons: false,
        draggableCursor: "default",
        draggingCursor: "grabbing",
        gestureHandling: "greedy"
    }), []);
    const panelRef = useRef();

    const { isLoaded } = useLoadScript({
        googleMapsApiKey: "AIzaSyA4JxaRwAQ18Zvjyxy1CAkuSxKjGpGLzws"
    });

    useEffect(() => {
        setSolution(data);
        loadSolutions().then(response => {
            setData(response.data); 
        });

        return () => {
            setSolution(null);
            setData([]);
            setCenter({lat: 0, lng: 0});
            setZoom(3);
        }
    }, [data]);

    const clearSolution = () => {
        props.api("clear", {
            method: "GET",
            cache: "no-cache",
            headers: { 
            "Accept": "application/json",
            "Content-Type": "application/json"
            }
        });

        setZoom(3);
        setSolution(null);
        setRoute(null);
    }

    const loadSolutions = () => {
        return props.api("load", {
            method: "GET",
            cache: "no-cache",
            headers: { 
            "Accept": "application/json",
            "Content-Type": "application/json"
            }
        }).then(response => response.json());
    }

    const loadRoute = (route) => {

        if(route === null) return;

        let startNodeData = route.nodes.filter(node => (node.name === route.startNode))[0];
        setCenter({lat: startNodeData.lat, lng: startNodeData.lng});
        setZoom(15);

        let nodes = {};
        route.nodes.map(node => {
            nodes[node.name] = {lat: node.lat, lng: node.lng};
        });

        let waypoints = [];
        for(let i = 1; i < route.path.length - 1; i++){
            waypoints[i - 1] = {
               location: nodes[route.path[i]],
               stopover: true
            };
        }
        
        const directionsService = new window.google.maps.DirectionsService();
        directionsService.route({
            origin: {lat: startNodeData.lat, lng: startNodeData.lng},
            destination: {lat: startNodeData.lat, lng: startNodeData.lng},
            travelMode: route.options.travelMode.toUpperCase(),
            drivingOptions: {
                departureTime: new Date(Date.now()),
                trafficModel: route.options.trafficMode
            }, 
            waypoints: waypoints,
            unitSystem: window.google.maps.UnitSystem.METRIC,
            provideRouteAlternatives: false
        }, (result, status) => {

            if(status === "OK"){
                console.log(result);
                setRoute(result);
            } else {
                console.log(status);
            }
        });
    }

    const deleteRoute = (name) => {
        console.log(name);
        props.api("delete-route", {
            method: "POST",
            cache: "no-cache",
            headers: { 
              "Accept": "application/json",
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name: name
            }, null, 4)
        }).then(response => response.json()).then(response => {
            loadSolutions().then(newData => {
                setData(newData.data); 
            });
        });
    }

    return (
        <div id="prevSolution">
            <div id="leftPage">
                <div id="solutionHeader" className="header">
                    Previous solutions:
                </div>
                <div id="solutionMenu">
                    <ul id="solutionList">
                        {
                            prevData.map(route => (
                                <Route key={route.name} data={route} selectHandler={loadRoute} activeSolution={solution} 
                                setSolution={setSolution} deleteRoute={deleteRoute}/>
                            ))
                        }
                    </ul>
                </div>
                <div id="solutionFooter">
                    <input type="button" id="backButton-prevSol" className="footerButton" value="Back" onClick={() => props.changeScreen("menu")}/>
                    <input type="button" id="clearButton-prevSol" className="footerButton" value="Clear solutions" onClick={() => {
                        clearSolution();
                        loadSolutions().then(response => {
                            setData(response.data);   
                        });
                        }}/>
                </div>
            </div>

            <div id="rightPage">
                <div id="mapHeader" className={solution === null ? "header" : "header activeHeader"}>
                    {solution === null ? "No route selected" : solution.name}
                </div>
                <div id="mapContainer">
                        {
                            isLoaded ? <GoogleMap id="map" zoom={mapZoom} center={mapCenter}
                            options={mapOptions} onLoad={() => loadRoute(solution)}>
                                {
                                    solution === null ? null : (solution.nodes.map(node => (
                                        <Marker position={{lat: node.lat, lng: node.lng}} icon={{url: node.url, scaledSize: node.scaledSize}}>
                                            <OverlayView mapPaneName={OverlayView.OVERLAY_LAYER} position={{lat: node.lat, lng: node.lng}}>
                                                <div className="routeNode">
                                                    {
                                                        node.name === solution.startNode ? "Start/End" : `Waypoint ${solution.path.indexOf(node.name)}`
                                                    }
                                                    <br/>
                                                    {
                                                        node.name
                                                    }
                                                </div>
                                            </OverlayView>
                                        </Marker>
                                    )))
                                }
                                <DirectionsRenderer directions={directionsRoute} options={{ 
                                    suppressMarkers: true,
                                    polylineOptions: {
                                        icons: [
                                            {
                                                icon: {
                                                    path: window.google.maps.SymbolPath.CIRCLE,
                                                    scale: 10,
                                                    fillColor: "#FF0000",
                                                    strokeWeight: 0,
                                                    fillOpacity: 1
                                                },
                                                repeat: 0
                                            },
                                            {
                                                icon: {
                                                    path: window.google.maps.SymbolPath.FORWARD_OPEN_ARROW,
                                                    scale: 5,
                                                    fillColor: "#0000FF",
                                                    strokeWeight: 0,
                                                    fillOpacity: 1
                                                },
                                                offset: "25%",
                                                repeat: "25%"
                                            }
                                        ],
                                        strokeColor: "#4597ff",
                                        strokeWeight: 6,
                                        strokeOpacity: 0.6
                                    }
                                }}/>
                            </GoogleMap> : <div id="mapLoading">Loading...</div>
                        }
                </div>
            </div>
        </div>
    );
}

class Route extends Component {

    constructor(props){
        super(props);

        this.state = {
            ...structuredClone(props.data)
        };

        this.selectHandler = props.selectHandler.bind(this);
        this.setSolution = props.setSolution.bind(this);
        this.handleSelect = this.handleSelect.bind(this);
        this.handleDelete = props.deleteRoute.bind(this);
    }

    handleSelect(){

        this.setSolution(this.state)
        this.selectHandler(this.state);
    }

    render(){

        let activeClassName = "";
        if((this.props.activeSolution !== null) && (this.props.activeSolution !== undefined)){
            if(this.props.activeSolution.name === this.state.name){
                activeClassName = "routeSelect-active";
            }   
        }

        return (
        <li key={this.state.name}>
            <div className="routeDiv">
                <input className="routeName" type="text" defaultValue={this.state.name}/>
                <button className="routeEdit">
                    <EditIcon/>
                </button>
                <div className="routeWeight">
                    {`Weight:   ${this.state.weight}`}
                </div>
                <div className="routeStart">
                    {`Start:    ${this.state.startNode}`}
                </div>
                <button className="routeDelete" onClick={() => this.handleDelete(this.state.name)}>
                    <TrashIcon/>
                </button>
                <button className={`routeSelect ${activeClassName}`} onClick={this.handleSelect}>
                    <RouteIcon/>
                </button>
            </div>
        </li>);
    }
}

export default PrevSol;