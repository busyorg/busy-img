import 'whatwg-fetch';
import React from 'react';
import ReactDOM from 'react-dom';
import Dropzone from 'react-dropzone';

class App extends React.Component {
    onDrop = (files) => {
        console.log('Received files: ', files);
        let pathname = window.location.pathname;
        if (pathname && typeof pathname === 'string' && pathname.split('/@')[1]) {
            let username = window.location.pathname.split('/@')[1];
            var data = new FormData()
            data.append('file', files[0])

            fetch('/@' + username, {
                method: 'POST',
                body: data
            }).then((response) => response.json())
                .then((data) => {
                    console.log(data);
                })
        } else {
            console.error('Invalid url username not found');
        }
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