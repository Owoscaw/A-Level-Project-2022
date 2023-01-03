import React, { useEffect, useState, useRef } from "react";
import "../styles/coolDropdown.css";

function CoolDropdown(props){

    const [ menuOpen, setOpen ] = useState(false);
    const [ currentItem, setItem ] = useState(null);
    const containerRef = useRef();

    useEffect(() => {
        if(props.value === null){
            setItem(null);
        }
    }, [props.value]);

    useEffect(() => {
        document.addEventListener("click", checkClick);

        return () => {
            document.removeEventListener("click", checkClick);
        }
    }, []);

    const checkClick = (event) => {
        if(!containerRef.current.contains(event.target)){
            setOpen(false);
        }
    }

    return (
        <div id="dropdown-container" ref={containerRef}>
            <div id="dropdown-value" className={`${menuOpen ? "active" : ""}`} style={{ 
                color: currentItem === null ? "inherit" : `rgba(${currentItem.colour}, 1)`,
                fontWeight: currentItem === null ? "normal" : 600
             }} 
            onClick={() => setOpen(!menuOpen)}>
                {
                    currentItem === null ? props.defaultValue : currentItem.name
                }
            </div>
            {
                menuOpen 
                ? <ul id="dropdown-options" style={{ maxHeight: props.maxHeight }}>
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
                : null
            }
        </div>
    );
}

export default CoolDropdown