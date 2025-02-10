'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface Device {
  device_name: string
  location: string
  serial_number: string
}

interface DeviceDetailsProps {
  devices: Device[]
}

export function DeviceDetails({ devices }: DeviceDetailsProps) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 text-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-zinc-400">Device Name</TableHead>
            <TableHead className="text-zinc-400">Location</TableHead>
            <TableHead className="text-zinc-400">Serial Number</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {devices.map((device, index) => (
            <TableRow key={index}>
              <TableCell>{device.device_name}</TableCell>
              <TableCell>{device.location}</TableCell>
              <TableCell className="font-mono">{device.serial_number}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

