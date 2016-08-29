import 'whatwg-fetch';
import React from 'react';
import ReactDOM from 'react-dom';
import Dropzone from 'react-dropzone';

class App extends React.Component {
    onDrop = (files) => {
        console.log('Received files: ', files);
        
        var data = new FormData()
        data.append('file', files[0])

        fetch('/@nil1511', {
            method: 'POST',
            body: data
        }).then((response) => response.json())
            .then((data) => {
                console.log(data);
            })
    }

    render() {
        return (
            <div>
                <h2>Busy Img</h2>
                <Dropzone onDrop={this.onDrop} accept='image/*'>
                    <div>Try dropping some files here, or click to select files to upload.</div>
                </Dropzone>
            </div>
        );
    }
}

export default App;

ReactDOM.render(<App/>, document.getElementById('root'));