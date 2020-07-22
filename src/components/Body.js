import React from 'react'
import {
    Switch,
    Route,
} from 'react-router-dom';
import Counter from '../views/Counter';
import Home from '../views/Home';

function Body(){
    return (
        <Switch>
          <Route exact path="/">
            <Home />
          </Route>
          <Route path="/counter">
            <Counter />
          </Route>
        </Switch>
    )
}

export default Body;