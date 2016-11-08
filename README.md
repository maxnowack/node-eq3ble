# EQ3BLE
node.js package to control an EQ3 bluetooth thermostat

## discovering
See the [noble-device discovering api](https://github.com/sandeepmistry/noble-device/#discovery-api) for more methods
````javascript
import EQ3BLE from 'eq3ble'

EQ3BLE.discover((device) => {
  device.connectAndSetup().then(() => {
    // ...
  })
})
````

## methods
every method returns a promise to indicate the execution progress

### `getInfo()`
reads the device info. Returns an object like this:
````javascript
{
  status: {
    manual: Boolean, // manual mode activated
    holiday: Boolean, // holiday mode activated
    boost: Boolean, // boost active
    dst: Boolean, // daylight saving time active
    openWindow: Boolean, // window is opened
    lowBattery: Boolean, // battery is low
  },
  valvePosition: Number, // 0-100 position of the valve
  targetTemperature: Number // temperature visible on the display
}
````

### `setBoost(Boolean)`
activates or deactivates the boost

### `automaticMode()`
switch to automatic mode

### `manualMode()`
switch to manual mode

### `ecoMode()`
switch to eco / holiday mode

### `setLock(Boolean)`
activates or deactivates locking

### `turnOff()`
turns off heating / sets valve position to 0

### `turnOn()`
turns on heating / sets valve position to 100

### `setTemperature(Number)`
sets the temperature (valid values are 4.5 - 30)

### `setTemperatureOffset(Number)`
sets the temperature offset

### `updateOpenWindowConfiguration(temperature: Number, duration: Number)`
updates the window open configuration

### `setDateTime(Date)`
updates the date and time of the thermostat


## License
Licensed under GPLv3 license. Copyright (c) 2015 Max Nowack

## Contributions
Contributions are welcome. Please open issues and/or file Pull Requests.

## Maintainers
- Max Nowack ([maxnowack](https://github.com/maxnowack))
