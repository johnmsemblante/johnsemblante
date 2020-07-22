import React, {useState} from 'react';

function Counter(){
    const [count, setCount] = useState(0);

    return(
        <div class="container">
            <h1>
                Number: {count}
            </h1>

            <h2 onClick={() => setCount(count + 1)}>
                Plus
            </h2>

            <h2 onClick={() => setCount(count - 1)}>
                Minus
            </h2>
        </div>
    )
}

export default Counter;