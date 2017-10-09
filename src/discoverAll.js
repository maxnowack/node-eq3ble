import noble from 'noble';
import { EventEmitter } from 'events';
import Thermostat from './Thermostat';
import { deviceName } from './interface';

class DiscoverHelper extends EventEmitter {
  constructor() {
    super();
    this.poweredOn = noble.state === 'poweredOn';
    noble.on('stateChange', (state) => {
      if (state === 'poweredOn') {
        this.poweredOn = true;
        this.emit('poweredOn');
      } else {
        this.poweredOn = false;
        this.emit('poweredOff');
      }
    });
  }

  startDiscovering(callback, timeout) {
    noble.startScanning();
    this.emit('startScanning');
    setTimeout(() => {
      noble.stopScanning();
      this.emit('stopScanning');
    }, timeout);

    noble.on('discover', (peripheral) => {
      if (peripheral.advertisement.localName !== deviceName) return;
      callback(new Thermostat(peripheral));
    });
  }
}

const discoverHelper = new DiscoverHelper();

export default (callback, timeout = 60 * 1000) => {
  if (discoverHelper.poweredOn) {
    discoverHelper.startDiscovering(callback, timeout);
  } else {
    discoverHelper.once('poweredOn', () => discoverHelper.startDiscovering(callback, timeout));
  }
  return discoverHelper;
};
