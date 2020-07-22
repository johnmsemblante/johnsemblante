import React from 'react'
import { Link } from 'react-router-dom';

function Header(){
    return (
        <header>
            <ul className="header">
                <li className="header__item">
                    <Link to="/" className="header__link">Home</Link>
                </li>
                <li className="header__item">
                    <Link to="/counter" className="header__link">Counter</Link>
                </li>
            </ul>
        </header>
    )
}

export default Header;