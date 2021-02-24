export const machineTypes = [
  { name: 'n1-standard-1', cpu: 1, memory: 3.75, price: 0.0475, preemptiblePrice: 0.0100 },
  { name: 'n1-standard-2', cpu: 2, memory: 7.50, price: 0.0950, preemptiblePrice: 0.0200 },
  { name: 'n1-standard-4', cpu: 4, memory: 15, price: 0.1900, preemptiblePrice: 0.0400 },
  { name: 'n1-standard-8', cpu: 8, memory: 30, price: 0.3800, preemptiblePrice: 0.0800 },
  { name: 'n1-standard-16', cpu: 16, memory: 60, price: 0.7600, preemptiblePrice: 0.1600 },
  { name: 'n1-standard-32', cpu: 32, memory: 120, price: 1.5200, preemptiblePrice: 0.3200 },
  { name: 'n1-standard-64', cpu: 64, memory: 240, price: 3.0400, preemptiblePrice: 0.6400 },
  { name: 'n1-standard-96', cpu: 96, memory: 360, price: 4.5600, preemptiblePrice: 0.9600 },
  { name: 'n1-highmem-2', cpu: 2, memory: 13, price: 0.1184, preemptiblePrice: 0.0250 },
  { name: 'n1-highmem-4', cpu: 4, memory: 26, price: 0.2368, preemptiblePrice: 0.0500 },
  { name: 'n1-highmem-8', cpu: 8, memory: 52, price: 0.4736, preemptiblePrice: 0.1000 },
  { name: 'n1-highmem-16', cpu: 16, memory: 104, price: 0.9472, preemptiblePrice: 0.2000 },
  { name: 'n1-highmem-32', cpu: 32, memory: 208, price: 1.8944, preemptiblePrice: 0.4000 },
  { name: 'n1-highmem-64', cpu: 64, memory: 416, price: 3.7888, preemptiblePrice: 0.8000 },
  { name: 'n1-highmem-96', cpu: 96, memory: 624, price: 5.6832, preemptiblePrice: 1.2000 },
  { name: 'n1-highcpu-2', cpu: 2, memory: 1.8, price: 0.0709, preemptiblePrice: 0.0150 },
  { name: 'n1-highcpu-4', cpu: 4, memory: 3.6, price: 0.1418, preemptiblePrice: 0.0300 },
  { name: 'n1-highcpu-8', cpu: 8, memory: 7.2, price: 0.2836, preemptiblePrice: 0.0600 },
  { name: 'n1-highcpu-16', cpu: 16, memory: 14.4, price: 0.5672, preemptiblePrice: 0.1200 },
  { name: 'n1-highcpu-32', cpu: 32, memory: 28.8, price: 1.1344, preemptiblePrice: 0.2400 },
  { name: 'n1-highcpu-64', cpu: 64, memory: 57.6, price: 2.2688, preemptiblePrice: 0.4800 },
  { name: 'n1-highcpu-96', cpu: 96, memory: 86.4, price: 3.402, preemptiblePrice: 0.7200 }
]

export const cloudServices = {
  GCE: 'GCE',
  DATAPROC: 'DATAPROC'
}

export const monthlyStoragePrice = 0.04 // from https://cloud.google.com/compute/pricing
export const storagePrice = monthlyStoragePrice / 730 // per GB hour using 730 hours per month from https://cloud.google.com/compute/pricing
export const dataprocCpuPrice = 0.01 // dataproc costs $0.01 per cpu per hour
export const ephemeralExternalIpAddressPrice = { // per hour in dollars for Iowa (us-central1) region per https://cloud.google.com/vpc/network-pricing#ipaddress
  standard: 0.004,
  preemptible: 0.002
}

export const version = '6' // updated jupyter-iframe-extension.js

export const dataSyncingDocUrl = 'https://support.terra.bio/hc/en-us/articles/360034505132--Lock-and-Playground-Notebook-Modes'
