import { EventEmitter } from 'events';
import pTimeout from 'p-timeout';
import {
  payload,
  parseInfo,
  parseProfile,
  serviceUuid,
  writeCharacteristicUuid,
  notificationCharacteristicUuid,
} from './interface';

export default class Thermostat extends EventEmitter {
  constructor(device) {
    super();
    this.minTemperature = 4.5;
    this.maxTemperature = 30;
    this.device = device;
    this.address = this.device.address;
    this.nextCommand = {};

    this.device.on('connect', () => {
      this.emit('connected');
      if (!this.nextCommand || !this.nextCommand.msg) {
        this.device.disconnect();
        return;
      }

      this.device.discoverSomeServicesAndCharacteristics([serviceUuid], [
        writeCharacteristicUuid,
        notificationCharacteristicUuid,
      ], (err, services, characteristics) => {
        this.emit('discovered');
        if (err) this.emit('error', err);
        let writeCharacteristic = null;
        let notificationCharacteristic = null;
        characteristics.forEach((characteristic) => {
          if (characteristic.uuid === writeCharacteristicUuid) writeCharacteristic = characteristic;
          if (characteristic.uuid === notificationCharacteristicUuid) {
            notificationCharacteristic = characteristic;
          }
        });
        notificationCharacteristic.once('data', data => this.nextCommand.callback(data));
        notificationCharacteristic.subscribe();
        setTimeout(() => {
          writeCharacteristic.write(this.nextCommand.msg, false, (error) => {
            this.emit('written');
            if (error) this.emit('error', error);
          });
        }, 500);
      });
    });
    this.device.connect();
  }

  handleInfo(value) {
    const info = parseInfo(value);
    const firstUpdate = !this.state;
    if (firstUpdate) this.state = {};
    Object.keys(info).forEach((key) => {
      if (this.state[key] === info[key]) return;
      this.state[key] = info[key];
      if (!firstUpdate) this.emit(`${key}Change`, info[key]);
    });
    this.emit('update', this.state);
  }

  sendCommand(msg) {
    return pTimeout(new Promise((resolve) => {
      this.nextCommand = {
        msg,
        callback: (data) => {
          this.emit('response', data);
          this.device.disconnect();
          resolve(data);
        },
      };
      this.device.connect();
    }), 5 * 60 * 1000);
  }

  getInfo() {
    return this.sendCommand(payload.getInfo())
      .then(data => this.handleInfo(data));
  }

  setBoost(enable) {
    if (enable) {
      return this.sendCommand(payload.activateBoostmode());
    }
    return this.sendCommand(payload.deactivateBoostmode());
  }

  automaticMode() {
    return this.sendCommand(payload.setAutomaticMode());
  }

  manualMode() {
    return this.sendCommand(payload.setManualMode());
  }

  ecoMode() {
    return this.sendCommand(payload.setEcoMode());
  }

  setLock(enable) {
    if (enable) {
      return this.sendCommand(payload.lockThermostat());
    }
    return this.sendCommand(payload.unlockThermostat());
  }

  turnOff() {
    return this.setTemperature(this.minTemperature);
  }

  turnOn() {
    return this.setTemperature(this.maxTemperature);
  }

  setTemperature(value) {
    let temperature = value;
    if (temperature < this.minTemperature) temperature = this.minTemperature;
    if (temperature > this.maxTemperature) temperature = this.maxTemperature;
    return this.sendCommand(payload.setTemperature(temperature))
      .then(data => this.handleInfo(data));
  }

  requestProfile(day) {
    return this.sendCommand(payload.requestProfile(day))
      .then(profile => parseProfile(profile));
  }

  setProfile(day, periods) {
    return this.sendCommand(payload.setProfile(day, periods))
      .then(result => result[0] === 2 && result[1] === 2);
  }

  setTemperatureOffset(offset) {
    return this.sendCommand(payload.setTemperatureOffset(offset));
  }

  updateOpenWindowConfiguration(temperature, duration) {
    return this.sendCommand(payload.setWindowOpen(temperature, duration));
  }

  setDateTime(date) {
    return this.sendCommand(payload.setDatetime(date))
      .then(data => this.handleInfo(data));
  }
}
