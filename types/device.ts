export interface Device {
  device_name: string
  location: string
  serial_number: string
}

export interface GroupedDevice {
  device_name: string
  locations: Array<{
    name: string
    serial_numbers: string[]
  }>
}

