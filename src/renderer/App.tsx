import { Device } from '../main/devices';

import { useState, useEffect } from 'react';
import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
// import icon from '../../assets/icon.svg';
import './App.css';

function Product(props: { id: string; opened: boolean; name?: string }) {
  const { id, opened, name } = props;
  return (
    <div>
      <h2>{name}</h2>
      <button
        className="btn btn-primary"
        type="button"
        onClick={() => {
          if (opened) window.electron.closeDevice(id);
          else window.electron.openDevice(id);
        }}
      >
        {opened ? 'Disconnect' : 'Connect'}
      </button>
    </div>
  );
}
Product.defaultProps = {
  name: '',
};

function ProductList() {
  const [devices, setDevices] = useState<Device[] | []>([]);

  useEffect(() => {
    async function loadDevices() {
      const result = await window.electron.getDeviceList();
      if (result) setDevices(result);

      window.electron.registerForUpdateDeviceList();
    }
    loadDevices();

    window.electron.onUpdateDeviceList((result) => {
      if (result) setDevices(result);
    });
  }, []);

  return (
    <div>
      <h1>Available Controllers</h1>
      <ul>
        {devices.map((device) => (
          <li key={device.id}>
            <Product id={device.id} opened={device.opened} name={device.name} />
          </li>
        ))}
      </ul>
    </div>
  );
}

const Hello = () => {
  return (
    <div>
      <ProductList />
    </div>
  );
};

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Hello />} />
      </Routes>
    </Router>
  );
}
