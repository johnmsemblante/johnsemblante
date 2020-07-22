import React from 'react'
import { NavLink, Link } from 'react-router-dom';
import Logo from '../images/logo.png';

function Header(){
    return (
        <div className="header">
            <div className="header__inner">
                <div className="logo">
                    <Link to="/" className="logo__link">
                        <img src={Logo} className="logo__img" alt="John Clark Semblante"/>
                    </Link>
                </div>
                <div className="menu">
                    <ul className="menu__list">
                        <li className="menu__item">
                            <NavLink exact to="/" className="menu__link" activeClassName="active">Home</NavLink>
                        </li>
                        <li className="menu__item">
                            <NavLink exact to="/about" className="menu__link" activeClassName="active">About</NavLink>
                        </li>
                        <li className="menu__item">
                            <NavLink exact to="/projects" className="menu__link" activeClassName="active">Projects</NavLink>
                        </li>
                        <li className="menu__item">
                            <NavLink exact to="/contact" className="menu__link" activeClassName="active">Contact</NavLink>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    )
}

export default Header;