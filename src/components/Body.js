import React from 'react'
import {
    Switch,
    Route,
} from 'react-router-dom';
import Counter from '../views/Counter';
import Home from '../views/Home';
import About from '../views/About';

function Body(){
    return (
        <Switch>
          <Route exact path="/">
            <Home />
          </Route>
          <Route path="/about">
            <About />
          </Route>
          <Route path="/counter">
            <Counter />
          </Route>
        </Switch>
    )
}

export default Body;