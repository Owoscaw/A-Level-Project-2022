import React, { useEffect, useState, useMemo, Component, useRef } from "react";
import { GoogleMap, useLoadScript, Marker, DirectionsRenderer, OverlayView, Polyline } from "@react-google-maps/api";

import { ReactComponent as EditIcon } from "../styles/icons8-edit.svg";
import { ReactComponent as TrashIcon } from "../styles/icons8-trash.svg";
import { ReactComponent as RouteIcon } from "../styles/route-fill-svgrepo-com.svg";
import "../styles/prevSol.css";

function PrevSol({data, ...props}){

    const [ solution, setSolution ] = useState(null);
    const [ directionsRoute, setRoute ] = useState({ routes: [] });
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

        //loading active solution from newSol
        setSolution(data);

        //loading previous solutions to show them
        loadSolutions().then(response => {
            setData(response.data); 
        });

        return () => {

            //removing all data for a fresh start
            props.changeData(null);
            setSolution(null);
            setData([]);
            setCenter({lat: 0, lng: 0});
            setZoom(3);
            setRoute({ routes: [] });
        }
    }, []);

    //clears all solutions from prevData.json
    const clearSolution = () => {

        setSolution(null);
        setRoute({ routes: [] });
        setZoom(3);
        setCenter({lat: 0, lng: 0});

        props.api("clear", {
            method: "GET",
            cache: "no-cache",
            headers: { 
            "Accept": "application/json",
            "Content-Type": "application/json"
            }
        });
    }

    //returns promise containing all previous solutions from prevData.json
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


    //uses google map's directions API to show a route on the map
    const loadRoute = (route) => {

        if(route === null) return;
        setRoute({ routes: [] });
        let startNodeData = route.nodes.filter(node => (node.name === route.startNode))[0];

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
    
        //sometimes solution is null
        try{
            if(solution.name === name){
                setSolution(null);
                setRoute({ routes: [] });
                setCenter({lat: 0, lng: 0});
                setZoom(3);
            }
        } catch(error){}

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

            //re-loading solutions after deletion
            loadSolutions().then(newData => {
                setData(newData.data); 
            });
        });
    }

    const renameHandler = (route, newName) => {

        props.api("rename-route", {
            method: "POST",
            cache: "no-cache",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                oldName: route.name,
                newName: newName
            }, null, 4)
        }).then(response => response.json()).then(response => {
            console.log(response.message);
            loadSolutions().then(response => {
                setData(response.data);   
            });
        });
    }
    console.log(prevData);
    return (
        <div id="prevSol-container">
            <div id="prevSol-left">
                <div id="prevSol-solutions" className="prevSol-header">
                    Previous solutions:
                </div>
                <div id="prevSol-solution-menu">
                    <ul id="prevSol-solution-list">
                        {
                            prevData.map(route => (
                                <Route key={route.name} data={route} selectHandler={loadRoute} deleteRoute={deleteRoute} 
                                prevData={prevData} inputHandler={renameHandler} currentSolution={solution} setSolution={setSolution}/>
                            ))
                        }
                    </ul>
                </div>
                <div id="prevSol-footer">
                    <input type="button" id="prevSol-back" className="prevSol-footer-button" value="Back" onClick={() => props.changeScreen("menu")}/>
                    <input type="button" id="prevSol-clear" className="prevSol-footer-button" value="Clear solutions" onClick={() => {
                        clearSolution();
                        loadSolutions().then(response => {
                            setData(response.data);   
                        });
                        }}/>
                </div>
            </div>

            <div id="prevSol-right">
                <div id="prevSol-map-header" className={solution === null ? "prevSol-header" : "prevSol-header prevSol-header-active"}>
                    {
                        solution === null ? "No route selected" : solution.name
                    }
                </div>
                <div id="prevSol-map-container">
                        {
                            isLoaded ? <GoogleMap id="prevSol-map" zoom={mapZoom} center={mapCenter}
                            options={mapOptions} onLoad={() => loadRoute(solution)}>
                                {
                                    solution && solution.nodes.map(node => (
                                        <Marker key={node.name} position={{lat: node.lat, lng: node.lng}} 
                                        icon={{url: node.url, scaledSize: node.scaledSize}} clickable={false}>
                                            <OverlayView mapPaneName={OverlayView.FLOAT_PANE} position={{lat: node.lat, lng: node.lng}}>
                                                <div className="prevSol-map-node" style={{ 
                                                    backgroundColor: `rgba(${node.colour}, 0.6)`,
                                                    borderColor: node.name === solution.startNode ? "gold" : "black",
                                                    borderWidth: node.name === solution.startNode ? "3px" : "1px"
                                                    }}>
                                                    {
                                                        (solution.path.indexOf(node.name) + 1) + ": " + node.name
                                                    }
                                                </div>
                                            </OverlayView>
                                        </Marker>
                                    ))
                                }
                                <DirectionsRenderer directions={directionsRoute} options={{ 
                                    suppressMarkers: true,
                                    suppressInfoWindows: false,
                                    polylineOptions: {
                                        icons: [
                                            {
                                                icon: {
                                                    path: window.google.maps.SymbolPath.CIRCLE,
                                                    scale: 10,
                                                    fillColor: "#1AA260",
                                                    strokeWeight: 0,
                                                    fillOpacity: 1
                                                },
                                                repeat: 0,
                                                zIndex: 999
                                            }
                                        ],
                                        strokeColor: "#1AA260",
                                        strokeWeight: 6,
                                        strokeOpacity: 0.6,
                                        clickable: false
                                    }
                                }}/>
                                {
                                    directionsRoute.routes.length !== 0 ? 
                                    solution.nodes.map(node => (
                                        <Polyline key={node.name} path={[
                                            {
                                                lat: node.lat,
                                                lng: node.lng
                                            },
                                            directionsRoute.routes[0].legs[solution.path.indexOf(node.name)].start_location
                                        ]} options={{
                                            strokeOpacity: 0,
                                            clickable: false,
                                            icons: [
                                                {
                                                    icon: {
                                                        path: "M 0, -1 0, 1",
                                                        strokeOpacity: 0.4,
                                                        strokeColor: "#1AA260",
                                                        scale: 5
                                                    },
                                                    offset: 0,
                                                    repeat: "20px"
                                                }
                                            ]
                                        }}/>
                                    )) : null
                                }
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
            ...structuredClone(props.data),
            nameValid: true
        };

        this.inputRef = React.createRef();
        this.selectHandler = props.selectHandler.bind(this);
        this.handleDelete = props.deleteRoute.bind(this);
        this.handleInput = this.handleInput.bind(this);
        this.inputHandler = props.inputHandler.bind(this);
        this.setSolution = props.setSolution.bind(this);
    }

    handleInput(){

        if(this.state.name === this.inputRef.current.value){
            this.setState(prevState => ({
                ...prevState,
                nameValid: true
            }));

            return;
        }

        //trimming whitespace and replacing dissallowed characters with empty string
        let newName = this.inputRef.current.value.trim().replace(/[^a-zA-Z0-9: ]/g, '');
        let nameAllowed = true;

        //mapping over previous solutions to see if newName has been used yet
        this.props.prevData.map(route => {
            if((route.name === newName) || (newName.length === 0)){
                nameAllowed = false;
            }
        });

        if(nameAllowed){
            this.inputHandler(this.state, newName);
            this.setState(prevState => ({
                ...prevState,
                name: newName,
                nameValid: true
            }));

            console.log(this.props.currentSolution)
            if(this.props.currentSolution.name === this.state.name){
                this.setSolution({
                    ...this.state,
                    name: newName
                });
            }
        } else {
            this.setState(prevState => ({
                ...prevState,
                nameValid: false
            }));
        }
    }

    render(){

        let activeClassName = "";
        if((this.props.currentSolution !== null) && (this.props.currentSolution !== undefined)){
            if(this.props.currentSolution.name === this.state.name){
                activeClassName = "prevSol-route-select-active";
            }   
        }

        let hvalue = Math.floor(this.state.duration / 3600);
        let mvalue = Math.floor(this.state.duration % 3600 / 60);
        let durationText = `${hvalue > 0 ? hvalue + "h " : ""}${mvalue + "m"}`; 

        return (
        <li key={this.state.name}>
            <div className="prevSol-route">
                <input className={`prevSol-route-name${this.state.nameValid ? "" : "-invalid"}`} type="text" ref={this.inputRef} 
                defaultValue={this.state.name} onBlur={() => this.handleInput()} maxLength={30}
                onKeyDown={(event) => {
                    if(event.key === "Enter"){
                        this.inputRef.current.blur();
                    }
                }}/>
                <button className="prevSol-route-edit" onClick={() => this.inputRef.current.focus()}>
                    <EditIcon/>
                </button>
                <div className="prevSol-route-weight">
                    {`Length: ${parseFloat((this.state.weight / 1000).toPrecision(4))}km`}
                </div>
                <div className="prevSol-route-startNode">
                    {`Duration: ${durationText}`}
                </div>
                <button className="prevSol-route-delete" onClick={() => this.handleDelete(this.state.name)}>
                    <TrashIcon/>
                </button>
                <button className={`prevSol-route-select ${activeClassName}`} onClick={() => {
                    this.setSolution(this.state);
                    this.selectHandler(this.state);
                }}>
                    <RouteIcon/>
                </button>
            </div>
        </li>);
    }
}

export default PrevSol;