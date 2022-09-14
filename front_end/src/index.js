import React from 'react';
import ReactDOM from 'react-dom/client';

import NewSol from "./components/NewSol";
import MainMenu from "./components/MainMenu";
import PrevSol from "./components/PrevSol";

const root = ReactDOM.createRoot(document.getElementById("root"));

class App extends React.Component{

    constructor(props){
        super(props);
        this.state = {
            currentScreen: props.state
        };

        this.changeScreen = this.changeScreen.bind(this);
    }

    changeScreen(state){
        this.setState({
            currentScreen: state
        });
    }

    render(){
        switch(this.state.currentScreen){
            case "menu":
                return <MainMenu changeScreen={this.changeScreen}/>;
            case "newSol":
                return <NewSol changeScreen={this.changeScreen}/>;
            case "prevSol":
                return <PrevSol changeScreen={this.changeScreen}/>;
            default:
                return <div>error</div>;
        }
    }
}

root.render(<App state={"menu"}/>);

