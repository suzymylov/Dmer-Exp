import fs from 'fs'
import path from 'path'

const LOG_FILE = path.join(process.cwd(), 'chat-logs.txt')

export function logToFile(message: string) {
  const timestamp = new Date().toISOString()
  const logMessage = `${timestamp}: ${message}\n`
  
  fs.appendFileSync(LOG_FILE, logMessage)
} 