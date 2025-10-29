import './App.css';
import '@lynx-js/web-core/index.css';
import '@lynx-js/web-elements/index.css';
import '@lynx-js/web-core';
import '@lynx-js/web-elements/all';

const App = () => {
  return (
    <lynx-view
      style={{ height: '100vh', width: '100vw' }}
      url="http://192.168.0.109:3000/main.web.bundle"
    ></lynx-view>
  );
};

export default App;