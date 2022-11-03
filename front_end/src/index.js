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
            data: null
        };

        this.changeScreen = this.changeScreen.bind(this);
        this.changeData = this.changeData.bind(this);
        this.callApi = this.callApi.bind(this);
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

    callApi(mode, options){

        if(mode === "clear"){
            this.changeData(null);
        }

        return fetch(`http://localhost:9000/${mode}`, options);
    }

    render(){
        switch(this.state.currentScreen){
            case "menu":
                return <MainMenu changeScreen={this.changeScreen}/>; 
            case "newSol":
                return <NewSol changeScreen={this.changeScreen} api={this.callApi} changeData={this.changeData}/>;
            case "prevSol":
                return <PrevSol changeScreen={this.changeScreen} changeData={this.changeData} 
                data={this.state.data} api={this.callApi}/>;
            default:
                return <div>error</div>;
        }
    }
}


//export default TravellingSalesman;
//root.render(<App state={"menu"}/>);
render(<App state={"menu"}/>, root);

export default App;

