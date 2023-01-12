import React, { useEffect, useState, useRef } from "react";
import "../styles/coolDropdown.css";

function CoolDropdown(props){

    const [ menuOpen, setOpen ] = useState(false);
    const [ currentItem, setItem ] = useState(null);
    const containerRef = useRef();

    //recieves new value from betterMap through newSol
    useEffect(() => {
        if(props.value === null){
            setItem(null);
        }
    }, [props.value]);

    //managing event listeners - couldnt use react's built in one for some reason
    useEffect(() => {
        document.addEventListener("click", checkClick);

        return () => {
            document.removeEventListener("click", checkClick);
        }
    }, []);

    //clicking inside the container wont close it
    const checkClick = (event) => {
        if(!containerRef.current.contains(event.target)){
            setOpen(false);
        }
    }

    return (
        <div id="dropdown-container" ref={containerRef}>
            <div id="dropdown-select" onClick={() => setOpen(!menuOpen)} className={`${menuOpen ? "active" : ""}`} style={{ 
            color: menuOpen ? "inherit" : (currentItem === null ? "inherit" : `rgba(${currentItem.colour}, 1)`),
            fontWeight: menuOpen ? "normal" : (currentItem === null ? "normal" : 600) 
            }}>
                {
                    menuOpen ? "Select Node" : (currentItem === null ? "Select Node" : currentItem.name)
                }
            </div>
            {
                menuOpen 
                ? <>
                    <ul id="dropdown-options" style={{ maxHeight: props.maxHeight }}>
                        {
                            props.options.length === 0 ? <li style={{ pointerEvents: "none" }}>{props.emptyMessage}</li> 
                            : props.options.map(option => (
                                <li key={option.name} onClick={() => {
                                    setItem(option);
                                    props.onSelect(option);
                                    setOpen(false);
                                }} 
                                onMouseEnter={(event) => {
                                    event.target.style.color = `rgba(${option.colour}, 1)`;
                                }}
                                onMouseLeave={(event) => {
                                    event.target.style.color = "rgba(125, 125, 125, 1)";
                                }}>
                                    {
                                        option.name
                                    }
                                </li>
                            ))
                        }
                    </ul>
                </>
                : null
            }
        </div>
    );
}

export default CoolDropdown