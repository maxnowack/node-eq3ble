import NobleDevice from 'noble-device';
import {
  serviceUuid,
  writeCharacteristic,
  notificationCharacteristic,
  payload,
  parseInfo,
  parseProfile,
} from './interface';

class EQ3BLE {
  static SCAN_UUIDS = [serviceUuid]
  static is = peripheral => peripheral.advertisement.localName === 'CC-RT-BLE' || peripheral.advertisement.localName === 'CC-RT-M-BLE'

  constructor(device) {
    NobleDevice.call(this, device);
    this.notificationCallbacks = [];
  }
  onNotify(...args) {
    const callback = this.notificationCallbacks.shift();
    if (!callback) {
      this.emit('unhandledNotification', ...args);
      return;
    }
    callback(...args);
  }
  getNextNotification() {
    return new Promise((resolve, reject) => {
      let timeoutId;
      let removeCallback;
      const callback = (...args) => {
        clearTimeout(timeoutId);
        removeCallback();
        resolve(...args);
      };
      removeCallback = () => {
        this.notificationCallbacks = this.notificationCallbacks.filter(cb => cb !== callback);
      };
      this.notificationCallbacks.push(callback);
      setTimeout(() => {
        removeCallback();
        reject();
      }, 1000);
    });
  }
  writeAndGetNotification(data) {
    return new Promise((resolve, reject) => {
      this.getNextNotification().then(resolve, reject);
      this.writeDataCharacteristic(serviceUuid, writeCharacteristic, data, (err) => {
        if (err) reject(err);
      });
    });
  }

  connectAndSetup() {
    return new Promise((resolve, reject) => {
      NobleDevice.prototype.connectAndSetup.call(this, (error) => {
        if (error) {
          reject(error);
          return;
        }
        this.notifyCharacteristic(
          serviceUuid,
          notificationCharacteristic,
          true,
          this.onNotify.bind(this),
          (err) => {
            if (err) {
              reject(err);
              return;
            }
            resolve();
          },
        );
      });
    });
  }
  getInfo() {
    return this.writeAndGetNotification(payload.getInfo()).then(info => parseInfo(info));
  }
  setBoost(enable) {
    if (enable) {
      return this.writeAndGetNotification(payload.activateBoostmode());
    }
    return this.writeAndGetNotification(payload.deactivateBoostmode());
  }
  automaticMode() {
    return this.writeAndGetNotification(payload.setAutomaticMode());
  }
  manualMode() {
    return this.writeAndGetNotification(payload.setManualMode());
  }
  ecoMode() {
    return this.writeAndGetNotification(payload.setEcoMode());
  }
  setLock(enable) {
    if (enable) {
      return this.writeAndGetNotification(payload.lockThermostat());
    }
    return this.writeAndGetNotification(payload.unlockThermostat());
  }
  turnOff() {
    return this.setTemperature(4.5);
  }
  turnOn() {
    return this.setTemperature(30);
  }
  setTemperature(temperature) {
    return this.writeAndGetNotification(payload.setTemperature(temperature))
      .then(info => parseInfo(info));
  }
  requestProfile(day) {
    return this.writeAndGetNotification(payload.requestProfile(day))
      .then(profile => parseProfile(profile));
  }
  setProfile(day, periods) {
    return this.writeAndGetNotification(payload.setProfile(day, periods))
      .then(result => result[0] === 2 && result[1] === 2);
  }
  setTemperatureOffset(offset) {
    return this.writeAndGetNotification(payload.setTemperatureOffset(offset));
  }
  updateOpenWindowConfiguration(temperature, duration) {
    return this.writeAndGetNotification(payload.setWindowOpen(temperature, duration));
  }
  setDateTime(date) {
    return this.writeAndGetNotification(payload.setDatetime(date)).then(info => parseInfo(info));
  }
}
NobleDevice.Util.inherits(EQ3BLE, NobleDevice);

export default EQ3BLE;
