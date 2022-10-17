import React from 'react';
import ReactDOM from 'react-dom/client';
import { render } from "react-dom";

import NewSol from "./components/NewSol";
import MainMenu from "./components/MainMenu";
import PrevSol from "./components/PrevSol";

//doing it the react 17 way because react 18 rendering breaks OverlayView
//const root = ReactDOM.createRoot(document.getElementById("root"));
const root = document.getElementById("root");

class App extends React.Component{

    constructor(props){
        super(props);
        this.state = {
            currentScreen: props.state,
            routeIndex: 0,
            data: null
        };

        this.changeScreen = this.changeScreen.bind(this);
        this.changeData = this.changeData.bind(this);
        this.calculateSolution = this.calculateSolution.bind(this);
        this.writeSolution = this.writeSolution.bind(this);
        this.clearSolution = this.clearSolution.bind(this);
    }

    changeScreen(state){
        this.setState(prevState => ({
            ...prevState,
            currentScreen: state
        }));
    }

    changeData(data){
        this.setState(prevState => ({
            ...prevState,
            data: data
        }));
    }

    calculateSolution(options){
        return fetch("http://localhost:9000/calculate", options);
    }

    writeSolution(options){
        this.setState(prevState => ({
            ...prevState,
            routeIndex: prevState.routeIndex + 1
        }));

        return fetch("http://localhost:9000/save", options);
    }

    clearSolution(options){
        this.setState(prevState => ({
            ...prevState,
            routeIndex: 0
        }));

        return fetch("http://localhost:9000/clear", options);
    }

    render(){
        console.log(this.state);
        switch(this.state.currentScreen){
            case "menu":
                return <MainMenu changeScreen={this.changeScreen}/>; 
            case "newSol":
                return <NewSol changeScreen={this.changeScreen} calcSol={this.calculateSolution} 
                writeSolution={this.writeSolution} changeData={this.changeData} routeIndex={this.state.routeIndex}/>;
            case "prevSol":
                return <PrevSol changeScreen={this.changeScreen} changeData={this.changeData} data={this.state.data}
                clearSolution={this.clearSolution}/>;
            default:
                return <div>error</div>;
        }
    }
}


//export default TravellingSalesman;
//root.render(<App state={"menu"}/>);
render(<App state={"menu"}/>, root);

export default App;

